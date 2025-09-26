# dashboard/urls.py
from django.urls import path
from .views import (
    DashboardStatsView,
    AdminUsersListView,
    ActivityFeedView,
    RealtimeActivityView,
    LocationAnalyticsView,
    NotificationsView,
    MessagesUnreadCountView,
    AdminAlertsCountView,
    LastActivityView,
)

app_name = 'dashboard'

urlpatterns = [
    # Dashboard endpoints
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('widgets/', DashboardStatsView.as_view(), name='dashboard-widgets'),  # Alias
    
    # Admin endpoints
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
    path('admin/alerts-count/', AdminAlertsCountView.as_view(), name='admin-alerts-count'),
    
    # Activity endpoints
    path('activity/feed/', ActivityFeedView.as_view(), name='activity-feed'),
    path('activity/realtime/', RealtimeActivityView.as_view(), name='activity-realtime'),
    path('activity/last/', LastActivityView.as_view(), name='last-activity'),
    
    # Analytics
    path('analytics/locations/', LocationAnalyticsView.as_view(), name='location-analytics'),
    
    # Notifications and messages
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('messages/unread-count/', MessagesUnreadCountView.as_view(), name='messages-unread-count'),
]

# In your main urls.py, add:
# path('api/', include('dashboard.urls')),