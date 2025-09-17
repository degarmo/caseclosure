# accounts/views.py
# UPDATED VERSION WITH ENHANCED EMAIL FUNCTIONALITY AND ERROR HANDLING

from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.shortcuts import redirect
from django.contrib.auth import login
from django.urls import reverse
from django.conf import settings
from django.utils import timezone
import urllib.parse
import logging
import traceback  # Added for better error logging

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
        # Log what we're receiving
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
    """User registration endpoint with invite code support"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    print("REGISTERVIEW CLASS LOADED!") 

    def create(self, request, *args, **kwargs):
        print("=" * 70)
        print("DEBUG: Registration started")
        print(f"DEBUG: Request data: {request.data}")
        print("=" * 70)
        
        try:
            # Get site settings
            print("DEBUG: Getting site settings...")
            settings = SiteSettings.get_settings()
            print(f"DEBUG: Registration mode: {settings.registration_mode}")
            
            # Check registration mode
            if settings.registration_mode == 'closed':
                print("DEBUG: Registration is closed")
                return Response({
                    'error': 'Registration is currently closed.',
                    'message': settings.beta_message
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check user limit if set
            if settings.max_users > 0 and settings.current_user_count >= settings.max_users:
                print(f"DEBUG: User limit reached: {settings.current_user_count}/{settings.max_users}")
                return Response({
                    'error': 'We\'ve reached our user limit. Please try again later.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check for invite code if in invite_only mode
            invite = None
            if settings.registration_mode == 'invite_only':
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
            
            # Save the user (the serializer's create method will set is_staff=False)
            print("DEBUG: About to save user...")
            user = serializer.save()
            print(f"DEBUG: User created - ID: {user.id}, Email: {user.email}")
            print(f"DEBUG: User account_type: {user.account_type}")
            print(f"DEBUG: User is_staff: {user.is_staff}")
            
            # Double-check that the user is not staff (safety check)
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
            settings.current_user_count = User.objects.filter(is_active=True).count()
            settings.save()
            print(f"DEBUG: New user count: {settings.current_user_count}")
            
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
                    'is_staff': False,  # Always False for new registrations
                    'account_type': user.account_type,  # Include since field exists
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
            
            # Return a generic error to avoid exposing internals
            return Response({
                'error': 'An error occurred during registration. Please try again.',
                'field_errors': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============== Registration Status Check ==============

class RegistrationStatusView(APIView):
    """Check current registration status and mode"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        settings = SiteSettings.get_settings()
        return Response({
            'mode': settings.registration_mode,
            'message': settings.beta_message,
            'google_auth_enabled': settings.enable_google_auth,
            'user_count': settings.current_user_count,
            'max_users': settings.max_users if settings.max_users > 0 else None
        })

# ============== Site Settings Management ==============

