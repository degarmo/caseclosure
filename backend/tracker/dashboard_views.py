# dashboard_views.py - Dashboard API Views for Analytics and Widgets
# Location: tracker/views/dashboard_views.py

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Case, TrackingEvent, UserSession, SuspiciousActivity,
    DeviceFingerprint, Alert
)
from .serializers import (
    CaseSerializer, SuspiciousActivitySerializer,
    AlertSerializer, DashboardStatsSerializer
)
from .dashboard_analytics import DashboardAnalytics


# ============================================
# DASHBOARD OVERVIEW WIDGETS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request, case_slug):
    """
    Get complete dashboard overview with all widgets data
    GET /api/dashboard/{case_slug}/overview
    """
    try:
        case = Case.objects.get(slug=case_slug)
        
        # Check user has permission to view this case
        if not case.is_active and not request.user.is_staff:
            return Response(
                {'error': 'Case not accessible'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use caching for performance
        cache_key = f'dashboard_overview_{case_slug}_{request.user.id}'
        cached_data = cache.get(cache_key)
        
        if cached_data and not request.GET.get('refresh'):
            return Response(cached_data)
        
        # Initialize analytics
        analytics = DashboardAnalytics(str(case.id))
        
        # Get all dashboard data
        data = {
            'case': CaseSerializer(case).data,
            'stats': analytics.get_overview_stats(),
            'widgets': {
                'visitor_metrics': get_visitor_metrics_widget(case),
                'suspicious_activity': get_suspicious_activity_widget(case),
                'geographic_map': get_geographic_map_widget(case),
                'activity_timeline': get_activity_timeline_widget(case),
                'engagement_metrics': get_engagement_metrics_widget(case),
                'alerts_panel': get_alerts_panel_widget(case),
                'device_breakdown': get_device_breakdown_widget(case),
                'referrer_sources': get_referrer_sources_widget(case),
            },
            'last_updated': timezone.now().isoformat()
        }
        
        # Cache for 2 minutes
        cache.set(cache_key, data, 120)
        
        return Response(data)
        
    except Case.DoesNotExist:
        return Response(
            {'error': 'Case not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visitor_metrics_widget(request, case_slug):
    """
    Get visitor metrics widget data
    GET /api/dashboard/{case_slug}/widgets/visitor-metrics
    """
    try:
        case = Case.objects.get(slug=case_slug)
        data = get_visitor_metrics_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_visitor_metrics_widget(case):
    """Helper function to get visitor metrics"""
    now = timezone.now()
    
    # Time ranges
    today = now.replace(hour=0, minute=0, second=0)
    yesterday = today - timedelta(days=1)
    last_week = now - timedelta(days=7)
    last_month = now - timedelta(days=30)
    
    # Current visitors (active in last 5 minutes)
    active_visitors = UserSession.objects.filter(
        case=case,
        last_activity__gte=now - timedelta(minutes=5)
    ).count()
    
    # Today's visitors
    today_visitors = UserSession.objects.filter(
        case=case,
        created_at__gte=today
    ).distinct('fingerprint_hash').count()
    
    # Yesterday's visitors for comparison
    yesterday_visitors = UserSession.objects.filter(
        case=case,
        created_at__gte=yesterday,
        created_at__lt=today
    ).distinct('fingerprint_hash').count()
    
    # Calculate change
    if yesterday_visitors > 0:
        change_percentage = ((today_visitors - yesterday_visitors) / yesterday_visitors) * 100
    else:
        change_percentage = 100 if today_visitors > 0 else 0
    
    # Get hourly trend for sparkline
    hourly_data = []
    for i in range(24):
        hour_start = today + timedelta(hours=i)
        hour_end = hour_start + timedelta(hours=1)
        count = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=hour_start,
            timestamp__lt=hour_end
        ).distinct('fingerprint_hash').count()
        hourly_data.append(count)
    
    return {
        'active_now': active_visitors,
        'today': today_visitors,
        'yesterday': yesterday_visitors,
        'change_percentage': round(change_percentage, 1),
        'change_direction': 'up' if change_percentage > 0 else 'down',
        'week_total': UserSession.objects.filter(
            case=case,
            created_at__gte=last_week
        ).distinct('fingerprint_hash').count(),
        'month_total': UserSession.objects.filter(
            case=case,
            created_at__gte=last_month
        ).distinct('fingerprint_hash').count(),
        'hourly_trend': hourly_data,
        'peak_hour': hourly_data.index(max(hourly_data)) if hourly_data else 0,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suspicious_activity_widget(request, case_slug):
    """
    Get suspicious activity widget data
    GET /api/dashboard/{case_slug}/widgets/suspicious-activity
    """
    try:
        case = Case.objects.get(slug=case_slug)
        data = get_suspicious_activity_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_suspicious_activity_widget(case):
    """Helper function to get suspicious activity data"""
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Recent suspicious activities
    recent_activities = SuspiciousActivity.objects.filter(
        case=case,
        created_at__gte=last_24h
    ).select_related('session')
    
    # Group by severity
    severity_breakdown = {
        'critical': recent_activities.filter(severity_level=5).count(),
        'high': recent_activities.filter(severity_level=4).count(),
        'medium': recent_activities.filter(severity_level=3).count(),
        'low': recent_activities.filter(severity_level__lte=2).count(),
    }
    
    # Top suspicious users
    top_users = SuspiciousActivity.objects.filter(
        case=case,
        created_at__gte=last_7d
    ).values('fingerprint_hash').annotate(
        activity_count=Count('id'),
        max_severity=Max('severity_level'),
        avg_confidence=Avg('confidence_score')
    ).order_by('-max_severity', '-activity_count')[:5]
    
    # Activity types breakdown
    activity_types = SuspiciousActivity.objects.filter(
        case=case,
        created_at__gte=last_7d
    ).values('activity_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Recent activity list
    recent_list = []
    for activity in recent_activities[:10]:
        recent_list.append({
            'id': str(activity.id),
            'type': activity.activity_type,
            'severity': activity.severity_level,
            'confidence': activity.confidence_score,
            'fingerprint': activity.fingerprint_hash[:8] + '...',
            'ip_address': activity.ip_address,
            'time_ago': get_time_ago(activity.created_at),
            'details': activity.details
        })
    
    return {
        'total_24h': recent_activities.count(),
        'total_7d': SuspiciousActivity.objects.filter(
            case=case,
            created_at__gte=last_7d
        ).count(),
        'severity_breakdown': severity_breakdown,
        'critical_count': severity_breakdown['critical'],
        'high_risk_users': len(top_users),
        'top_suspicious_users': list(top_users),
        'activity_types': list(activity_types),
        'recent_activities': recent_list,
        'requires_attention': severity_breakdown['critical'] > 0 or severity_breakdown['high'] > 2,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def geographic_map_widget(request, case_slug):
    """
    Get geographic distribution for map widget
    GET /api/dashboard/{case_slug}/widgets/geographic-map
    """
    try:
        case = Case.objects.get(slug=case_slug)
        data = get_geographic_map_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_geographic_map_widget(case):
    """Helper function to get geographic data for map"""
    # Get visitor distribution by country
    countries = TrackingEvent.objects.filter(
        case=case,
        ip_country__isnull=False
    ).values('ip_country').annotate(
        visitor_count=Count('fingerprint_hash', distinct=True),
        total_events=Count('id'),
        suspicious_count=Count(
            'fingerprint_hash',
            filter=Q(is_suspicious=True),
            distinct=True
        )
    ).order_by('-visitor_count')
    
    # Get city-level data for top countries
    cities = TrackingEvent.objects.filter(
        case=case,
        ip_city__isnull=False
    ).values('ip_city', 'ip_country', 'ip_latitude', 'ip_longitude').annotate(
        visitor_count=Count('fingerprint_hash', distinct=True),
        suspicious_count=Count(
            'fingerprint_hash',
            filter=Q(is_suspicious=True),
            distinct=True
        )
    ).order_by('-visitor_count')[:50]
    
    # Format for map visualization
    map_data = {
        'countries': [],
        'cities': [],
        'heatmap_data': [],
        'suspicious_locations': []
    }
    
    for country in countries:
        map_data['countries'].append({
            'code': country['ip_country'],
            'visitors': country['visitor_count'],
            'events': country['total_events'],
            'suspicious': country['suspicious_count'],
            'risk_level': 'high' if country['suspicious_count'] > 5 else 'medium' if country['suspicious_count'] > 0 else 'low'
        })
    
    for city in cities:
        city_data = {
            'name': city['ip_city'],
            'country': city['ip_country'],
            'lat': city['ip_latitude'],
            'lng': city['ip_longitude'],
            'visitors': city['visitor_count'],
            'suspicious': city['suspicious_count']
        }
        
        map_data['cities'].append(city_data)
        
        # Add to heatmap
        if city['ip_latitude'] and city['ip_longitude']:
            map_data['heatmap_data'].append({
                'lat': city['ip_latitude'],
                'lng': city['ip_longitude'],
                'weight': city['visitor_count']
            })
            
            # Mark suspicious locations
            if city['suspicious_count'] > 0:
                map_data['suspicious_locations'].append(city_data)
    
    return map_data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_timeline_widget(request, case_slug):
    """
    Get activity timeline widget data
    GET /api/dashboard/{case_slug}/widgets/activity-timeline
    """
    try:
        case = Case.objects.get(slug=case_slug)
        
        # Get time range from query params
        hours = int(request.GET.get('hours', 24))
        
        data = get_activity_timeline_widget(case, hours)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_activity_timeline_widget(case, hours=24):
    """Helper function to get activity timeline"""
    now = timezone.now()
    start_time = now - timedelta(hours=hours)
    
    # Get events for timeline
    events = TrackingEvent.objects.filter(
        case=case,
        timestamp__gte=start_time
    ).order_by('-timestamp')[:100]
    
    # Get suspicious activities
    suspicious = SuspiciousActivity.objects.filter(
        case=case,
        created_at__gte=start_time
    ).order_by('-created_at')[:50]
    
    # Combine and sort chronologically
    timeline = []
    
    for event in events:
        timeline.append({
            'type': 'event',
            'timestamp': event.timestamp.isoformat(),
            'event_type': event.event_type,
            'user': event.fingerprint_hash[:8] + '...',
            'page': event.page_url,
            'is_suspicious': event.is_suspicious,
            'details': {
                'ip': event.ip_address,
                'location': f"{event.ip_city}, {event.ip_country}" if event.ip_city else event.ip_country,
                'device': event.device_type,
                'browser': event.browser
            }
        })
    
    for activity in suspicious:
        timeline.append({
            'type': 'suspicious',
            'timestamp': activity.created_at.isoformat(),
            'activity_type': activity.activity_type,
            'severity': activity.severity_level,
            'user': activity.fingerprint_hash[:8] + '...',
            'confidence': activity.confidence_score,
            'details': activity.details
        })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Group by hour for chart
    hourly_breakdown = {}
    for i in range(hours):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        
        hour_events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=hour_start,
            timestamp__lt=hour_end
        )
        
        hourly_breakdown[hour_start.hour] = {
            'events': hour_events.count(),
            'visitors': hour_events.distinct('fingerprint_hash').count(),
            'suspicious': hour_events.filter(is_suspicious=True).count()
        }
    
    return {
        'timeline': timeline[:50],  # Limit to 50 most recent
        'hourly_breakdown': hourly_breakdown,
        'total_events': len(timeline),
        'time_range': {
            'start': start_time.isoformat(),
            'end': now.isoformat(),
            'hours': hours
        }
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def engagement_metrics_widget(request, case_slug):
    """
    Get engagement metrics widget data
    GET /api/dashboard/{case_slug}/widgets/engagement-metrics
    """
    try:
        case = Case.objects.get(slug=case_slug)
        data = get_engagement_metrics_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_engagement_metrics_widget(case):
    """Helper function to get engagement metrics"""
    now = timezone.now()
    last_7d = now - timedelta(days=7)
    
    sessions = UserSession.objects.filter(
        case=case,
        created_at__gte=last_7d
    )
    
    events = TrackingEvent.objects.filter(
        case=case,
        timestamp__gte=last_7d
    )
    
    # Calculate metrics
    metrics = {
        'avg_session_duration': sessions.aggregate(
            avg=Avg('total_duration')
        )['avg'] or 0,
        'avg_pages_per_session': sessions.aggregate(
            avg=Avg('page_views')
        )['avg'] or 0,
        'bounce_rate': 0,
        'engagement_rate': 0,
        'avg_scroll_depth': events.filter(
            scroll_depth__isnull=False
        ).aggregate(
            avg=Avg('scroll_depth')
        )['avg'] or 0,
        'interaction_rate': 0,
        'return_visitor_rate': 0,
    }
    
    # Calculate bounce rate
    total_sessions = sessions.count()
    if total_sessions > 0:
        bounced = sessions.filter(page_views=1).count()
        metrics['bounce_rate'] = (bounced / total_sessions) * 100
    
    # Calculate engagement rate
    engaged_sessions = sessions.filter(
        Q(page_views__gte=3) | Q(total_duration__gte=60)
    ).count()
    if total_sessions > 0:
        metrics['engagement_rate'] = (engaged_sessions / total_sessions) * 100
    
    # Calculate interaction rate
    interactive_events = events.filter(
        event_type__in=['click', 'form_submit', 'comment', 'share']
    ).count()
    total_events = events.count()
    if total_events > 0:
        metrics['interaction_rate'] = (interactive_events / total_events) * 100
    
    # Calculate return visitor rate
    all_visitors = sessions.distinct('fingerprint_hash').count()
    return_visitors = sessions.values('fingerprint_hash').annotate(
        visit_count=Count('id')
    ).filter(visit_count__gt=1).count()
    if all_visitors > 0:
        metrics['return_visitor_rate'] = (return_visitors / all_visitors) * 100
    
    # Top pages
    top_pages = events.filter(
        event_type='page_view'
    ).values('page_url').annotate(
        views=Count('id'),
        unique_viewers=Count('fingerprint_hash', distinct=True),
        avg_time=Avg('time_on_page')
    ).order_by('-views')[:5]
    
    # User actions breakdown
    actions = events.values('event_type').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    return {
        'metrics': metrics,
        'top_pages': list(top_pages),
        'user_actions': list(actions),
        'quality_score': calculate_quality_score(metrics),
    }


def calculate_quality_score(metrics):
    """Calculate overall engagement quality score"""
    score = 0
    
    # Duration (max 25 points)
    if metrics['avg_session_duration'] > 180:  # 3+ minutes
        score += 25
    elif metrics['avg_session_duration'] > 60:  # 1+ minute
        score += 15
    elif metrics['avg_session_duration'] > 30:  # 30+ seconds
        score += 5
    
    # Pages per session (max 25 points)
    if metrics['avg_pages_per_session'] > 4:
        score += 25
    elif metrics['avg_pages_per_session'] > 2:
        score += 15
    elif metrics['avg_pages_per_session'] > 1:
        score += 5
    
    # Bounce rate (max 25 points)
    if metrics['bounce_rate'] < 30:
        score += 25
    elif metrics['bounce_rate'] < 50:
        score += 15
    elif metrics['bounce_rate'] < 70:
        score += 5
    
    # Engagement rate (max 25 points)
    if metrics['engagement_rate'] > 70:
        score += 25
    elif metrics['engagement_rate'] > 50:
        score += 15
    elif metrics['engagement_rate'] > 30:
        score += 5
    
    return min(score, 100)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_panel_widget(request, case_slug):
    """
    Get alerts panel widget data
    GET /api/dashboard/{case_slug}/widgets/alerts
    """
    try:
        case = Case.objects.get(slug=case_slug)
        data = get_alerts_panel_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_alerts_panel_widget(case):
    """Helper function to get alerts panel data"""
    # Get unresolved alerts
    alerts = Alert.objects.filter(
        case=case,
        resolved=False
    ).order_by('-priority', '-created_at')[:10]
    
    # Serialize alerts
    alert_list = []
    for alert in alerts:
        alert_list.append({
            'id': str(alert.id),
            'type': alert.alert_type,
            'priority': alert.priority,
            'title': alert.title,
            'message': alert.message,
            'created_at': alert.created_at.isoformat(),
            'time_ago': get_time_ago(alert.created_at),
            'acknowledged': alert.acknowledged,
            'data': alert.data
        })
    
    # Count by priority
    priority_counts = {
        'critical': alerts.filter(priority='critical').count(),
        'high': alerts.filter(priority='high').count(),
        'medium': alerts.filter(priority='medium').count(),
        'low': alerts.filter(priority='low').count(),
    }
    
    return {
        'alerts': alert_list,
        'total_unresolved': alerts.count(),
        'priority_breakdown': priority_counts,
        'requires_immediate_action': priority_counts['critical'] > 0,
    }


def get_device_breakdown_widget(case):
    """Helper function to get device breakdown data"""
    sessions = UserSession.objects.filter(case=case)
    
    breakdown = {
        'device_types': sessions.values('device_type').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / sessions.count()
        ).order_by('-count'),
        'browsers': sessions.values('browser').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / sessions.count()
        ).order_by('-count')[:5],
        'operating_systems': sessions.values('os').annotate(
            count=Count('id'),
            percentage=Count('id') * 100.0 / sessions.count()
        ).order_by('-count')[:5],
    }
    
    return breakdown


def get_referrer_sources_widget(case):
    """Helper function to get referrer sources data"""
    from urllib.parse import urlparse
    
    events = TrackingEvent.objects.filter(
        case=case,
        referrer_url__isnull=False
    ).exclude(referrer_url='')
    
    # Group by domain
    referrers = {}
    for event in events[:1000]:  # Limit to prevent memory issues
        try:
            parsed = urlparse(event.referrer_url)
            domain = parsed.netloc or 'direct'
        except:
            domain = 'unknown'
        
        if domain not in referrers:
            referrers[domain] = {
                'domain': domain,
                'count': 0,
                'visitors': set()
            }
        
        referrers[domain]['count'] += 1
        referrers[domain]['visitors'].add(event.fingerprint_hash)
    
    # Convert to list and sort
    referrer_list = []
    for domain, data in referrers.items():
        referrer_list.append({
            'domain': domain,
            'visits': data['count'],
            'unique_visitors': len(data['visitors'])
        })
    
    referrer_list.sort(key=lambda x: x['visits'], reverse=True)
    
    return {
        'top_referrers': referrer_list[:10],
        'total_sources': len(referrer_list)
    }


# ============================================
# REAL-TIME DATA ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def realtime_activity_stream(request, case_slug):
    """
    Get real-time activity stream (WebSocket alternative)
    GET /api/dashboard/{case_slug}/realtime/activity
    """
    try:
        case = Case.objects.get(slug=case_slug)
        
        # Get events from last 5 minutes
        since = timezone.now() - timedelta(minutes=5)
        
        events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=since
        ).order_by('-timestamp')[:50]
        
        stream = []
        for event in events:
            stream.append({
                'id': str(event.id),
                'timestamp': event.timestamp.isoformat(),
                'type': event.event_type,
                'user': event.fingerprint_hash[:8] + '...',
                'page': event.page_url,
                'location': f"{event.ip_city}, {event.ip_country}" if event.ip_city else event.ip_country,
                'device': event.device_type,
                'is_suspicious': event.is_suspicious,
                'suspicious_score': event.suspicious_score
            })
        
        return Response({
            'stream': stream,
            'active_users': UserSession.objects.filter(
                case=case,
                last_activity__gte=since
            ).count(),
            'timestamp': timezone.now().isoformat()
        })
        
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def realtime_metrics(request, case_slug):
    """
    Get real-time metrics updates
    GET /api/dashboard/{case_slug}/realtime/metrics
    """
    try:
        case = Case.objects.get(slug=case_slug)
        now = timezone.now()
        
        # Last 5 minutes metrics
        last_5min = now - timedelta(minutes=5)
        recent_events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=last_5min
        )
        
        metrics = {
            'active_users': UserSession.objects.filter(
                case=case,
                last_activity__gte=last_5min
            ).count(),
            'events_per_minute': recent_events.count() / 5,
            'page_views': recent_events.filter(event_type='page_view').count(),
            'interactions': recent_events.filter(
                event_type__in=['click', 'form_submit', 'scroll']
            ).count(),
            'suspicious_events': recent_events.filter(is_suspicious=True).count(),
            'new_alerts': Alert.objects.filter(
                case=case,
                created_at__gte=last_5min,
                resolved=False
            ).count(),
        }
        
        return Response(metrics)
        
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


# ============================================
# UTILITY FUNCTIONS
# ============================================

def get_time_ago(timestamp):
    """Convert timestamp to human-readable time ago"""
    now = timezone.now()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60}m ago"
    else:
        return "just now"