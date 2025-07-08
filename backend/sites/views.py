# sites/views.py

from rest_framework import viewsets, permissions, status
from .models import MemorialSite
from .serializers import MemorialSiteSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

# --- 1. Subdomain Availability Check Endpoint ---
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_subdomain(request):
    subdomain = request.GET.get('subdomain')
    if not subdomain:
        return Response({'detail': 'subdomain query param required'}, status=400)
    exists = MemorialSite.objects.filter(subdomain__iexact=subdomain).exists()
    return Response({'available': not exists})

class MemorialSiteViewSet(viewsets.ModelViewSet):
    serializer_class = MemorialSiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sites created by the logged-in user
        return MemorialSite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically set the user field to the logged-in user
        serializer.save(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        # Handles PATCH requests for subdomain, custom_domain, is_public
        instance = self.get_object()
        data = request.data

        allowed_patch_fields = ['subdomain', 'custom_domain', 'is_public']
        for field in data:
            if field not in allowed_patch_fields:
                return Response({'detail': f'Cannot update field: {field}'}, status=400)

        # Subdomain logic
        subdomain = data.get('subdomain')
        if subdomain is not None:
            # Check for duplicates (exclude current instance)
            if MemorialSite.objects.filter(subdomain__iexact=subdomain).exclude(id=instance.id).exists():
                return Response({'detail': 'Subdomain is already taken.'}, status=400)
            instance.subdomain = subdomain
            instance.domain_status = 'pending'

        # Custom domain logic (optional, for later)
        custom_domain = data.get('custom_domain')
        if custom_domain is not None:
            if MemorialSite.objects.filter(custom_domain__iexact=custom_domain).exclude(id=instance.id).exists():
                return Response({'detail': 'Custom domain is already taken.'}, status=400)
            instance.custom_domain = custom_domain
            instance.domain_status = 'pending'

        # is_public logic
        if 'is_public' in data:
            instance.is_public = data['is_public']

        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
