from rest_framework.routers import DefaultRouter
from .views import MemorialSiteViewSet, PublicMemorialBySubdomain, check_subdomain
from django.urls import path

router = DefaultRouter()
router.register(r"sites", MemorialSiteViewSet, basename="memorialsite")

urlpatterns = [
    # Custom endpoints come first
    path('public/', PublicMemorialBySubdomain.as_view(), name="public-memorial"),
    # Add the subdomain availability endpoint
    path('sites/check_subdomain/', check_subdomain, name='check-subdomain'),
]

# Then add router-generated endpoints (for /sites/)
urlpatterns += router.urls
