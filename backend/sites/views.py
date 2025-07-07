# sites/views.py

from rest_framework import viewsets, permissions
from .models import MemorialSite
from .serializers import MemorialSiteSerializer
from rest_framework.views import APIView
from rest_framework.response import Response


class MemorialSiteViewSet(viewsets.ModelViewSet):
    serializer_class = MemorialSiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sites created by the logged-in user
        return MemorialSite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user field to the logged-in user
        serializer.save(user=self.request.user)


class PublicMemorialBySubdomain(APIView):
    authentication_classes = []  # No auth needed
    permission_classes = []

    def get(self, request):
        subdomain = request.GET.get('subdomain')
        if not subdomain:
            return Response({"detail": "subdomain is required"}, status=400)
        memorial = MemorialSite.objects.filter(subdomain=subdomain, is_public=True).first()
        if not memorial:
            return Response({"detail": "Not found"}, status=404)
        serializer = MemorialSiteSerializer(memorial)
        return Response(serializer.data)