class SiteSettingsView(APIView):
    """Admin endpoint to manage site settings"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        settings = SiteSettings.get_settings()
        return Response({
            'registration_mode': settings.registration_mode,
            'beta_message': settings.beta_message,
            'enable_google_auth': settings.enable_google_auth,
            'enable_case_creation': settings.enable_case_creation,
            'enable_public_pages': settings.enable_public_pages,
            'user_count': settings.current_user_count,
            'max_users': settings.max_users,
            'maintenance_mode': settings.maintenance_mode,
            'maintenance_message': settings.maintenance_message,
        })
    
    def patch(self, request):
        settings = SiteSettings.get_settings()
        
        # Update allowed fields
        update_fields = [
            'registration_mode', 'beta_message', 'enable_google_auth',
            'enable_case_creation', 'enable_public_pages', 'max_users',
            'maintenance_mode', 'maintenance_message'
        ]
        
        for field in update_fields:
            if field in request.data:
                setattr(settings, field, request.data[field])
        
        settings.updated_by = request.user
        settings.save()
        
        logger.info(f"Site settings updated by {request.user.email}")
        
        return Response({'status': 'Settings updated successfully'})
    

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
        # Log the incoming request for debugging
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
                # Allow resubmission if previously rejected - delete old request
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
            
            # Send confirmation email to the requester (optional but good UX)
            try:
                if EMAIL_UTILS_AVAILABLE and hasattr(locals(), 'send_request_confirmation_email'):
                    send_request_confirmation_email(email, request.data['first_name'])
                    logger.info(f"Confirmation email sent to {email}")
            except Exception as e:
                logger.warning(f"Failed to send confirmation email: {e}")
                # Don't fail the request if email fails
            
            # Check if auto-approval is enabled
            settings = SiteSettings.get_settings()
            if settings.auto_approve_requests:
                # Auto-approve and create invite
                invite = account_request.approve_and_create_invite(None)
                
                # Send invite email for auto-approved requests
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
            logger.error(traceback.format_exc())  # Log full traceback
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
        action = request.data.get('action')  # 'approve' or 'reject'
        
        # DEBUG: Log incoming request
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
            print(f"DEBUG: Found account request for: {account_request.email}")
            
            if action == 'approve':
                print("=" * 70)
                print("DEBUG: APPROVAL PROCESS STARTED")
                print(f"DEBUG: User email: {account_request.email}")
                print(f"DEBUG: User name: {account_request.first_name} {account_request.last_name}")
                print(f"DEBUG: Current status: {account_request.status}")
                print("=" * 70)
                
                logger.info(f"Approving request for {account_request.email}")
                
                # Create invite code
                print("DEBUG: Creating invite code...")
                try:
                    invite = account_request.approve_and_create_invite(request.user)
                    print(f"DEBUG: ✅ Invite code created successfully: {invite.code}")
                    logger.info(f"Invite code created: {invite.code}")
                except Exception as e:
                    print(f"DEBUG: ❌ Failed to create invite code: {e}")
                    logger.error(f"Failed to create invite code: {e}")
                    logger.error(traceback.format_exc())
                    return Response({
                        'error': 'Failed to create invite code',
                        'details': str(e)
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Send email with better error handling
                email_sent = False
                email_error = None
                
                print("=" * 70)
                print("DEBUG: EMAIL SENDING SECTION")
                print(f"DEBUG: EMAIL_UTILS_AVAILABLE = {EMAIL_UTILS_AVAILABLE}")
                
                try:
                    if EMAIL_UTILS_AVAILABLE:
                        print(f"DEBUG: Email utilities ARE available")
                        print(f"DEBUG: Attempting to send invite email to: {account_request.email}")
                        print(f"DEBUG: With invite code: {invite.code}")
                        print(f"DEBUG: First name: {account_request.first_name}")
                        
                        logger.info(f"Attempting to send invite email to {account_request.email}")
                        
                        # Try to call the email function
                        print("DEBUG: Calling send_invite_email()...")
                        email_sent = send_invite_email(
                            account_request.email, 
                            invite.code, 
                            account_request.first_name
                        )
                        
                        print(f"DEBUG: send_invite_email() returned: {email_sent}")
                        logger.info(f"Email send result: {email_sent}")
                        
                        if email_sent:
                            print("DEBUG: ✅ Email sent successfully!")
                        else:
                            print("DEBUG: ⚠️ Email function returned False")
                    else:
                        print("DEBUG: ❌ Email utilities NOT available!")
                        print("DEBUG: Check if utils/email.py has all required functions")
                        logger.warning("Email utilities not available")
                        email_error = "Email system not configured"
                        
                except Exception as e:
                    print(f"DEBUG: ❌ Exception during email send: {e}")
                    print(f"DEBUG: Exception type: {type(e).__name__}")
                    email_error = str(e)
                    logger.error(f"Email sending failed: {e}")
                    logger.error(traceback.format_exc())
                
                print("=" * 70)
                
                # Build response with detailed status
                response_data = {
                    'message': f'Request approved! Invite code: {invite.code}',
                    'invite_code': invite.code,
                    'email_sent': email_sent
                }
                
                if email_error:
                    response_data['email_error'] = email_error
                    response_data['message'] += f' (Email failed: {email_error})'
                elif email_sent:
                    response_data['message'] += ' (Email sent successfully)'
                else:
                    response_data['message'] += ' (Email system may be disabled in development)'
                
                print(f"DEBUG: Final response data: {response_data}")
                logger.info(f"Approval complete for {account_request.email}: {response_data}")
                
                return Response(response_data)
                
            else:  # action == 'reject'
                reason = request.data.get('reason', 'No reason provided')
                
                print("=" * 70)
                print("DEBUG: REJECTION PROCESS STARTED")
                print(f"DEBUG: User email: {account_request.email}")
                print(f"DEBUG: Reason: {reason}")
                print("=" * 70)
                
                logger.info(f"Rejecting request for {account_request.email} with reason: {reason}")
                
                # Reject the request
                try:
                    account_request.reject(request.user, reason)
                    print("DEBUG: ✅ Request rejected in database")
                    logger.info(f"Request rejected in database")
                except Exception as e:
                    print(f"DEBUG: ❌ Failed to reject request: {e}")
                    logger.error(f"Failed to reject request: {e}")
                    return Response({
                        'error': 'Failed to reject request',
                        'details': str(e)
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Send rejection email (optional, don't fail if email fails)
                email_sent = False
                try:
                    if EMAIL_UTILS_AVAILABLE:
                        print("DEBUG: Attempting to send rejection email...")
                        email_sent = send_rejection_email(
                            account_request.email,
                            account_request.first_name,
                            reason
                        )
                        print(f"DEBUG: Rejection email {'sent' if email_sent else 'failed'}")
                        logger.info(f"Rejection email {'sent' if email_sent else 'failed'}")
                    else:
                        print("DEBUG: Email utilities not available for rejection")
                except Exception as e:
                    print(f"DEBUG: Failed to send rejection email: {e}")
                    logger.warning(f"Failed to send rejection email: {e}")
                
                return Response({
                    'message': f'Request rejected{" and user notified" if email_sent else " (email notification failed)"}'
                })
                
        except AccountRequest.DoesNotExist:
            print(f"DEBUG: ❌ Account request not found: {request_id}")
            logger.error(f"Account request not found: {request_id}")
            return Response({
                'error': 'Account request not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"DEBUG: ❌ Unexpected error: {e}")
            print(f"DEBUG: Error type: {type(e).__name__}")
            logger.error(f"Unexpected error in admin action: {e}")
            logger.error(traceback.format_exc())
            return Response({
                'error': 'An unexpected error occurred',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============== Current User Views ==============

class CurrentUserView(APIView):
    """Get current authenticated user's information"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserDetailView(APIView):
    """Get user details (duplicate of CurrentUserView for compatibility)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# ============== User Profile Views ==============

class MyProfileView(APIView):
    """Get and update user profile"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

