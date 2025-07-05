from django.urls import path
from .views import TrackEventAPIView, VisitorProfileRetrieveAPIView

urlpatterns = [
    path('track/', TrackEventAPIView.as_view(), name='track-event'),
    path('profile/<str:fingerprint>/', VisitorProfileRetrieveAPIView.as_view(), name='visitor-profile'),
]
