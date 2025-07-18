from rest_framework import viewsets
from .models import Case
from .serializers import CaseSerializer
from rest_framework.permissions import IsAuthenticated

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all().order_by('-created_at')
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]  # Change/remove if you want public API

    def get_queryset(self):
        if self.request.user.is_staff:
            return Case.objects.all().order_by('-created_at')
        return Case.objects.filter(user=self.request.user).order_by('-created_at')
