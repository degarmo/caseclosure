from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, 
    UserDetailView, 
    MyProfileView, 
    CurrentUserView,
    CustomTokenObtainPairView,  # Enhanced login that returns user data
    GoogleOAuthLoginView,  # Google OAuth initiation
    GoogleOAuthCallbackView,  # Google OAuth callback handler
    LogoutView,  # Logout endpoint
    PasswordResetRequestView,  # Password reset
)

# Import optional view if allauth is installed
try:
    from .views import GoogleLoginAPIView
    has_google_api_view = True
except ImportError:
    has_google_api_view = False

urlpatterns = [
    # Your existing endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),  # Updated to use CustomTokenObtainPairView
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # New endpoints for enhanced authentication
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    
    # Google OAuth endpoints
    path('google/login/', GoogleOAuthLoginView.as_view(), name='google_login'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google_callback'),
]

# Add API-based Google login if available (optional)
if has_google_api_view:
    urlpatterns += [
        path('google/', GoogleLoginAPIView.as_view(), name='google_login_api'),
    ]