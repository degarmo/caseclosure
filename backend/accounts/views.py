from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.shortcuts import redirect
from django.contrib.auth import login
from django.urls import reverse
from django.conf import settings
import urllib.parse
import logging

# For Google OAuth (if using dj-rest-auth)
try:
    from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
    from allauth.socialaccount.providers.oauth2.client import OAuth2Client
    from dj_rest_auth.registration.views import SocialLoginView
    ALLAUTH_INSTALLED = True
except ImportError:
    ALLAUTH_INSTALLED = False
    
from .models import UserProfile
from .serializers import UserProfileSerializer, UserSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

# ============== JWT Token Customization ==============

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to include user data in response"""
    
    def validate(self, attrs):
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
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user data with tokens"""
    serializer_class = CustomTokenObtainPairSerializer

# ============== User Registration & Management ==============

class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # Create user profile automatically
        UserProfile.objects.get_or_create(user=user)
        return user

class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)

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