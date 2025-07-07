from rest_framework import viewsets, permissions
from .models import MemorialSite
from .serializers import MemorialSiteSerializer

class MemorialSiteViewSet(viewsets.ModelViewSet):
    serializer_class = MemorialSiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show sites belonging to current user
        return MemorialSite.objects.filter(user=self.request.user)
