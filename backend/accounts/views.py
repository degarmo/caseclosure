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
from django.core.mail import send_mail

# For Google OAuth (if using dj-rest-auth)
try:
    from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
    from allauth.socialaccount.providers.oauth2.client import OAuth2Client
    from dj_rest_auth.registration.views import SocialLoginView
    ALLAUTH_INSTALLED = True
except ImportError:
    ALLAUTH_INSTALLED = False
    
from .models import UserProfile, SiteSettings, InviteCode, AccountRequest
from .serializers import UserProfileSerializer, UserSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

def send_invite_email(email, invite_code, first_name):
    """Send invite code email to approved user"""
    subject = 'Your CaseClosure Invite Code'
    
    html_message = f"""
    <h2>Welcome to CaseClosure, {first_name}!</h2>
    
    <p>Your account request has been approved. Here's your personal invite code:</p>
    
    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; text-align: center;">
        <h1 style="font-family: monospace; letter-spacing: 2px; color: #333;">
            {invite_code}
        </h1>
    </div>
    
    <p>To complete your registration:</p>
    <ol>
        <li>Go to <a href="{settings.SITE_URL}/signup">caseclosure.org/signup</a></li>
        <li>Enter your invite code: <strong>{invite_code}</strong></li>
        <li>Use this email address: <strong>{email}</strong></li>
        <li>Create your password</li>
    </ol>
    
    <p>This invite code is valid for one use only and is tied to your email address.</p>
    
    <p>Best regards,<br>
    The CaseClosure Team</p>
    """
    
    plain_message = f"""
    Welcome to CaseClosure, {first_name}!
    
    Your invite code: {invite_code}
    
    Go to caseclosure.org/signup to complete registration.
    
    The CaseClosure Team
    """
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Invite email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send invite email to {email}: {str(e)}")
        # For development, print the invite code to console
        if settings.DEBUG:
            print(f"""
            ===== EMAIL WOULD BE SENT =====
            To: {email}
            Subject: {subject}
            
            Hi {first_name},
            Your invite code is: {invite_code}
            ================================
            """)
        return False

# ============== JWT Token Customization ==============

from rest_framework import serializers

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

class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'password', 'email', 'first_name', 'last_name')  # Removed username
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        # Auto-set username to email
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],  # Set username same as email
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create user profile automatically
        UserProfile.objects.get_or_create(user=user)
        return user

class RegisterView(generics.CreateAPIView):
    """User registration endpoint with invite code support"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Get site settings
        settings = SiteSettings.get_settings()
        
        # Check registration mode
        if settings.registration_mode == 'closed':
            return Response({
                'error': 'Registration is currently closed.',
                'message': settings.beta_message
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check user limit if set
        if settings.max_users > 0 and settings.current_user_count >= settings.max_users:
            return Response({
                'error': 'We\'ve reached our user limit. Please try again later.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check for invite code if in invite_only mode
        invite = None
        if settings.registration_mode == 'invite_only':
            invite_code = request.data.get('invite_code', '').upper()
            
            if not invite_code:
                return Response({
                    'invite_code': ['An invite code is required during our beta period.']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate invite code
            try:
                invite = InviteCode.objects.get(code=invite_code)
                if not invite.is_valid():
                    return Response({
                        'invite_code': ['This invite code is expired or has been used.']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if restricted to specific email
                if invite.email and invite.email != request.data.get('email'):
                    return Response({
                        'invite_code': ['This invite code is not valid for your email address.']
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except InviteCode.DoesNotExist:
                return Response({
                    'invite_code': ['Invalid invite code.']
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare data with email as username
        serializer_data = request.data.copy()
        # Don't need to set username here since RegisterSerializer handles it
        
        serializer = self.get_serializer(data=serializer_data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Mark invite code as used if applicable
        if invite:
            invite.use(user)
        
        # Update user count
        settings.current_user_count = User.objects.filter(is_active=True).count()
        settings.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)

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
        
        # Add other notifications here (tips, alerts, etc)
        # You can fetch from a Notification model if you have one
        # Example:
        # user_notifications = Notification.objects.filter(user=request.user, read=False)[:10]
        # for notif in user_notifications:
        #     notifications.append({
        #         'id': str(notif.id),
        #         'type': notif.type,
        #         'message': notif.message,
        #         'time': notif.created_at.strftime('%B %d at %I:%M %p'),
        #         'read': notif.read,
        #         'urgent': notif.urgent
        #     })
        
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
            
            # Check if auto-approval is enabled
            settings = SiteSettings.get_settings()
            if settings.auto_approve_requests:
                # Auto-approve and create invite
                invite = account_request.approve_and_create_invite(None)
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
        
        # Build query based on filter
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
        
        if not request_id or action not in ['approve', 'reject']:
            return Response({
                'error': 'Invalid request'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            account_request = AccountRequest.objects.get(id=request_id)
            
            if action == 'approve':
                invite = account_request.approve_and_create_invite(request.user)
                
                # Send email
                email_sent = send_invite_email(
                    account_request.email, 
                    invite.code, 
                    account_request.first_name
                )
                
                return Response({
                    'message': f'Request approved! Invite code: {invite.code}',
                    'invite_code': invite.code,
                    'email_sent': email_sent
                })
            else:
                reason = request.data.get('reason', '')
                account_request.reject(request.user, reason)
                return Response({
                    'message': 'Request rejected'
                })
                
        except AccountRequest.DoesNotExist:
            return Response({
                'error': 'Account request not found'
            }, status=status.HTTP_404_NOT_FOUND)

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