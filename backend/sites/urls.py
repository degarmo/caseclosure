from rest_framework.routers import DefaultRouter
from .views import MemorialSiteViewSet

router = DefaultRouter()
router.register(r"sites", MemorialSiteViewSet, basename="memorialsite")

urlpatterns = router.urls