# ============== Google OAuth Views ==============

class GoogleOAuthLoginView(APIView):
    """Initiate Google OAuth login flow"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Check if Google auth is enabled
        settings = SiteSettings.get_settings()
        if not settings.enable_google_auth:
            return Response({
                'error': 'Google authentication is currently disabled'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the 'next' parameter to redirect back to frontend after auth
        next_url = request.GET.get('next', 'http://localhost:5173/login')
        
        # Store it in session to use after OAuth callback
        request.session['oauth_next_url'] = next_url
        
        # Redirect to Django-allauth Google login URL
        google_login_url = '/accounts/google/login/'
        
        # You can also add state parameter for security
        state = urllib.parse.quote(next_url)
        full_url = f"{google_login_url}?state={state}"
        
        return redirect(full_url)

class GoogleOAuthCallbackView(APIView):
    """Handle Google OAuth callback and generate JWT tokens"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        This view is called after successful Google authentication.
        It generates JWT tokens and redirects back to frontend.
        """
        user = request.user
        
        if user.is_authenticated:
            try:
                # Ensure user profile exists
                UserProfile.objects.get_or_create(user=user)
                
                # Update site user count
                settings = SiteSettings.get_settings()
                settings.current_user_count = User.objects.filter(is_active=True).count()
                settings.save()
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Get the frontend URL from session
                next_url = request.session.get('oauth_next_url', 'http://localhost:5173/login')
                
                # Clear the session variable
                if 'oauth_next_url' in request.session:
                    del request.session['oauth_next_url']
                
                # Append tokens as query parameters
                params = {
                    'token': access_token,
                    'refresh': refresh_token,
                }
                
                redirect_url = f"{next_url}?{urllib.parse.urlencode(params)}"
                
                logger.info(f"Google OAuth successful for user: {user.email}")
                return redirect(redirect_url)
                
            except Exception as e:
                logger.error(f"Error generating tokens for user {user.email}: {str(e)}")
                error_url = f"{next_url}?error={urllib.parse.quote('Token generation failed')}"
                return redirect(error_url)
        else:
            # Authentication failed
            next_url = request.session.get('oauth_next_url', 'http://localhost:5173/login')
            error_msg = "Google authentication failed. Please try again."
            error_url = f"{next_url}?error={urllib.parse.quote(error_msg)}"
            
            logger.warning("Google OAuth authentication failed")
            return redirect(error_url)

# Optional: If using dj-rest-auth for API-based Google login
if ALLAUTH_INSTALLED:
    class GoogleLoginAPIView(SocialLoginView):
        """
        API endpoint for Google login using dj-rest-auth
        This is an alternative to the redirect-based flow
        """
        adapter_class = GoogleOAuth2Adapter
        callback_url = 'http://localhost:5173/login'
        client_class = OAuth2Client
        
        def get_response(self):
            """Override to add user data to response"""
            response = super().get_response()
            if self.user:
                response.data['user'] = UserSerializer(self.user).data
            return response

# ============== Logout View ==============

class LogoutView(APIView):
    """Logout user and blacklist refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get refresh token from request
            refresh_token = request.data.get('refresh')
            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Error during logout'
            }, status=status.HTTP_400_BAD_REQUEST)

# ============== Password Reset Views (Optional) ==============

class PasswordResetRequestView(APIView):
    """Request password reset email"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # TODO: Implement email sending logic here
            # For now, just return success
            return Response({
                'message': 'Password reset email sent if account exists'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response({
                'message': 'Password reset email sent if account exists'
            }, status=status.HTTP_200_OK)