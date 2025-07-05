from django.urls import path
from .views import RegisterAPIView, LoginAPIView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='auth-register'),
    path('login/',    LoginAPIView.as_view(),    name='auth-login'),
    path('refresh/',  TokenRefreshView.as_view(), name='token-refresh'),
]
