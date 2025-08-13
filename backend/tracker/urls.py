# backend/tracker/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import all view functions from views.py
from .views import (
    # Main tracking views
    track_event,
    track_batch,
    report_suspicious,
    
    # Dashboard views
    dashboard_overview,
    dashboard_realtime,
    dashboard_suspicious_users,
    dashboard_patterns,
    export_data,
    
    # Additional dashboard views
    visitor_metrics_widget,
    suspicious_activity_widget,
    geographic_map_widget,
    activity_timeline_widget,
    engagement_metrics_widget,
    alerts_panel_widget,
    realtime_activity_stream,
    realtime_metrics,
    
    # Admin views
    admin_alerts,
    admin_flag_user,
    
    # Activity views
    last_activity,
)

app_name = 'tracker'

urlpatterns = [
    # ============================================
    # TRACKING ENDPOINTS
    # ============================================
    
    # Main tracking endpoints
    path('track/', track_event, name='track_event'),
    path('track/batch/', track_batch, name='track_batch'),
    path('track/batch', track_batch, name='track_batch_no_slash'),  # Support both with and without trailing slash
    path('suspicious/report/', report_suspicious, name='report_suspicious'),
    
    # ============================================
    # ACTIVITY ENDPOINTS
    # ============================================
    
    path('activity/last/', last_activity, name='last_activity'),
    
    # ============================================
    # DASHBOARD API ENDPOINTS
    # ============================================
    
    # Main dashboard overview
    path('dashboard/<str:case_slug>/', dashboard_overview, name='dashboard_overview'),
    path('dashboard/<str:case_slug>/realtime/', dashboard_realtime, name='dashboard_realtime'),
    path('dashboard/<str:case_slug>/suspicious/', dashboard_suspicious_users, name='dashboard_suspicious_users'),
    path('dashboard/<str:case_slug>/patterns/', dashboard_patterns, name='dashboard_patterns'),
    path('dashboard/<str:case_slug>/export/', export_data, name='export_data'),
    
    # Individual widget endpoints
    path('dashboard/<str:case_slug>/widgets/visitor-metrics/', 
         visitor_metrics_widget, 
         name='visitor_metrics_widget'),
    
    path('dashboard/<str:case_slug>/widgets/suspicious-activity/', 
         suspicious_activity_widget, 
         name='suspicious_activity_widget'),
    
    path('dashboard/<str:case_slug>/widgets/geographic-map/', 
         geographic_map_widget, 
         name='geographic_map_widget'),
    
    path('dashboard/<str:case_slug>/widgets/activity-timeline/', 
         activity_timeline_widget, 
         name='activity_timeline_widget'),
    
    path('dashboard/<str:case_slug>/widgets/engagement-metrics/', 
         engagement_metrics_widget, 
         name='engagement_metrics_widget'),
    
    path('dashboard/<str:case_slug>/widgets/alerts/', 
         alerts_panel_widget, 
         name='alerts_panel_widget'),
    
    # Real-time data endpoints
    path('dashboard/<str:case_slug>/realtime/activity/', 
         realtime_activity_stream, 
         name='realtime_activity_stream'),
    
    path('dashboard/<str:case_slug>/realtime/metrics/', 
         realtime_metrics, 
         name='realtime_metrics'),
    
    # ============================================
    # ADMIN ENDPOINTS
    # ============================================
    
    path('admin/alerts/', admin_alerts, name='admin_alerts'),
    path('admin/flag/<str:fingerprint>/', admin_flag_user, name='admin_flag_user'),
]