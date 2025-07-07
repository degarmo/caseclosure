from rest_framework.routers import DefaultRouter
from .views import MemorialSiteViewSet, PublicMemorialBySubdomain
from django.urls import path

router = DefaultRouter()
router.register(r"sites", MemorialSiteViewSet, basename="memorialsite")

urlpatterns = [
    # Your custom endpoint comes first
    path('public/', PublicMemorialBySubdomain.as_view(), name="public-memorial"),
]

# Then add router-generated endpoints
urlpatterns += router.urls
