# backend/tracker/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import all view functions from views.py
from .views import (
    # Main tracking views
    track_event,
    track_batch,
    tracking_ping,
    report_suspicious,

    # Dashboard views (legacy — realtime/suspicious/patterns/export stay in views.py)
    dashboard_realtime,
    dashboard_suspicious_users,
    dashboard_patterns,
    export_data,

    # Individual widget endpoints (still served from views.py)
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

    # Honeypot
    honeypot_trigger,
)
# dashboard_overview, family_analytics, and identity_anomalies come from dashboard_views.py
# dashboard_views.py version returns the full {widgets: {...}} structure that the frontend expects
from .dashboard_views import (
    get_ml_status,
    dashboard_overview,
    family_analytics,
    identity_anomalies,
    get_suspects,
    export_suspects,
)

app_name = 'tracker'

urlpatterns = [
    # ============================================
    # TRACKING ENDPOINTS
    # ============================================
    
    # Main tracking endpoints
    path('track/', track_event, name='track_event'),
    path('track/batch/', track_batch, name='track_batch'),
    path('track/batch', track_batch, name='track_batch_no_slash'),
    path('ping/', tracking_ping, name='tracking_ping'),
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
    # FAMILY ANALYTICS ENDPOINT
    # ============================================

    path('family-analytics/<str:case_slug>/', family_analytics, name='family_analytics'),
    path('dashboard/<str:case_slug>/identity-anomalies/', identity_anomalies, name='identity_anomalies'),

    # ============================================
    # HONEYPOT + SUSPECTS
    # ============================================

    # Public honeypot trap — no auth required, returns a convincing 404
    path('honeypot/<str:case_slug>/', honeypot_trigger, name='honeypot_trigger'),

    # Suspects panel — authenticated LEO/admin only
    path('dashboard/<str:case_slug>/suspects/', get_suspects, name='get_suspects'),
    path('dashboard/<str:case_slug>/suspects/export/', export_suspects, name='export_suspects'),
    path('ml/status/', get_ml_status, name='ml_status'),

    # ============================================
    # ADMIN ENDPOINTS
    # ============================================

    path('admin/alerts/', admin_alerts, name='admin_alerts'),
    path('admin/flag/<str:fingerprint>/', admin_flag_user, name='admin_flag_user'),
]