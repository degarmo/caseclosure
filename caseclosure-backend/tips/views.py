from rest_framework import generics, permissions
from .models import Tip
from .serializers import TipSerializer

class TipCreateAPIView(generics.CreateAPIView):
    serializer_class = TipSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # automatically link visitor profile via request header if present
        fingerprint = self.request.data.get('fingerprint')
        profile = None
        if fingerprint:
            from tracker.models import VisitorProfile
            profile = VisitorProfile.objects.filter(fingerprint=fingerprint).first()
        serializer.save(profile=profile)
