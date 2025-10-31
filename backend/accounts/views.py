# accounts/views.py
# UPDATED VERSION WITH ENHANCED EMAIL FUNCTIONALITY AND ERROR HANDLING

from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.shortcuts import redirect
from django.contrib.auth import login
from django.urls import reverse
from django.conf import settings
from django.utils import timezone
from django.db import transaction
import urllib.parse
import logging
import traceback
import uuid

# Import email utilities with error handling
try:
    from utils.email import send_invite_email, send_rejection_email, send_request_confirmation_email
    EMAIL_UTILS_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import email utilities: {e}")
    EMAIL_UTILS_AVAILABLE = False
    # Create dummy functions if import fails
    def send_invite_email(email, code, name):
        logger.error("Email utilities not available - cannot send invite email")
        return False
    def send_rejection_email(email, name, reason):
        logger.error("Email utilities not available - cannot send rejection email")
        return False
    def send_request_confirmation_email(email, name):
        logger.error("Email utilities not available - cannot send confirmation email")
        return False

# For Google OAuth (if using dj-rest-auth)
try:
    from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
    from allauth.socialaccount.providers.oauth2.client import OAuth2Client
    from dj_rest_auth.registration.views import SocialLoginView
    ALLAUTH_INSTALLED = True
except ImportError:
    ALLAUTH_INSTALLED = False
    
from .models import UserProfile, SiteSettings, InviteCode, AccountRequest
from .serializers import UserProfileSerializer, UserSerializer, RegisterSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

