# dashboard_views.py - Dashboard API Views for Analytics and Widgets
# Location: tracker/views/dashboard_views.py

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.db.models import Count, Sum, Avg, Q, F, Max
from django.utils import timezone
from datetime import datetime, timedelta
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from .models import (
    TrackingEvent, UserSession, SuspiciousActivity,
    DeviceFingerprint, Alert
)
from cases.models import Case
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
        # Look up by subdomain first; fall back to numeric ID
        try:
            case = Case.objects.get(subdomain=case_slug)
        except Case.DoesNotExist:
            if str(case_slug).isdigit():
                case = Case.objects.get(id=int(case_slug))
            else:
                raise

        # Check user has permission to view this case
        if case.is_disabled and not request.user.is_staff:
            return Response(
                {'error': 'Case not accessible'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use caching for performance
        cache_key = f'dashboard_overview_{case_slug}_{request.user.id}'
        cached_data = cache.get(cache_key)
        
        if cached_data and not request.GET.get('refresh') and '_widget_errors' not in cached_data:
            return Response(cached_data)
        
        widget_errors = {}

        def _safe(fn, *args, default=None):
            """Call fn safely inside a DB savepoint so a failed query
            doesn't abort the outer transaction and cascade to all
            subsequent widgets."""
            name = getattr(fn, '__name__', str(fn))
            sid = transaction.savepoint()
            try:
                result = fn(*args)
                transaction.savepoint_commit(sid)
                return result
            except Exception as exc:
                import traceback, logging
                transaction.savepoint_rollback(sid)
                tb = traceback.format_exc()
                logging.getLogger(__name__).warning(
                    f"dashboard_overview widget {name} failed: {exc}\n{tb}"
                )
                widget_errors[name] = f"{type(exc).__name__}: {exc}"
                return default if default is not None else {}

        # Initialize analytics
        analytics = DashboardAnalytics(str(case.id))

        # Case info — fall back to minimal dict if serializer fails
        try:
            case_data = CaseSerializer(case).data
        except Exception:
            case_data = {'id': str(case.id), 'subdomain': case.subdomain}

        # Get all dashboard data — each widget isolated so one crash doesn't blank everything
        data = {
            'case': case_data,
            'stats': _safe(analytics.get_overview_stats),
            'widgets': {
                'visitor_metrics':    _safe(get_visitor_metrics_widget, case),
                'suspicious_activity': _safe(get_suspicious_activity_widget, case),
                'geographic_map':     _safe(get_geographic_map_widget, case),
                'activity_timeline':  _safe(get_activity_timeline_widget, case),
                'engagement_metrics': _safe(get_engagement_metrics_widget, case),
                'alerts_panel':       _safe(get_alerts_panel_widget, case),
                'device_breakdown':   _safe(get_device_breakdown_widget, case),
                'referrer_sources':   _safe(get_referrer_sources_widget, case),
            },
            'last_updated': timezone.now().isoformat(),
            # Included when any widget threw an exception — use to diagnose blank dashboards
            '_widget_errors': widget_errors if widget_errors else None,
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
        case = Case.objects.get(subdomain=case_slug)
        data = get_visitor_metrics_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_visitor_metrics_widget(case):
    """
    Visitor metrics from TrackingEvent (the canonical data source).
    Unique visitors = distinct fingerprint_hash values.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    last_week = now - timedelta(days=7)
    last_month = now - timedelta(days=30)

    events = TrackingEvent.objects.filter(case=case)

    # Active right now: any event in last 5 minutes
    active_now = (
        events
        .filter(timestamp__gte=now - timedelta(minutes=5))
        .values('fingerprint_hash')
        .exclude(fingerprint_hash='')
        .distinct()
        .count()
    )

    today_visitors = (
        events.filter(timestamp__gte=today_start)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    yesterday_visitors = (
        events.filter(timestamp__gte=yesterday_start, timestamp__lt=today_start)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    week_total = (
        events.filter(timestamp__gte=last_week)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    month_total = (
        events.filter(timestamp__gte=last_month)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    all_time_total = (
        events.exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )

    if yesterday_visitors > 0:
        change_pct = round(((today_visitors - yesterday_visitors) / yesterday_visitors) * 100, 1)
    else:
        change_pct = 100 if today_visitors > 0 else 0

    # Hourly trend for today (24 bars)
    hourly_data = []
    for i in range(24):
        h_start = today_start + timedelta(hours=i)
        h_end   = h_start + timedelta(hours=1)
        cnt = (
            events.filter(timestamp__gte=h_start, timestamp__lt=h_end)
            .exclude(fingerprint_hash='')
            .values('fingerprint_hash').distinct().count()
        )
        hourly_data.append(cnt)

    return {
        'active_now':         active_now,
        'today':              today_visitors,
        'yesterday':          yesterday_visitors,
        'week_total':         week_total,
        'month_total':        month_total,
        'all_time_total':     all_time_total,
        'change_percentage':  change_pct,
        'change_direction':   'up' if change_pct >= 0 else 'down',
        'hourly_trend':       hourly_data,
        'peak_hour':          hourly_data.index(max(hourly_data)) if any(hourly_data) else 0,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suspicious_activity_widget(request, case_slug):
    """
    Get suspicious activity widget data
    GET /api/dashboard/{case_slug}/widgets/suspicious-activity
    """
    try:
        case = Case.objects.get(subdomain=case_slug)
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
        case = Case.objects.get(subdomain=case_slug)
        data = get_geographic_map_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_geographic_map_widget(case):
    """Helper function to get geographic data for map"""
    # Get visitor distribution by country
    countries = TrackingEvent.objects.filter(
        case=case,
    ).exclude(ip_country='').values('ip_country').annotate(
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
    ).exclude(ip_city='').values('ip_city', 'ip_country', 'ip_latitude', 'ip_longitude').annotate(
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
        case = Case.objects.get(subdomain=case_slug)
        
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
            'visitors': hour_events.values('fingerprint_hash').distinct().count(),
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
        case = Case.objects.get(subdomain=case_slug)
        data = get_engagement_metrics_widget(case)
        return Response(data)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


def get_engagement_metrics_widget(case):
    """
    Engagement metrics derived from TrackingEvent (primary source).
    UserSession used only for session-level aggregates when available.
    """
    now = timezone.now()
    last_7d = now - timedelta(days=7)

    events = TrackingEvent.objects.filter(case=case, timestamp__gte=last_7d)
    total_events = events.count()

    # Avg time on page from events directly
    avg_time_on_page = events.filter(
        time_on_page__isnull=False, time_on_page__gt=0
    ).aggregate(avg=Avg('time_on_page'))['avg'] or 0

    avg_scroll = events.filter(
        scroll_depth__isnull=False
    ).aggregate(avg=Avg('scroll_depth'))['avg'] or 0

    # Interaction rate: clicks/forms/shares / total events
    interactive = events.filter(
        event_type__in=['click', 'form_submit', 'comment', 'share', 'copy']
    ).count()
    interaction_rate = (interactive / total_events * 100) if total_events else 0

    # Return visitor rate: fingerprints seen on more than one calendar day
    unique_fps = (
        events.exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    return_visitors = (
        events.exclude(fingerprint_hash='')
        .values('fingerprint_hash')
        .annotate(n=Count('id'))
        .filter(n__gt=1)
        .count()
    )
    return_rate = (return_visitors / unique_fps * 100) if unique_fps else 0

    # Supplement with UserSession data if it has records
    sessions = UserSession.objects.filter(case=case, created_at__gte=last_7d)
    total_sessions = sessions.count()
    avg_session_duration = sessions.aggregate(avg=Avg('total_duration'))['avg'] or avg_time_on_page
    avg_pages = sessions.aggregate(avg=Avg('page_views'))['avg'] or 1

    bounce_rate = 0
    engagement_rate = 0
    if total_sessions > 0:
        bounced = sessions.filter(page_views__lte=1).count()
        bounce_rate = (bounced / total_sessions) * 100
        engaged = sessions.filter(Q(page_views__gte=3) | Q(total_duration__gte=60)).count()
        engagement_rate = (engaged / total_sessions) * 100

    metrics = {
        'avg_session_duration':   round(avg_session_duration or 0),
        'avg_pages_per_session':  round(avg_pages or 1, 1),
        'bounce_rate':            round(bounce_rate, 1),
        'engagement_rate':        round(engagement_rate, 1),
        'avg_scroll_depth':       round(avg_scroll or 0, 1),
        'interaction_rate':       round(interaction_rate, 1),
        'return_visitor_rate':    round(return_rate, 1),
    }
    
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
        case = Case.objects.get(subdomain=case_slug)
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
    """Device breakdown from TrackingEvent (primary data source)."""
    events = TrackingEvent.objects.filter(case=case).exclude(fingerprint_hash='')
    total = events.values('fingerprint_hash').distinct().count()

    if total == 0:
        return {
            'device_types': [],
            'browsers': [],
            'operating_systems': [],
        }

    # Use one event per fingerprint for device/browser/os attribution
    device_types = list(
        events.exclude(device_type='').values('device_type')
        .annotate(count=Count('fingerprint_hash', distinct=True))
        .order_by('-count')
    )
    browsers = list(
        events.exclude(browser='').values('browser')
        .annotate(count=Count('fingerprint_hash', distinct=True))
        .order_by('-count')[:5]
    )
    operating_systems = list(
        events.exclude(os='').values('os')
        .annotate(count=Count('fingerprint_hash', distinct=True))
        .order_by('-count')[:5]
    )

    # Add percentage field
    for lst in (device_types, browsers, operating_systems):
        for row in lst:
            row['percentage'] = round(row['count'] / total * 100, 1) if total else 0

    return {
        'device_types':     device_types,
        'browsers':         browsers,
        'operating_systems': operating_systems,
    }


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
        case = Case.objects.get(subdomain=case_slug)
        
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
        case = Case.objects.get(subdomain=case_slug)
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
# SUSPECTS / HONEYPOT SCORING
# ============================================

def _compute_suspects(case):
    """
    Score every unique visitor for this case and return a ranked list.

    Signals and weights
    ───────────────────
    honeypot_triggered   +60  clicked a hidden trap — highest indicator
    tor_detected         +20  using Tor anonymiser
    vpn_detected         +15  using VPN / proxy
    multiple_ips (3+)    +20  same fingerprint, 3+ different IPs
    multiple_ips (2)     +10  same fingerprint, 2 different IPs
    unusual_hour         +10  visited between 2–5 AM
    high_visit_count 10+ +20  10 or more total visits
    high_visit_count 5+  +15  5–9 total visits
    return_visitor  3+   +10  3–4 total visits
    suspicious_patterns  +5   per flagged SuspiciousActivity record (max 25)
    high_severity act.   +15  at least one severity-4/5 activity
    """
    from django.db.models import Min

    # ── Aggregate per fingerprint from TrackingEvent ─────────────────────────
    fp_stats = list(
        TrackingEvent.objects.filter(case=case)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash')
        .annotate(
            visit_count=Count('id'),
            unique_ips=Count('ip_address', distinct=True),
            unusual_hour_count=Count('id', filter=Q(is_unusual_hour=True)),
            vpn_count=Count('id', filter=Q(is_vpn=True)),
            tor_count=Count('id', filter=Q(is_tor=True)),
            honeypot_hits=Count('id', filter=Q(event_type='honeypot_triggered')),
            first_seen=Min('timestamp'),
            last_seen=Max('timestamp'),
        )
    )

    # ── Aggregate per fingerprint from SuspiciousActivity ────────────────────
    sa_by_fp = {
        row['fingerprint_hash']: row
        for row in (
            SuspiciousActivity.objects.filter(case=case)
            .values('fingerprint_hash')
            .annotate(
                total_sa=Count('id'),
                max_severity=Max('severity_level'),
                hp_sa=Count('id', filter=Q(activity_type='honeypot_triggered')),
            )
        )
    }

    # ── Latest event per fingerprint for IP/location/device context ──────────
    latest = {
        row['fingerprint_hash']: row
        for row in (
            TrackingEvent.objects.filter(case=case)
            .exclude(fingerprint_hash='')
            .order_by('fingerprint_hash', '-timestamp')
            .distinct('fingerprint_hash')
            .values(
                'fingerprint_hash', 'ip_address', 'ip_country',
                'ip_city', 'browser', 'os', 'device_type',
            )
        )
    }

    suspects = []

    for fp_data in fp_stats:
        fp = fp_data['fingerprint_hash']
        sa = sa_by_fp.get(fp, {})
        latest_ev = latest.get(fp, {})

        score = 0
        signals = []

        honeypot_hits = fp_data['honeypot_hits'] + sa.get('hp_sa', 0)
        if honeypot_hits > 0:
            score += 60
            signals.append({
                'type': 'honeypot_triggered',
                'label': f'Accessed hidden trap link ({honeypot_hits}×)',
                'weight': 60,
            })

        if fp_data['tor_count'] > 0:
            score += 20
            signals.append({'type': 'tor_detected', 'label': 'Tor anonymiser detected', 'weight': 20})

        if fp_data['vpn_count'] > 0:
            score += 15
            signals.append({'type': 'vpn_detected', 'label': 'VPN / proxy detected', 'weight': 15})

        if fp_data['unique_ips'] >= 3:
            score += 20
            signals.append({'type': 'multiple_ips', 'label': f'{fp_data["unique_ips"]} different IP addresses', 'weight': 20})
        elif fp_data['unique_ips'] == 2:
            score += 10
            signals.append({'type': 'multiple_ips', 'label': '2 different IP addresses', 'weight': 10})

        if fp_data['unusual_hour_count'] > 0:
            score += 10
            signals.append({'type': 'unusual_hour', 'label': f'Visited during 2–5 AM ({fp_data["unusual_hour_count"]}×)', 'weight': 10})

        vc = fp_data['visit_count']
        if vc >= 10:
            score += 20
            signals.append({'type': 'high_visit_count', 'label': f'{vc} total visits', 'weight': 20})
        elif vc >= 5:
            score += 15
            signals.append({'type': 'return_visitor', 'label': f'{vc} visits (frequent returner)', 'weight': 15})
        elif vc >= 3:
            score += 10
            signals.append({'type': 'return_visitor', 'label': f'{vc} visits', 'weight': 10})

        sa_count = sa.get('total_sa', 0)
        if sa_count > 0:
            pts = min(25, sa_count * 5)
            score += pts
            signals.append({'type': 'suspicious_patterns', 'label': f'{sa_count} flagged behaviour patterns', 'weight': pts})

        if sa.get('max_severity', 0) >= 4:
            score += 15
            signals.append({'type': 'high_severity', 'label': f'Severity-{sa["max_severity"]} activity on record', 'weight': 15})

        score = min(100, score)

        if score < 15:
            continue  # Skip visitors with almost no signals

        if score >= 70 or honeypot_hits > 0:
            risk = 'critical'
        elif score >= 50:
            risk = 'high'
        elif score >= 30:
            risk = 'medium'
        else:
            risk = 'low'

        suspects.append({
            'fingerprint':         fp,
            'fingerprint_short':   fp[:14] + '…',
            'score':               score,
            'risk':                risk,
            'honeypot_triggered':  honeypot_hits > 0,
            'honeypot_count':      honeypot_hits,
            'signals':             sorted(signals, key=lambda s: s['weight'], reverse=True),
            'visit_count':         fp_data['visit_count'],
            'unique_ips':          fp_data['unique_ips'],
            'latest_ip':           latest_ev.get('ip_address', ''),
            'latest_country':      latest_ev.get('ip_country', ''),
            'latest_city':         latest_ev.get('ip_city', ''),
            'browser':             latest_ev.get('browser', ''),
            'os':                  latest_ev.get('os', ''),
            'device_type':         latest_ev.get('device_type', ''),
            'first_seen':          fp_data['first_seen'].isoformat() if fp_data['first_seen'] else None,
            'last_seen':           fp_data['last_seen'].isoformat() if fp_data['last_seen'] else None,
            'last_seen_ago':       get_time_ago(fp_data['last_seen']) if fp_data['last_seen'] else '—',
            'flagged_for_leo':     honeypot_hits > 0 or score >= 70,
        })

    suspects.sort(key=lambda s: (s['score'], s['honeypot_triggered']), reverse=True)
    return suspects[:50]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_suspects(request, case_slug):
    """
    Ranked suspect list for a case — scored on behavioural signals.
    GET /api/tracker/dashboard/<case_slug>/suspects/
    """
    try:
        try:
            case = Case.objects.get(subdomain=case_slug)
        except Case.DoesNotExist:
            case = Case.objects.get(id=int(case_slug)) if case_slug.isdigit() else None
            if not case:
                raise Case.DoesNotExist

        suspects = _compute_suspects(case)
        return Response({
            'suspects': suspects,
            'total': len(suspects),
            'critical_count': sum(1 for s in suspects if s['risk'] == 'critical'),
            'honeypot_count': sum(1 for s in suspects if s['honeypot_triggered']),
        })

    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_suspects(request, case_slug):
    """
    Export suspect list as CSV for law enforcement.
    GET /api/tracker/dashboard/<case_slug>/suspects/export/
    """
    import csv as csv_module
    from django.http import HttpResponse as DjangoHttpResponse

    try:
        try:
            case = Case.objects.get(subdomain=case_slug)
        except Case.DoesNotExist:
            case = Case.objects.get(id=int(case_slug)) if case_slug.isdigit() else None
            if not case:
                raise Case.DoesNotExist

        suspects = _compute_suspects(case)

        response = DjangoHttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="suspects-{case_slug}-{timezone.now().strftime("%Y%m%d")}.csv"'
        )

        writer = csv_module.writer(response)
        writer.writerow([
            'Rank', 'Suspicion Score', 'Risk Level', 'Honeypot Triggered',
            'Fingerprint (partial)', 'Visit Count', 'Unique IPs',
            'Latest IP', 'Country', 'City', 'Browser', 'OS', 'Device',
            'First Seen (UTC)', 'Last Seen (UTC)', 'Key Signals',
        ])

        for i, s in enumerate(suspects, 1):
            writer.writerow([
                i,
                s['score'],
                s['risk'].upper(),
                'YES — HIGH PRIORITY' if s['honeypot_triggered'] else 'No',
                s['fingerprint_short'],
                s['visit_count'],
                s['unique_ips'],
                s['latest_ip'],
                s['latest_country'],
                s['latest_city'],
                s['browser'],
                s['os'],
                s['device_type'],
                s['first_seen'],
                s['last_seen'],
                ' | '.join(sig['label'] for sig in s['signals']),
            ])

        return response

    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)


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

# ============================================
# FAMILY ANALYTICS ENDPOINT
# ============================================

SOCIAL_DOMAINS = {
    'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
    'tiktok.com', 'youtube.com', 'linkedin.com', 'pinterest.com',
    'reddit.com', 'snapchat.com', 'threads.net', 't.co', 'lnkd.in',
}
SEARCH_DOMAINS = {
    'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
    'baidu.com', 'yandex.com', 'ask.com', 'ecosia.org', 'brave.com',
}


def _classify_referrer(url):
    """Return 'social' | 'search' | 'direct' | 'other' for a referrer URL."""
    if not url or not url.strip():
        return 'direct'
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        if any(s in domain for s in SOCIAL_DOMAINS):
            return 'social'
        if any(s in domain for s in SEARCH_DOMAINS):
            return 'search'
        return 'other'
    except Exception:
        return 'other'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def family_analytics(request, case_slug):
    """
    Family-safe analytics endpoint.
    Returns visitor momentum data only — no forensic, suspicious, or IP details.
    GET /api/tracker/family-analytics/<case_slug>/?days=30
    """
    from django.db.models.functions import TruncDate

    try:
        case = Case.objects.get(subdomain=case_slug)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only the case owner or staff may access
    if case.user != request.user and not request.user.is_staff:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    days = max(1, min(int(request.GET.get('days', 30)), 365))
    now = timezone.now()
    since = now - timedelta(days=days)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    all_events = TrackingEvent.objects.filter(case=case)
    period_events = all_events.filter(timestamp__gte=since)

    # ── KPI metrics ──────────────────────────────────────────────────────────
    total_visits = (
        all_events.exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    this_week = (
        all_events.filter(timestamp__gte=week_ago)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    last_week = (
        all_events.filter(timestamp__gte=two_weeks_ago, timestamp__lt=week_ago)
        .exclude(fingerprint_hash='')
        .values('fingerprint_hash').distinct().count()
    )
    week_change_pct = (
        round(((this_week - last_week) / last_week) * 100)
        if last_week > 0 else (100 if this_week > 0 else 0)
    )

    avg_secs = (
        period_events
        .filter(time_on_page__isnull=False, time_on_page__gt=0)
        .aggregate(avg=Avg('time_on_page'))['avg'] or 0
    )
    avg_secs = round(avg_secs)
    avg_formatted = (
        f"{avg_secs // 60}m {avg_secs % 60}s"
        if avg_secs >= 60 else f"{avg_secs}s"
    )

    # ── Visits over time (daily) ──────────────────────────────────────────────
    visits_over_time = [
        {'date': str(row['date']), 'visits': row['visits']}
        for row in (
            period_events
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(visits=Count('fingerprint_hash', distinct=True))
            .order_by('date')
        )
    ]

    # ── Top states ───────────────────────────────────────────────────────────
    top_states = [
        {'state': row['ip_region'], 'visitors': row['visitors']}
        for row in (
            period_events
            .exclude(ip_region__in=['', None])
            .values('ip_region')
            .annotate(visitors=Count('fingerprint_hash', distinct=True))
            .order_by('-visitors')[:10]
        )
    ]

    # ── Traffic sources ───────────────────────────────────────────────────────
    # Aggregate referrer counts at DB level, then classify in Python
    source_counts = {'social': 0, 'search': 0, 'direct': 0, 'other': 0}
    for row in period_events.values('referrer_url').annotate(n=Count('id')):
        bucket = _classify_referrer(row['referrer_url'])
        source_counts[bucket] += row['n']

    total_refs = sum(source_counts.values()) or 1
    traffic_sources = [
        {
            'name': label,
            'key': key,
            'value': source_counts[key],
            'pct': round(source_counts[key] / total_refs * 100),
        }
        for key, label in [
            ('social',  'Social Media'),
            ('search',  'Search Engines'),
            ('direct',  'Direct / Shared Link'),
            ('other',   'Other'),
        ]
    ]

    top_source = max(traffic_sources, key=lambda x: x['value'])
    top_state = top_states[0] if top_states else None

    return Response({
        'case_name': (
            case.case_title or
            f"{case.first_name or ''} {case.last_name or ''}".strip() or
            'Your Case'
        ),
        'period_days': days,
        'kpi': {
            'total_visits':    total_visits,
            'this_week':       this_week,
            'last_week':       last_week,
            'week_change_pct': week_change_pct,
            'avg_time_seconds':  avg_secs,
            'avg_time_formatted': avg_formatted,
        },
        'top_state':       top_state,
        'top_source':      top_source,
        'visits_over_time': visits_over_time,
        'traffic_sources': traffic_sources,
        'top_states':      top_states,
    })


# ─────────────────────────────────────────────────────────────────────────────
# IDENTITY ANOMALY DETECTION
# Same device fingerprint seen from multiple distinct IPs (or vice versa).
# Surfaced in the LEO / Admin analytics views.
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def identity_anomalies(request, case_slug):
    """
    Detect visitors whose fingerprint/network identity diverges over time.

    Patterns detected:
      1. same_fp_multi_ip  — one device fingerprint seen from N distinct IPs
                             (VPN rotation, travel, proxy hopping)
      2. same_ip_multi_fp  — one IP seen with N distinct fingerprints
                             (multiple users on same network, or browser
                              switching / cookie clearing)

    GET /api/tracker/dashboard/<case_slug>/identity-anomalies/
    """
    from django.db.models import Min, Max

    try:
        case = Case.objects.get(subdomain=case_slug)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    if case.user != request.user and not request.user.is_staff:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    events = TrackingEvent.objects.filter(case=case).exclude(fingerprint_hash='')

    # ── Pattern 1: same fingerprint, multiple IPs ────────────────────────────
    fp_rows = (
        events
        .values('fingerprint_hash')
        .annotate(
            distinct_ips=Count('ip_address', distinct=True),
            total_events=Count('id'),
            vpn_events=Count('id', filter=Q(is_vpn=True)),
            proxy_events=Count('id', filter=Q(is_proxy=True)),
            tor_events=Count('id', filter=Q(is_tor=True)),
            first_seen=Min('timestamp'),
            last_seen=Max('timestamp'),
        )
        .filter(distinct_ips__gt=1)
        .order_by('-distinct_ips', '-total_events')[:50]
    )

    same_fp_multi_ip = []
    for row in fp_rows:
        fp = row['fingerprint_hash']
        # Grab the actual IPs + regions for this fingerprint
        ip_details = list(
            events.filter(fingerprint_hash=fp)
            .values('ip_address', 'ip_region', 'ip_country')
            .annotate(
                hits=Count('id'),
                vpn=Count('id', filter=Q(is_vpn=True)),
                last_seen=Max('timestamp'),
            )
            .order_by('-hits')[:10]
        )
        for d in ip_details:
            if d['last_seen']:
                d['last_seen'] = d['last_seen'].isoformat()

        risk = (
            'critical' if row['tor_events'] > 0 else
            'high'     if row['vpn_events'] > 0 or row['distinct_ips'] >= 5 else
            'medium'   if row['distinct_ips'] >= 3 else
            'low'
        )

        same_fp_multi_ip.append({
            'fingerprint':   fp[:16],          # truncated for display
            'distinct_ips':  row['distinct_ips'],
            'total_events':  row['total_events'],
            'vpn_events':    row['vpn_events'],
            'proxy_events':  row['proxy_events'],
            'tor_events':    row['tor_events'],
            'first_seen':    row['first_seen'].isoformat() if row['first_seen'] else None,
            'last_seen':     row['last_seen'].isoformat()  if row['last_seen']  else None,
            'ip_details':    ip_details,
            'risk_level':    risk,
            'pattern':       'same_fp_multi_ip',
            'explanation':   (
                f"Device seen from {row['distinct_ips']} different IP addresses. "
                + ("Uses VPN/proxy. " if row['vpn_events'] or row['proxy_events'] else "")
                + ("Uses Tor. " if row['tor_events'] else "")
                + "May indicate identity concealment."
            ),
        })

    # ── Pattern 2: same IP, multiple fingerprints ────────────────────────────
    ip_rows = (
        events
        .exclude(ip_address__in=['', '0.0.0.0'])
        .values('ip_address')
        .annotate(
            distinct_fps=Count('fingerprint_hash', distinct=True),
            total_events=Count('id'),
            distinct_regions=Count('ip_region', distinct=True),
            first_seen=Min('timestamp'),
            last_seen=Max('timestamp'),
        )
        .filter(distinct_fps__gt=1)
        .order_by('-distinct_fps', '-total_events')[:50]
    )

    same_ip_multi_fp = []
    for row in ip_rows:
        ip = row['ip_address']
        fp_details = list(
            events.filter(ip_address=ip)
            .values('fingerprint_hash', 'ip_region')
            .annotate(
                hits=Count('id'),
                last_seen=Max('timestamp'),
            )
            .order_by('-hits')[:10]
        )
        for d in fp_details:
            d['fingerprint_hash'] = d['fingerprint_hash'][:16]
            if d['last_seen']:
                d['last_seen'] = d['last_seen'].isoformat()

        risk = (
            'high'   if row['distinct_fps'] >= 5 else
            'medium' if row['distinct_fps'] >= 3 else
            'low'
        )

        same_ip_multi_fp.append({
            'ip_address':    ip,
            'distinct_fps':  row['distinct_fps'],
            'total_events':  row['total_events'],
            'first_seen':    row['first_seen'].isoformat() if row['first_seen'] else None,
            'last_seen':     row['last_seen'].isoformat()  if row['last_seen']  else None,
            'fp_details':    fp_details,
            'risk_level':    risk,
            'pattern':       'same_ip_multi_fp',
            'explanation':   (
                f"{row['distinct_fps']} different devices detected from IP {ip}. "
                "Could be a shared network, or deliberate browser/cookie switching."
            ),
        })

    # ── Summary counts ────────────────────────────────────────────────────────
    total_anomalous_fps = len(same_fp_multi_ip)
    critical_count = sum(1 for r in same_fp_multi_ip if r['risk_level'] == 'critical')
    high_count     = sum(1 for r in same_fp_multi_ip if r['risk_level'] == 'high')

    return Response({
        'case_slug': case_slug,
        'summary': {
            'anomalous_fingerprints': total_anomalous_fps,
            'critical': critical_count,
            'high':     high_count,
            'shared_ips': len(same_ip_multi_fp),
        },
        'same_fp_multi_ip': same_fp_multi_ip,
        'same_ip_multi_fp': same_ip_multi_fp,
    })


# ============================================================================
# ML STATUS ENDPOINT
# ============================================================================

@require_http_methods(["GET"])
def get_ml_status(request):
    """
    GET /api/tracker/ml/status/

    Returns the health of the ML pipeline:
    - Whether the detection system is loaded
    - Model training metadata (last trained, sample counts)
    - Celery queue sizes (if Redis is reachable)
    - Recent task counts
    - Labeled-sample counts by class
    """
    import json
    from pathlib import Path
    from django.conf import settings as django_settings
    from .apps import get_detection_system
    from .models import MLTrainingLabel, TrackingEvent, SuspiciousActivity

    status = {
        'detection_system_loaded': False,
        'ml_models': {},
        'training': {},
        'celery': {},
        'database': {},
    }

    # ── Detection system ─────────────────────────────────────────────────────
    try:
        ds = get_detection_system()
        status['detection_system_loaded'] = ds is not None
    except Exception as exc:
        status['detection_system_loaded'] = False
        status['detection_system_error'] = str(exc)

    # ── Model files ──────────────────────────────────────────────────────────
    model_dir = Path(getattr(django_settings, 'MEDIA_ROOT', '/tmp')) / 'ml_models'
    model_files = {
        'isolation_forest': 'isolation_forest.joblib',
        'gradient_boosting': 'gradient_boosting.joblib',
        'random_forest':     'random_forest.joblib',
        'scaler':            'scaler.joblib',
    }
    for name, filename in model_files.items():
        path = model_dir / filename
        status['ml_models'][name] = {
            'exists': path.exists(),
            'size_kb': round(path.stat().st_size / 1024, 1) if path.exists() else None,
        }

    # ── Training metadata ────────────────────────────────────────────────────
    meta_path = model_dir / 'training_meta.json'
    if meta_path.exists():
        try:
            status['training'] = json.loads(meta_path.read_text())
        except Exception:
            status['training'] = {'error': 'Could not parse training_meta.json'}
    else:
        status['training'] = {'trained': False, 'message': 'Run: python manage.py train_ml'}

    # ── Label counts ─────────────────────────────────────────────────────────
    label_counts = {}
    for row in MLTrainingLabel.objects.values('label').annotate(
        count=models.Count('id')
    ):
        label_counts[row['label']] = row['count']

    status['training']['label_counts'] = label_counts
    status['training']['total_labels'] = sum(label_counts.values())

    # ── Database stats ───────────────────────────────────────────────────────
    try:
        status['database'] = {
            'total_events': TrackingEvent.objects.count(),
            'ml_analyzed_events': TrackingEvent.objects.filter(ml_analyzed=True).count(),
            'suspicious_events': TrackingEvent.objects.filter(is_suspicious=True).count(),
            'suspicious_activities': SuspiciousActivity.objects.count(),
            'honeypot_hits': SuspiciousActivity.objects.filter(
                activity_type='honeypot_triggered'
            ).count(),
        }
    except Exception as exc:
        status['database'] = {'error': str(exc)}

    # ── Celery / Redis ────────────────────────────────────────────────────────
    try:
        from celery.app.control import Control
        from core.celery import app as celery_app

        inspect = celery_app.control.inspect(timeout=2)
        active  = inspect.active()   # running tasks right now
        reserved = inspect.reserved()  # tasks waiting in worker memory

        worker_names = list((active or {}).keys())
        active_count = sum(len(v) for v in (active or {}).values())
        reserved_count = sum(len(v) for v in (reserved or {}).values())

        status['celery'] = {
            'broker_reachable': True,
            'workers_online': len(worker_names),
            'worker_names': worker_names,
            'active_tasks': active_count,
            'reserved_tasks': reserved_count,
        }
    except Exception as exc:
        status['celery'] = {
            'broker_reachable': False,
            'error': str(exc),
            'note': (
                'Celery workers are offline or Redis is not configured. '
                'Set REDIS_URL in your environment and deploy workers.'
            ),
        }

    return JsonResponse(status)
