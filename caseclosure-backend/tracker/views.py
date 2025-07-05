from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import VisitorProfile, VisitorEvent
from .serializers import VisitorEventSerializer, VisitorProfileSerializer
from victims.models import Victim

class TrackEventAPIView(generics.CreateAPIView):
    """
    POST { fingerprint, url, event_type, metadata }
    """
    serializer_class = VisitorEventSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        fp = request.data.get('fingerprint')
        if not fp:
            return Response({'error': 'fingerprint required'}, status=status.HTTP_400_BAD_REQUEST)

        host = request.get_host().split(':')[0]
        try:
            victim = Victim.objects.get(subdomain=host)
        except Victim.DoesNotExist:
            victim = Victim.objects.get(custom_domain=host)

        profile, _ = VisitorProfile.objects.get_or_create(
            fingerprint=fp, victim=victim
        )
        # attach profile and save event
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(profile=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class VisitorProfileRetrieveAPIView(generics.RetrieveAPIView):
    """
    GET /api/tracker/profile/{fingerprint}/
    """
    serializer_class = VisitorProfileSerializer
    lookup_field = 'fingerprint'
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        host = self.request.get_host().split(':')[0]
        try:
            victim = Victim.objects.get(subdomain=host)
        except Victim.DoesNotExist:
            victim = Victim.objects.get(custom_domain=host)
        return VisitorProfile.objects.filter(victim=victim)
