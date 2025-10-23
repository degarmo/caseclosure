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
    CustomTokenObtainPairView,
    GoogleOAuthLoginView,
    GoogleOAuthCallbackView,
    LogoutView,
    PasswordResetRequestView,
    RegistrationStatusView,
    SiteSettingsView,
    public_invite_status,
    AccountRequestView,
    AccountRequestAdminView,
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
    # Site settings endpoints
    path('settings/site/', SiteSettingsView.as_view(), name='site-settings'),
    path('settings/public/invite-status/', public_invite_status, name='public-invite-status'),

    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    
    # Enhanced authentication endpoints
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    
    # Google OAuth endpoints
    path('google/login/', GoogleOAuthLoginView.as_view(), name='google_login'),
    path('google/callback/', GoogleOAuthCallbackView.as_view(), name='google_callback'),
    
    # Registration and invite system endpoints
    path('registration-status/', RegistrationStatusView.as_view(), name='registration_status'),
    path('admin/settings/', SiteSettingsView.as_view(), name='admin_settings'),
    path('account-request/', AccountRequestView.as_view(), name='account_request'),
    path('admin/account-requests/', AccountRequestAdminView.as_view(), name='admin_account_requests'),
    
    # Admin user management endpoints
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