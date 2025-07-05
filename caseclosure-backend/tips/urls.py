from django.urls import path
from .views import TipCreateAPIView

urlpatterns = [
    path('submit/', TipCreateAPIView.as_view(), name='tip-submit'),
]
