# spotlight/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpotlightPostViewSet

# Create a router and register our viewset
router = DefaultRouter()
router.register(r'spotlight', SpotlightPostViewSet, basename='spotlight')

# The API URLs are determined automatically by the router
# DO NOT add 'api/' here - it's already handled in the main urls.py
urlpatterns = [
    path('', include(router.urls)),  # Just include the router URLs directly
]