# ============== JWT Token Customization ==============

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to include user data in response"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Since USERNAME_FIELD is 'email', update the fields
        if User.USERNAME_FIELD == 'email':
            self.fields[self.username_field].label = 'Email'
    
    def validate(self, attrs):
        logger.info(f"Login attempt with fields: {list(attrs.keys())}")
        
        try:
            data = super().validate(attrs)
            
            # Add user data to response
            data['user'] = {
                'id': self.user.id,
                'email': self.user.email,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'is_staff': self.user.is_staff,
            }
            
            logger.info(f"Successful login for user: {self.user.email}")
            return data
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            logger.error(f"Attrs received: {attrs}")
            raise

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user data with tokens"""
    serializer_class = CustomTokenObtainPairSerializer

# ============== User Registration & Management ==============

class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint with DUAL invite code support:
    1. invitation_code (UUID) - Case invitation that bypasses account requests
    2. invite_code (string) - Admin invite code for normal registration
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print("=" * 70)
        print("DEBUG: Registration started")
        print(f"DEBUG: Request data: {request.data}")
        print("=" * 70)
        
        try:
            # ========== NEW: CHECK FOR CASE INVITATION CODE FIRST ==========
            # This bypasses the entire account request workflow
            invitation_code = request.data.get('invitation_code')  # UUID format
            
            if invitation_code:
                print(f"DEBUG: Case invitation code detected: {invitation_code}")
                return self._handle_case_invitation_signup(request, invitation_code)
            
            # ========== EXISTING FLOW: Normal registration with admin invite codes ==========
            
            # Get site settings
            print("DEBUG: Getting site settings...")
            settings_obj = SiteSettings.get_settings()
            print(f"DEBUG: Registration mode: {settings_obj.registration_mode}")
            
            # Check registration mode
            if settings_obj.registration_mode == 'closed':
                print("DEBUG: Registration is closed")
                return Response({
                    'error': 'Registration is currently closed.',
                    'message': settings_obj.beta_message
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check user limit if set
            if settings_obj.max_users > 0 and settings_obj.current_user_count >= settings_obj.max_users:
                print(f"DEBUG: User limit reached: {settings_obj.current_user_count}/{settings_obj.max_users}")
                return Response({
                    'error': 'We\'ve reached our user limit. Please try again later.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check for invite code if in invite_only mode
            invite = None
            if settings_obj.registration_mode == 'invite_only':
                invite_code = request.data.get('invite_code', '').upper()
                print(f"DEBUG: Invite code provided: {invite_code}")
                
                if not invite_code:
                    print("DEBUG: No invite code provided")
                    return Response({
                        'error': 'An invite code is required during our beta period.',
                        'field_errors': {'invite_code': ['This field is required.']}
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate invite code
                try:
                    print(f"DEBUG: Looking up invite code: {invite_code}")
                    invite = InviteCode.objects.get(code=invite_code)
                    print(f"DEBUG: Invite found - Valid: {invite.is_valid()}")
                    
                    if not invite.is_valid():
                        print("DEBUG: Invite code is invalid/expired")
                        return Response({
                            'error': 'This invite code is expired or has been used.',
                            'field_errors': {'invite_code': ['Invalid or expired code.']}
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Check if restricted to specific email
                    email = request.data.get('email', '').lower()
                    print(f"DEBUG: Email check - Invite email: {invite.email}, User email: {email}")
                    
                    if invite.email and invite.email.lower() != email:
                        print("DEBUG: Email mismatch with invite code")
                        return Response({
                            'error': 'This invite code is not valid for your email address.',
                            'field_errors': {'invite_code': ['Code not valid for this email.']}
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                except InviteCode.DoesNotExist:
                    print(f"DEBUG: Invite code not found: {invite_code}")
                    return Response({
                        'error': 'Invalid invite code.',
                        'field_errors': {'invite_code': ['Code not found.']}
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the user
            print("DEBUG: Creating serializer...")
            serializer = self.get_serializer(data=request.data)
            
            print("DEBUG: Validating serializer...")
            if not serializer.is_valid():
                print(f"DEBUG: Serializer validation failed: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'field_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Save the user
            print("DEBUG: About to save user...")
            user = serializer.save()
            print(f"DEBUG: User created - ID: {user.id}, Email: {user.email}")
            print(f"DEBUG: User account_type: {user.account_type}")
            print(f"DEBUG: User is_staff: {user.is_staff}")
            
            # Double-check that the user is not staff
            if user.is_staff or user.is_superuser:
                print("DEBUG: Resetting staff/superuser flags")
                user.is_staff = False
                user.is_superuser = False
                user.save()
                logger.warning(f"Had to reset staff/superuser flags for new user: {user.email}")
            
            # Mark invite code as used if applicable
            if invite:
                print(f"DEBUG: Marking invite code as used...")
                invite.use(user)
                
                # If this invite came from an AccountRequest, mark it as completed
                account_request = AccountRequest.objects.filter(
                    invite_code=invite
                ).first()
                if account_request:
                    print(f"DEBUG: Marking account request as completed")
                    account_request.status = 'completed'
                    account_request.save()
            
            # Update user count
            print("DEBUG: Updating user count...")
            settings_obj.current_user_count = User.objects.filter(is_active=True).count()
            settings_obj.save()
            print(f"DEBUG: New user count: {settings_obj.current_user_count}")
            
            # Generate tokens for the new user
            print("DEBUG: Generating tokens...")
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            print(f"DEBUG: Tokens generated - Access length: {len(access_token)}, Refresh length: {len(refresh_token)}")
            
            logger.info(f"New user registered: {user.email} with invite code: {invite_code if invite else 'None'}")
            
            # Build response data
            print("DEBUG: Building response...")
            response_data = {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': False,
                    'account_type': user.account_type,
                },
                'access': access_token,
                'refresh': refresh_token,
                'message': 'Registration successful! You can now create your memorial page.'
            }
            
            print(f"DEBUG: Response data prepared: {response_data['user']}")
            print("DEBUG: About to return success response...")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("=" * 70)
            print(f"ERROR: Registration failed!")
            print(f"ERROR Type: {type(e).__name__}")
            print(f"ERROR Message: {str(e)}")
            print("=" * 70)
            
            import traceback
            traceback.print_exc()
            
            logger.error(f"Registration error for email {request.data.get('email', 'unknown')}: {str(e)}")
            logger.error(traceback.format_exc())
            
            return Response({
                'error': 'An error occurred during registration. Please try again.',
                'field_errors': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _handle_case_invitation_signup(self, request, invitation_code):
        """
        NEW METHOD: Handle signup via case invitation code.
        This bypasses the account request workflow entirely and provides immediate access.
        """
        print("=" * 70)
        print("DEBUG: Processing CASE INVITATION signup")
        print(f"DEBUG: Invitation code: {invitation_code}")
        print("=" * 70)
        
        try:
            # Import here to avoid circular imports
            from cases.models import CaseInvitation, CaseAccess
            
            # Validate UUID format
            try:
                uuid.UUID(invitation_code)
            except ValueError:
                print("DEBUG: Invalid UUID format for invitation code")
                return Response({
                    'error': 'Invalid invitation code format.',
                    'field_errors': {'invitation_code': ['Invalid code format.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Look up the case invitation
            try:
                print(f"DEBUG: Looking up CaseInvitation with code: {invitation_code}")
                invitation = CaseInvitation.objects.select_related('case', 'invited_by').get(
                    invitation_code=invitation_code,
                    status='pending'
                )
                print(f"DEBUG: Found invitation - Case: {invitation.case.case_title}, Email: {invitation.invitee_email}")
            except CaseInvitation.DoesNotExist:
                print("DEBUG: Invitation not found or already accepted")
                return Response({
                    'error': 'This invitation is invalid or has already been used.',
                    'field_errors': {'invitation_code': ['Invalid or expired invitation.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if invitation has expired
            if invitation.is_expired():
                print("DEBUG: Invitation has expired")
                invitation.status = 'expired'
                invitation.save()
                return Response({
                    'error': 'This invitation has expired.',
                    'field_errors': {'invitation_code': ['Invitation expired.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user data from request
            email = request.data.get('email', '').strip().lower()
            password = request.data.get('password')
            first_name = request.data.get('first_name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            
            print(f"DEBUG: User data - Email: {email}, Name: {first_name} {last_name}")
            
            # Validate required fields
            if not all([email, password, first_name, last_name]):
                print("DEBUG: Missing required fields")
                return Response({
                    'error': 'All fields are required.',
                    'field_errors': {
                        'email': ['Email is required.'] if not email else [],
                        'password': ['Password is required.'] if not password else [],
                        'first_name': ['First name is required.'] if not first_name else [],
                        'last_name': ['Last name is required.'] if not last_name else [],
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify email matches invitation (if invitation has email specified)
            if invitation.invitee_email and invitation.invitee_email.lower() != email:
                print(f"DEBUG: Email mismatch - Expected: {invitation.invitee_email}, Got: {email}")
                return Response({
                    'error': 'Email does not match the invitation.',
                    'field_errors': {'email': ['This email does not match the invitation.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                print(f"DEBUG: Email already exists: {email}")
                return Response({
                    'error': 'An account with this email already exists.',
                    'field_errors': {'email': ['Email already registered.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user and case access in a transaction
            print("DEBUG: Starting transaction to create user and case access")
            with transaction.atomic():
                # Determine access level AND account type based on invitation type
                access_level_map = {
                    'police': 'leo',
                    'investigator': 'private_investigator',
                    'advocate': 'advocate',
                    'family': 'collaborator',
                    'other': 'viewer'
                }
                access_level = access_level_map.get(invitation.invitation_type, 'viewer')
                
                # Map invitation type to User.account_type
                account_type_map = {
                    'police': 'leo',           # Police get LEO account type
                    'investigator': 'leo',     # Private investigators also get LEO
                    'advocate': 'advocate',    # Advocates get advocate type
                    'family': 'verified',      # Family members get verified
                    'other': 'basic'          # Others get basic
                }
                account_type = account_type_map.get(invitation.invitation_type, 'basic')
                
                print(f"DEBUG: Invitation type: {invitation.invitation_type}")
                print(f"DEBUG: Access level: {access_level}")
                print(f"DEBUG: Account type: {account_type}")
                
                # Create the user with mapped account_type
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    username=email,  # Use email as username
                    account_type=account_type,  # Use mapped account_type
                    is_active=True,  # Active immediately - no approval needed
                    is_staff=False,  # Never make staff from invitation
                    is_superuser=False
                )
                print(f"DEBUG: User created - ID: {user.id}, account_type: {user.account_type}")
                
                # Create UserProfile with appropriate settings based on account_type
                profile_verified = account_type in ['leo', 'advocate', 'verified']
                profile_can_create = account_type in ['advocate', 'verified']
                profile_max_cases = 1 if account_type == 'verified' else 0
                
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'verified': profile_verified,
                        'can_create_cases': profile_can_create,
                        'max_cases': profile_max_cases,
                        'current_cases': 0,
                        'account_type': account_type  # Also set on profile
                    }
                )
                print(f"DEBUG: UserProfile created: {created}, verified: {profile_verified}")
                
                # Create the CaseAccess record
                print(f"DEBUG: Creating CaseAccess for case: {invitation.case.id}")
                case_access = CaseAccess.objects.create(
                    case=invitation.case,
                    user=user,
                    access_level=access_level,
                    invited_by=invitation.invited_by,
                    invitation_message=invitation.message_body,
                    accepted=True,  # Auto-accept since they're signing up
                    accepted_at=timezone.now(),
                    # LEO permissions - read-only access
                    can_view_tips=True,                    # ✅ See all tips/messages
                    can_view_tracking=True,                # ✅ See metrics
                    can_view_personal_info=True,           # ✅ See case details
                    can_view_evidence=True,                # ✅ See photos
                    can_export_data=True,                  # ✅ Export reports
                    can_contact_family=True,               # ✅ Message family
                    read_only=True,                        # ✅ Mark as read-only
                )
                print(f"DEBUG: CaseAccess created - ID: {case_access.id}")
                
                # Mark invitation as accepted
                invitation.status = 'accepted'
                invitation.accepted_at = timezone.now()
                invitation.accepted_by = user
                invitation.save()
                print("DEBUG: Invitation marked as accepted")
            
            print("DEBUG: Transaction completed successfully")
            
            # Update user count
            settings_obj = SiteSettings.get_settings()
            settings_obj.current_user_count = User.objects.filter(is_active=True).count()
            settings_obj.save()
            print(f"DEBUG: Updated user count: {settings_obj.current_user_count}")
            
            # Generate tokens for immediate login
            print("DEBUG: Generating authentication tokens")
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            logger.info(
                f"New user registered via case invitation: {user.email} "
                f"(account_type: {user.account_type}, case: {invitation.case.case_title})"
            )
            
            print("=" * 70)
            print("DEBUG: Case invitation signup SUCCESSFUL!")
            print(f"DEBUG: User {user.email} now has access to case {invitation.case.id}")
            print("=" * 70)
            
            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': False,
                    'account_type': user.account_type,
                },
                'refresh': refresh_token,
                'access': access_token,
                'message': 'Account created successfully! You now have access to the case.',
                'case_id': invitation.case.id,
                'case_title': invitation.case.case_title,
                'access_level': access_level
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"DEBUG: Exception during case invitation signup: {str(e)}")
            logger.error(f"Case invitation signup error: {str(e)}")
            traceback.print_exc()
            
            return Response({
                'error': 'An error occurred during registration. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============== Registration Status Check ==============

class RegistrationStatusView(APIView):
    """Check current registration status and mode"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        settings_obj = SiteSettings.get_settings()
        return Response({
            'mode': settings_obj.registration_mode,
            'message': settings_obj.beta_message,
            'google_auth_enabled': settings_obj.enable_google_auth,
            'user_count': settings_obj.current_user_count,
            'max_users': settings_obj.max_users if settings_obj.max_users > 0 else None
        })

