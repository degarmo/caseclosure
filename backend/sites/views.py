# sites/views.py

from rest_framework import viewsets, permissions
from .models import MemorialSite
from .serializers import MemorialSiteSerializer

class MemorialSiteViewSet(viewsets.ModelViewSet):
    serializer_class = MemorialSiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sites created by the logged-in user
        return MemorialSite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user field to the logged-in user
        serializer.save(user=self.request.user)
