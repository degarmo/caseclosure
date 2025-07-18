from rest_framework import routers
from .views import CaseViewSet

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet)

urlpatterns = router.urls