# ============== Public Invite Status ==============

@api_view(['GET'])
@permission_classes([AllowAny])
def public_invite_status(request):
    """Check if invites are currently available"""
    try:
        settings_obj = SiteSettings.get_settings()
        return Response({
            'registration_mode': settings_obj.registration_mode,
            'is_invite_only': settings_obj.registration_mode == 'invite_only',
            'is_closed': settings_obj.registration_mode == 'closed',
            'is_open': settings_obj.registration_mode == 'open',
            'message': settings_obj.beta_message,
            'user_count': settings_obj.current_user_count,
            'max_users': settings_obj.max_users if settings_obj.max_users > 0 else None,
            'can_register': settings_obj.registration_mode != 'closed',
        })
    except Exception as e:
        logger.error(f"Error checking public invite status: {str(e)}")
        return Response({
            'error': 'Failed to check registration status',
            'can_register': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============== Site Settings Management ==============

class SiteSettingsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        settings_obj = SiteSettings.get_settings()
        return Response({
            'registration_mode': settings_obj.registration_mode,
            'beta_message': settings_obj.beta_message,
            'invite_only_mode': settings_obj.invite_only_mode,
            'beta_mode_enabled': settings_obj.invite_only_mode,
            'enable_google_auth': settings_obj.enable_google_auth,
            'enable_case_creation': settings_obj.enable_case_creation,
            'enable_public_pages': settings_obj.enable_public_pages,
            'max_users': settings_obj.max_users,
            'maintenance_mode': settings_obj.maintenance_mode,
            'maintenance_message': settings_obj.maintenance_message,
        })
    
    def patch(self, request):
            print("=" * 70)
            print("DEBUG: SiteSettingsView.patch() called!")
            print(f"DEBUG: Request data: {request.data}")
            print(f"DEBUG: User: {request.user.email}")
            print(f"DEBUG: Is staff: {request.user.is_staff}")
            print("=" * 70)
            
            try:
                settings_obj = SiteSettings.get_settings()
                print(f"DEBUG: Got settings - current registration_mode: {settings_obj.registration_mode}")
                
                # Handle the frontend's beta_mode_enabled field name
                if 'beta_mode_enabled' in request.data:
                    beta_enabled = request.data['beta_mode_enabled']
                    print(f"DEBUG: beta_mode_enabled found: {beta_enabled}")
                    request.data['invite_only_mode'] = beta_enabled
                    # Also set registration_mode based on the toggle
                    request.data['registration_mode'] = 'invite_only' if beta_enabled else 'open'
                    print(f"DEBUG: Set registration_mode to: {request.data['registration_mode']}")
                
                # Handle direct registration_mode updates
                if 'invite_only_mode' in request.data and 'registration_mode' not in request.data:
                    # If only invite_only_mode was provided, sync registration_mode
                    invite_only = request.data['invite_only_mode']
                    request.data['registration_mode'] = 'invite_only' if invite_only else 'open'
                    print(f"DEBUG: Synced registration_mode to: {request.data['registration_mode']}")
                
                # Update allowed fields
                update_fields = [
                    'registration_mode', 'beta_message', 'enable_google_auth',
                    'enable_case_creation', 'enable_public_pages', 'max_users',
                    'maintenance_mode', 'maintenance_message', 
                    'invite_only_mode'
                ]
                
                for field in update_fields:
                    if field in request.data:
                        old_value = getattr(settings_obj, field)
                        new_value = request.data[field]
                        print(f"DEBUG: Updating {field}: {old_value} -> {new_value}")
                        setattr(settings_obj, field, new_value)
                
                settings_obj.updated_by = request.user
                settings_obj.save()
                print("DEBUG: Settings saved successfully!")
                
                logger.info(f"Site settings updated by {request.user.email}")
                
                print("=" * 70)
                print("DEBUG: Returning response")
                print(f"DEBUG: Final registration_mode: {settings_obj.registration_mode}")
                print(f"DEBUG: Final invite_only_mode: {settings_obj.invite_only_mode}")
                print("=" * 70)
                
                return Response({
                    'status': 'Settings updated successfully',
                    'registration_mode': settings_obj.registration_mode,
                    'invite_only_mode': settings_obj.invite_only_mode,
                    'beta_mode_enabled': settings_obj.invite_only_mode
                })
            
            except Exception as e:
                print("=" * 70)
                print(f"DEBUG: ERROR in patch method: {e}")
                import traceback
                traceback.print_exc()
                print("=" * 70)
                logger.error(f"Error patching settings: {e}")
                logger.error(traceback.format_exc())
                
                return Response({
                    'error': 'Failed to update settings',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============= Notification View ======================

class NotificationView(APIView):
    """Get notifications including pending account requests for admins"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        notifications = []
        
        # Add account requests as notifications for admins
        if request.user.is_staff or request.user.is_superuser:
            pending_requests = AccountRequest.objects.filter(status='pending').order_by('-submitted_at')[:5]
            for req in pending_requests:
                notifications.append({
                    'id': f'request_{req.id}',
                    'type': 'account_request',
                    'message': f'New account request from {req.first_name} {req.last_name}',
                    'time': req.submitted_at.strftime('%B %d at %I:%M %p'),
                    'read': False,
                    'urgent': True
                })
        
        return Response(notifications)

# ============== Account Request Management ==============

class AccountRequestView(APIView):
    """Handle account requests"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Submit a new account request"""
        logger.info(f"Received account request data: {request.data}")
        
        required_fields = ['first_name', 'last_name', 'email', 'phone', 'description']
        
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field.replace("_", " ").title()} is required',
                    'error_type': 'missing_field'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        email = request.data.get('email')
        
        # Check for existing account
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'An account already exists with this email address. Please sign in instead.',
                'error_type': 'account_exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for existing request
        existing_request = AccountRequest.objects.filter(email=email).first()
        if existing_request:
            if existing_request.status == 'pending':
                return Response({
                    'error': f'A request for this email is already pending (submitted {existing_request.submitted_at.strftime("%B %d, %Y")}). We\'ll review it within 48 hours.',
                    'error_type': 'pending_request'
                }, status=status.HTTP_400_BAD_REQUEST)
            elif existing_request.status == 'approved':
                return Response({
                    'error': 'This email has already been approved. Check your email for the invite code or go to sign up.',
                    'error_type': 'already_approved'
                }, status=status.HTTP_400_BAD_REQUEST)
            elif existing_request.status == 'rejected':
                # Allow resubmission if previously rejected
                logger.info(f"Deleting previous rejected request for {email}")
                existing_request.delete()
        
        # Create the account request
        try:
            account_request = AccountRequest.objects.create(
                first_name=request.data['first_name'],
                last_name=request.data['last_name'],
                email=email,
                phone=request.data['phone'],
                relation=request.data.get('relation', ''),
                organization=request.data.get('organization', ''),
                location=request.data.get('location', ''),
                description=request.data['description'],
                supporting_links=request.data.get('supporting_links', '')
            )
            
            # Send confirmation email
            try:
                if EMAIL_UTILS_AVAILABLE and hasattr(locals(), 'send_request_confirmation_email'):
                    send_request_confirmation_email(email, request.data['first_name'])
                    logger.info(f"Confirmation email sent to {email}")
            except Exception as e:
                logger.warning(f"Failed to send confirmation email: {e}")
            
            # Check if auto-approval is enabled
            settings_obj = SiteSettings.get_settings()
            if settings_obj.auto_approve_requests:
                # Auto-approve and create invite
                invite = account_request.approve_and_create_invite(None)
                
                # Send invite email
                email_sent = False
                try:
                    if EMAIL_UTILS_AVAILABLE:
                        email_sent = send_invite_email(
                            account_request.email, 
                            invite.code, 
                            account_request.first_name
                        )
                        logger.info(f"Auto-approval: Invite email {'sent' if email_sent else 'failed'} for {email}")
                except Exception as e:
                    logger.error(f"Failed to send auto-approval email: {e}")
                
                message = f'Your request has been approved! Check your email for invite code: {invite.code}'
            else:
                message = 'Your request has been submitted and is under review. We\'ll contact you within 48 hours.'
            
            logger.info(f"Account request created successfully for {email}")
            
            return Response({
                'message': message,
                'request_id': account_request.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating account request: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                'error': 'Failed to create account request. Please try again.',
                'error_type': 'server_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccountRequestAdminView(APIView):
    """Admin endpoints for managing account requests"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get account requests with optional filtering"""
        status_filter = request.GET.get('status', 'pending')
        if status_filter == 'all':
            account_requests = AccountRequest.objects.all().order_by('-submitted_at')
        else:
            account_requests = AccountRequest.objects.filter(status=status_filter).order_by('-submitted_at')
        
        # Build detailed response
        data = []
        for req in account_requests:
            request_data = {
                'id': req.id,
                'name': f'{req.first_name} {req.last_name}',
                'first_name': req.first_name,
                'last_name': req.last_name,
                'email': req.email,
                'phone': req.phone,
                'relation': req.relation,
                'organization': req.organization,
                'location': req.location,
                'description': req.description,
                'supporting_links': req.supporting_links,
                'status': req.status,
                'submitted_at': req.submitted_at,
                'reviewed_at': req.reviewed_at,
                'reviewed_by': req.reviewed_by.email if req.reviewed_by else None,
                'rejection_reason': req.rejection_reason,
            }
            
            # Add invite code if exists
            if req.invite_code:
                request_data['invite_code'] = req.invite_code.code
            
            data.append(request_data)
        
        return Response(data)
    
    def post(self, request):
        """Approve or reject an account request"""
        request_id = request.data.get('request_id')
        action = request.data.get('action')
        
        print("=" * 70)
        print("DEBUG: AccountRequestAdminView.post() called")
        print(f"DEBUG: Action: {action}")
        print(f"DEBUG: Request ID: {request_id}")
        print(f"DEBUG: EMAIL_UTILS_AVAILABLE = {EMAIL_UTILS_AVAILABLE}")
        print("=" * 70)
        
        logger.info(f"Admin action received: {action} for request_id: {request_id}")
        
        if not request_id or action not in ['approve', 'reject']:
            print(f"DEBUG: Invalid request - action={action}, request_id={request_id}")
            return Response({
                'error': 'Invalid request - missing request_id or invalid action'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            account_request = AccountRequest.objects.get(id=request_id)
            print(f"DEBUG: Found account request for {account_request.email}")
            
            if action == 'approve':
                print("DEBUG: Processing APPROVE action")
                
                # Create invite code
                invite = account_request.approve_and_create_invite(request.user)
                print(f"DEBUG: Invite code created: {invite.code}")
                
                # Send invite email
                print(f"DEBUG: Attempting to send email to {account_request.email}")
                email_sent = False
                
                try:
                    if EMAIL_UTILS_AVAILABLE:
                        print("DEBUG: Email utilities are available, sending email...")
                        email_sent = send_invite_email(
                            account_request.email, 
                            invite.code, 
                            account_request.first_name
                        )
                        print(f"DEBUG: Email send result: {email_sent}")
                    else:
                        print("DEBUG: Email utilities NOT available")
                except Exception as email_error:
                    print(f"DEBUG: Email error: {str(email_error)}")
                    logger.error(f"Email sending failed: {str(email_error)}")
                    logger.error(traceback.format_exc())
                
                logger.info(f"Account request approved for {account_request.email} by {request.user.email}")
                logger.info(f"Email {'sent' if email_sent else 'NOT sent'} to {account_request.email}")
                
                print("=" * 70)
                print(f"DEBUG: Approval complete - Email sent: {email_sent}")
                print("=" * 70)
                
                return Response({
                    'message': f'Request approved. Invite code: {invite.code}',
                    'invite_code': invite.code,
                    'email_sent': email_sent
                })
            
            elif action == 'reject':
                print("DEBUG: Processing REJECT action")
                reason = request.data.get('reason', 'No reason provided')
                account_request.reject(request.user, reason)
                
                # Send rejection email
                email_sent = False
                try:
                    if EMAIL_UTILS_AVAILABLE:
                        email_sent = send_rejection_email(
                            account_request.email, 
                            account_request.first_name, 
                            reason
                        )
                except Exception as e:
                    logger.error(f"Failed to send rejection email: {e}")
                
                logger.info(f"Account request rejected for {account_request.email} by {request.user.email}")
                
                print("=" * 70)
                print(f"DEBUG: Rejection complete - Email sent: {email_sent}")
                print("=" * 70)
                
                return Response({
                    'message': 'Request rejected',
                    'email_sent': email_sent
                })
                
        except AccountRequest.DoesNotExist:
            print(f"DEBUG: Account request {request_id} not found")
            logger.error(f"Account request {request_id} not found")
            return Response({
                'error': 'Account request not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            print(f"DEBUG: Error in admin action: {str(e)}")
            logger.error(f"Error processing account request action: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                'error': 'Failed to process request',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============== Invite Code Management ==============

class InviteCodeManagementView(APIView):
    """Admin endpoints for managing invite codes"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get all invite codes"""
        codes = InviteCode.objects.all().order_by('-created_at')
        
        data = []
        for code in codes:
            data.append({
                'id': code.id,
                'code': code.code,
                'email': code.email,
                'max_uses': code.max_uses,
                'times_used': code.times_used,
                'is_valid': code.is_valid(),
                'created_by': code.created_by.email if code.created_by else None,
                'created_at': code.created_at,
                'expires_at': code.expires_at,
                'used_by': [u.email for u in code.used_by.all()]
            })
        
        return Response(data)
    
    def post(self, request):
        """Create a new invite code"""
        email = request.data.get('email')  # Optional - restrict to specific email
        max_uses = request.data.get('max_uses', 1)
        expires_days = request.data.get('expires_days', 30)
        
        # Generate random code
        import random
        import string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Check if code already exists (very unlikely)
        while InviteCode.objects.filter(code=code).exists():
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        invite_code = InviteCode.objects.create(
            code=code,
            email=email if email else None,
            max_uses=max_uses,
            created_by=request.user,
            expires_at=timezone.now() + timedelta(days=expires_days)
        )
        
        logger.info(f"Invite code {code} created by {request.user.email}")
        
        return Response({
            'code': code,
            'email': email,
            'max_uses': max_uses,
            'expires_at': invite_code.expires_at
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request):
        """Delete an invite code"""
        code_id = request.data.get('code_id')
        
        try:
            invite_code = InviteCode.objects.get(id=code_id)
            code = invite_code.code
            invite_code.delete()
            
            logger.info(f"Invite code {code} deleted by {request.user.email}")
            
            return Response({'message': 'Invite code deleted'})
        except InviteCode.DoesNotExist:
            return Response({
                'error': 'Invite code not found'
            }, status=status.HTTP_404_NOT_FOUND)

# ============== User Profile Views ==============

class CurrentUserView(APIView):
    """Get current logged-in user data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserDetailView(APIView):
    """Get details for a specific user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class MyProfileView(APIView):
    """Get and update current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user.profile, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ============== Google OAuth Views ==============

class GoogleOAuthLoginView(APIView):
    """Initiate Google OAuth login flow"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Check if Google auth is enabled
        settings_obj = SiteSettings.get_settings()
        if not settings_obj.enable_google_auth:
            return Response({
                'error': 'Google authentication is not enabled'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Build OAuth URL
        redirect_uri = request.build_absolute_uri(reverse('google-oauth-callback'))
        
        google_auth_url = (
            f'https://accounts.google.com/o/oauth2/v2/auth?'
            f'client_id={settings.GOOGLE_OAUTH_CLIENT_ID}&'
            f'redirect_uri={urllib.parse.quote(redirect_uri)}&'
            f'response_type=code&'
            f'scope=openid email profile'
        )
        
        return Response({'auth_url': google_auth_url})


class GoogleOAuthCallbackView(APIView):
    """Handle Google OAuth callback"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # This is a placeholder - actual implementation would:
        # 1. Exchange code for tokens
        # 2. Get user info from Google
        # 3. Create or login user
        # 4. Return JWT tokens
        
        code = request.GET.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, you'd:
        # 1. Exchange code for access token
        # 2. Fetch user email from Google
        # 3. Create/login user
        # 4. Generate JWT
        
        # For now, just redirect to frontend
        frontend_url = settings.FRONTEND_URL
        return redirect(f'{frontend_url}/oauth-callback?code={code}')

# ============== Auth Views ==============

class LogoutView(APIView):
    """Logout user by blacklisting their refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'message': 'Logged out successfully'})
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({
                'error': 'Logout failed'
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Request password reset email"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        try:
            user = User.objects.get(email=email)
            # In production, send password reset email here
            # For now, just log
            logger.info(f"Password reset requested for {email}")
            
            return Response({
                'message': 'If an account exists with this email, a reset link will be sent.'
            })
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response({
                'message': 'If an account exists with this email, a reset link will be sent.'
            })

# ============== Admin User Management ==============

class AdminUsersListView(APIView):
    """Get list of all users (admin only)"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        
        data = []
        for user in users:
            try:
                profile = user.profile
                profile_data = {
                    'verified': profile.verified,
                    'can_create_cases': profile.can_create_cases,
                    'current_cases': profile.current_cases,
                    'max_cases': profile.max_cases
                }
            except:
                profile_data = {}
            
            data.append({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'account_type': user.account_type,
                'date_joined': user.date_joined,
                'profile': profile_data
            })
        
        return Response(data)


class AdminUserDetailView(APIView):
    """Get, update, or delete a specific user (admin only)"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Get user's profile
            try:
                profile = user.profile
                profile_data = {
                    'organization': profile.organization,
                    'role': profile.role,
                    'bio': profile.bio,
                    'phone': profile.phone,
                    'location': profile.location,
                    'preferred_contact': profile.preferred_contact,
                    'notifications_tips': profile.notifications_tips,
                    'notifications_updates': profile.notifications_updates,
                    'timezone': profile.timezone,
                    'language': profile.language,
                    'verified': profile.verified,
                    'can_create_cases': profile.can_create_cases,
                    'max_cases': profile.max_cases,
                    'current_cases': profile.current_cases,
                }
            except:
                profile_data = {}
            
            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'account_type': user.account_type,
                'phone': user.phone,
                'city': user.city,
                'state': user.state,
                'country': user.country,
                'zip_code': user.zip_code,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'profile': profile_data
            }
            
            return Response(user_data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {str(e)}")
            return Response(
                {'error': 'Failed to fetch user details'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, user_id):
        """Update user details"""
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            # Update user fields
            user_fields = ['email', 'username', 'first_name', 'last_name', 
                          'is_active', 'is_staff', 'is_superuser', 'account_type',
                          'phone', 'city', 'state', 'country', 'zip_code']
            
            for field in user_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
            
            if 'profile' in request.data:
                profile_data = request.data['profile']
                profile_fields = ['organization', 'role', 'bio', 'location',
                                 'preferred_contact', 'notifications_tips', 
                                 'notifications_updates', 'timezone', 'language',
                                 'verified', 'can_create_cases', 'max_cases']
                
                for field in profile_fields:
                    if field in profile_data:
                        setattr(profile, field, profile_data[field])
                
                profile.save()
            
            user.save()
            
            logger.info(f"Admin {request.user.email} updated user {user.email}")
            
            return self.get(request, user_id)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}")
            return Response(
                {'error': 'Failed to update user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, user_id):
        """Partial update user details"""
        try:
            user = User.objects.get(id=user_id)
            
            if 'is_active' in request.data:
                user.is_active = request.data['is_active']
                action = "activated" if user.is_active else "deactivated"
                logger.info(f"Admin {request.user.email} {action} user {user.email}")
            
            if 'is_staff' in request.data:
                user.is_staff = request.data['is_staff']
            
            if 'is_superuser' in request.data:
                user.is_superuser = request.data['is_superuser']
            
            for field, value in request.data.items():
                if hasattr(user, field) and field not in ['id', 'password']:
                    setattr(user, field, value)
            
            user.save()
            
            return self.get(request, user_id)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error patching user {user_id}: {str(e)}")
            return Response(
                {'error': 'Failed to update user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, user_id):
        """Delete user account"""
        try:
            user = User.objects.get(id=user_id)
            
            if user.id == request.user.id:
                return Response(
                    {'error': 'Cannot delete your own account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_email = user.email
            
            user.delete()
            
            logger.info(f"Admin {request.user.email} deleted user {user_email}")
            
            return Response(
                {'message': 'User deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            return Response(
                {'error': 'Failed to delete user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, user_id):
        """Handle special actions like password reset"""
        try:
            user = User.objects.get(id=user_id)
            action = request.data.get('action')
            
            if action == 'reset_password':
                import random
                import string
                temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
                user.set_password(temp_password)
                user.save()
                
                logger.info(f"Admin {request.user.email} reset password for user {user.email}")
                
                return Response({
                    'message': 'Password reset successfully',
                    'temp_password': temp_password
                })
            
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error handling action for user {user_id}: {str(e)}")
            return Response(
                {'error': 'Action failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserCasesView(APIView):
    """Get all cases for a specific user"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            from cases.models import Case
            
            cases = Case.objects.filter(user=user)
            
            case_data = []
            for case in cases:
                case_data.append({
                    'id': case.id,
                    'name': getattr(case, 'name', f'Case #{case.id}'),
                    'victim_name': getattr(case, 'victim_name', 'Unknown'),
                    'incident_date': getattr(case, 'incident_date', None),
                    'reward_amount': getattr(case, 'reward_amount', 0),
                    'status': getattr(case, 'status', 'active'),
                    'is_disabled': getattr(case, 'is_disabled', False),
                    'created_at': case.created_at if hasattr(case, 'created_at') else None,
                })
            
            return Response(case_data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ImportError:
            logger.error("Cases app not found - cannot fetch user cases")
            return Response(
                {'error': 'Cases module not available'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        except Exception as e:
            logger.error(f"Error fetching cases for user {user_id}: {str(e)}")
            return Response(
                {'error': 'Failed to fetch user cases'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )