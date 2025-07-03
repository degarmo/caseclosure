from rest_framework import generics, permissions
from .models import Victim
from .serializers import VictimSerializer

class VictimProfileAPIView(generics.RetrieveAPIView):
    """
    Retrieve the victim profile based on subdomain or custom domain header.
    """
    queryset = Victim.objects.all()
    serializer_class = VictimSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        host = self.request.get_host().split(':')[0]
        try:
            return Victim.objects.get(subdomain=host)
        except Victim.DoesNotExist:
            return Victim.objects.get(custom_domain=host)