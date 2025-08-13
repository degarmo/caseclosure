# tracker/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tracking/(?P<case_id>\w+)/$', consumers.TrackingConsumer.as_asgi()),
    re_path(r'ws/admin/monitoring/$', consumers.AdminMonitoringConsumer.as_asgi()),
]