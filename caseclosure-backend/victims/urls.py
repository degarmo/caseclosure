from django.urls import path
from .views import VictimProfileAPIView

urlpatterns = [
    path('profile/', VictimProfileAPIView.as_view(), name='victim-profile'),
]