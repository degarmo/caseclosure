# accounts/urls.py
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
    
    # Add these new imports
    RegistrationStatusView,  # Registration status check
    SiteSettingsView,  # Admin site settings
    AccountRequestView,  # Account requests
    AccountRequestAdminView,  # Admin account request management
    AdminUsersListView,
    AdminUserDetailView,
    UserCasesView,
)

# Import dashboard API views
from .api_views import (
    dashboard_config,
    dashboard_stats,
    module_data,
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
    
    # NEW ENDPOINTS for invite system
    path('registration-status/', RegistrationStatusView.as_view(), name='registration_status'),
    path('admin/settings/', SiteSettingsView.as_view(), name='admin_settings'),
    path('account-request/', AccountRequestView.as_view(), name='account_request'),
    path('admin/account-requests/', AccountRequestAdminView.as_view(), name='admin_account_requests'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/cases/', UserCasesView.as_view(), name='user-cases'),
    
    # Dashboard API endpoints
    path('dashboard/config/', dashboard_config, name='dashboard-config'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/modules/<str:module_name>/', module_data, name='module-data'),
]

# Add API-based Google login if available (optional)
if has_google_api_view:
    urlpatterns += [
        path('google/', GoogleLoginAPIView.as_view(), name='google_login_api'),
    ]