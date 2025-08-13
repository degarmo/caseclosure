# backend/tracker/views.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.db.models import Count, Avg, F, Q, Sum, Max, Min
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from datetime import datetime, timedelta
import json
import hashlib
import uuid
from user_agents import parse
import csv
from io import StringIO

# Import Case model from cases app
from cases.models import Case

# Import tracker models
from .models import (
    TrackingEvent, 
    UserSession, 
    SuspiciousActivity,
    DeviceFingerprint, 
    Alert
)
from .apps import get_detection_system

# ============================================
# TRACKING ENDPOINTS
# ============================================

@csrf_exempt
@require_http_methods(["POST"])
def track_event(request):
    """
    Main endpoint for receiving tracking events from frontend
    POST /api/track/
    """
    try:
        data = json.loads(request.body)
        
        # Get or create case
        case_id = data.get('caseId', 'global')
        case = None
        if case_id != 'global':
            try:
                # Try as integer ID first
                if str(case_id).isdigit():
                    case = Case.objects.get(id=int(case_id))
                else:
                    # Try subdomain/slug
                    case = Case.objects.get(Q(subdomain=case_id) | Q(slug=case_id))
            except Case.DoesNotExist:
                # Don't fail if case not found, just track without case
                pass
        
        # Extract client information
        client_info = extract_client_info(request)
        
        # Get or create session
        session = get_or_create_session(
            data.get('sessionId'),
            data.get('fingerprint', ''),
            client_info,
            case
        )
        
        # Enrich event data with browser/device info
        enriched_data = enrich_event_data(data, client_info, session)
        
        # Create tracking event - IMPORTANT: Use data.get() for is_tor/is_vpn
        event = TrackingEvent.objects.create(
            case=case,
            session=session,
            session_identifier=session.session_id if session else '',
            fingerprint_hash=data.get('fingerprint', ''),
            event_type=data.get('eventType', 'page_view'),
            event_data=data.get('eventData', {}),
            page_url=data.get('url', ''),
            page_title=data.get('pageTitle', ''),
            referrer_url=data.get('referrer', ''),
            
            # Network info - CRITICAL: Get is_tor/is_vpn from request data, not enriched_data
            ip_address=client_info['ip'],
            ip_country=enriched_data.get('country', ''),
            ip_region=enriched_data.get('region', ''),
            ip_city=enriched_data.get('city', ''),
            is_vpn=data.get('is_vpn', False),  # From request data
            is_proxy=data.get('is_proxy', False),  # From request data
            is_tor=data.get('is_tor', False),  # From request data
            
            # Device info
            user_agent=client_info['user_agent'],
            browser=enriched_data.get('browser', ''),
            browser_version=enriched_data.get('browser_version', ''),
            os=enriched_data.get('os', ''),
            os_version=enriched_data.get('os_version', ''),
            device_type=enriched_data.get('device_type', ''),
            
            # Screen info
            screen_width=data.get('screenWidth'),
            screen_height=data.get('screenHeight'),
            viewport_width=data.get('viewport', {}).get('width') if isinstance(data.get('viewport'), dict) else None,
            viewport_height=data.get('viewport', {}).get('height') if isinstance(data.get('viewport'), dict) else None,
            
            # Time info
            timestamp=timezone.now(),
            timezone=data.get('timezone', ''),
            local_timestamp=parse_local_timestamp(data.get('localTime')),
            is_unusual_hour=data.get('isUnusualHour', False),
            
            # Interaction metrics
            time_on_page=data.get('timeOnPage'),
            scroll_depth=data.get('scrollDepth'),
            clicks_count=data.get('clicksCount', 0),
        )
        
        # Debug logging
        print(f"DEBUG: Event created - is_tor: {event.is_tor}, is_vpn: {event.is_vpn}")
        
        # Initialize with defaults
        suspicious_score = 0.0
        detection_result = {'criminal_score': 0, 'threat_level': 'MINIMAL'}
        
        try:
            # Get and use detection system
            detection_system = get_detection_system()
            print(f"DEBUG: Detection system loaded: {detection_system}")
            
            if detection_system:
                detection_result = detection_system.analyze_event(event)
                print(f"DEBUG: Detection result: {detection_result}")
                
                # Convert criminal_score (0-10) to suspicious_score (0-1)
                suspicious_score = detection_result.get('criminal_score', 0) / 10.0
                print(f"DEBUG: Suspicious score: {suspicious_score}")
        except Exception as e:
            print(f"ERROR: Detection system failed: {e}")
            import traceback
            traceback.print_exc()
            # Fall back to basic scoring
            suspicious_score = calculate_basic_suspicious_score(event)
        
        # Update event with suspicious score
        event.suspicious_score = suspicious_score
        event.is_suspicious = suspicious_score > 0.7
        event.save()
        
        # Update session metrics
        if session:
            update_session_metrics(session, event)
        
        # Check if we need to create an alert
        if detection_result.get('threat_level') in ['HIGH', 'CRITICAL'] and case:
            create_suspicious_alert(event, suspicious_score, detection_result)
        
        return JsonResponse({
            'status': 'success',
            'eventId': str(event.id),
            'sessionId': session.session_id if session else None,
            'suspiciousScore': suspicious_score
        })
        
    except Exception as e:
        print(f"ERROR in track_event: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_batch(request):
    """
    Endpoint for receiving batch tracking events
    POST /api/track/batch/
    """
    try:
        data = json.loads(request.body)
        events = data.get('events', [])
        
        results = []
        for event_data in events:
            # Process each event (simplified version of track_event)
            try:
                # Create a modified request data for track_event
                event_data['sessionId'] = data.get('sessionId')
                event_data['caseId'] = data.get('caseId')
                event_data['fingerprint'] = data.get('fingerprint')
                
                # Process the event
                results.append({'status': 'success', 'event': event_data.get('eventType')})
            except Exception as e:
                results.append({'status': 'error', 'error': str(e)})
        
        return JsonResponse({
            'status': 'success',
            'processed': len(results),
            'results': results
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def report_suspicious(request):
    """
    Endpoint for manually reporting suspicious activity
    POST /api/suspicious/report/
    """
    try:
        data = json.loads(request.body)
        
        # Try to find the case
        case = None
        case_id = data.get('caseId')
        if case_id:
            try:
                case = Case.objects.get(Q(slug=case_id) | Q(subdomain=case_id) | Q(id=case_id))
            except Case.DoesNotExist:
                pass
        
        if not case:
            return JsonResponse({'error': 'Case not found'}, status=404)
        
        suspicious_activity = SuspiciousActivity.objects.create(
            case=case,
            session_identifier=data.get('sessionId', ''),
            fingerprint_hash=data.get('fingerprint', ''),
            ip_address=data.get('ipAddress', '0.0.0.0'),
            activity_type=data.get('activityType', 'suspicious_pattern'),
            severity_level=data.get('severityLevel', 3),
            details=data.get('details', {}),
            evidence=data.get('evidence', {})
        )
        
        # Create alert for manual reports
        Alert.objects.create(
            case=case,
            alert_type='suspicious_user',
            priority='high',
            title=f"Manual Suspicious Report - {data.get('activityType')}",
            message=data.get('description', 'Manual suspicious activity report'),
            suspicious_activity=suspicious_activity,
            fingerprint_hash=data.get('fingerprint', '')
        )
        
        return JsonResponse({
            'status': 'success',
            'activityId': str(suspicious_activity.id)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================
# ACTIVITY ENDPOINTS
# ============================================

@require_http_methods(["GET"])
def last_activity(request):
    """
    Get last activity for a case or all cases
    GET /api/activity/last/
    """
    try:
        # Get case_id from query params if provided
        case_id = request.GET.get('case_id')
        
        if case_id:
            # Get last activity for specific case
            last_event = TrackingEvent.objects.filter(
                case_id=case_id
            ).order_by('-timestamp').first()
            
            last_session = UserSession.objects.filter(
                case_id=case_id
            ).order_by('-last_activity').first()
        else:
            # Get last activity across all cases
            last_event = TrackingEvent.objects.order_by('-timestamp').first()
            last_session = UserSession.objects.order_by('-last_activity').first()
        
        response_data = {
            'last_event': None,
            'last_session': None,
            'last_activity_time': None
        }
        
        if last_event:
            response_data['last_event'] = {
                'id': str(last_event.id),
                'event_type': last_event.event_type,
                'timestamp': last_event.timestamp.isoformat(),
                'case_id': str(last_event.case_id) if last_event.case_id else None,
                'ip_address': last_event.ip_address,
                'page_url': last_event.page_url
            }
            response_data['last_activity_time'] = last_event.timestamp.isoformat()
        
        if last_session:
            response_data['last_session'] = {
                'id': str(last_session.id),
                'session_id': last_session.session_id,
                'created_at': last_session.created_at.isoformat(),
                'last_activity': last_session.last_activity.isoformat(),
                'case_id': str(last_session.case_id) if last_session.case_id else None,
                'page_views': last_session.page_views
            }
            
            # Update last_activity_time if session is more recent
            if not response_data['last_activity_time'] or \
               (last_event and last_session.last_activity > last_event.timestamp):
                response_data['last_activity_time'] = last_session.last_activity.isoformat()
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@login_required
@require_http_methods(["GET"])
def dashboard_overview(request, case_slug):
    """
    Get dashboard overview statistics
    GET /api/dashboard/{case_slug}/
    """
    try:
        # Try to find case by slug, subdomain, or ID
        case = None
        try:
            case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug) | Q(id=case_slug))
        except Case.DoesNotExist:
            return JsonResponse({'error': 'Case not found'}, status=404)
        
        # Check cache first
        cache_key = f'dashboard_overview_{case_slug}'
        cached_data = cache.get(cache_key)
        if cached_data and not request.GET.get('refresh'):
            return JsonResponse(cached_data)
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        # Basic stats
        stats = {
            'total_visitors': UserSession.objects.filter(case=case).values('fingerprint_hash').distinct().count(),
            'total_page_views': TrackingEvent.objects.filter(case=case).count(),
            'suspicious_users': SuspiciousActivity.objects.filter(case=case).values('fingerprint_hash').distinct().count(),
            'active_alerts': Alert.objects.filter(case=case, resolved=False).count(),
            
            # Time-based stats
            'visitors_24h': UserSession.objects.filter(
                case=case, created_at__gte=last_24h
            ).values('fingerprint_hash').distinct().count(),
            'visitors_7d': UserSession.objects.filter(
                case=case, created_at__gte=last_7d
            ).values('fingerprint_hash').distinct().count(),
            'visitors_30d': UserSession.objects.filter(
                case=case, created_at__gte=last_30d
            ).values('fingerprint_hash').distinct().count(),
            
            # Suspicious activity
            'suspicious_24h': SuspiciousActivity.objects.filter(
                case=case, created_at__gte=last_24h
            ).count(),
            'high_risk_users': SuspiciousActivity.objects.filter(
                case=case, severity_level__gte=4
            ).values('fingerprint_hash').distinct().count(),
        }
        
        # Get trends
        stats['visitor_trend'] = get_visitor_trend(case)
        stats['suspicious_trend'] = get_suspicious_trend(case)
        
        # Get geographic distribution
        stats['geographic_distribution'] = get_geographic_distribution(case)
        
        # Get device breakdown
        stats['device_breakdown'] = get_device_breakdown(case)
        
        # Get top referrers
        stats['top_referrers'] = get_top_referrers(case)
        
        # Get peak hours
        stats['peak_hours'] = get_peak_hours(case)
        
        # Get recent suspicious activities
        stats['recent_suspicious'] = get_recent_suspicious(case)
        
        # Get alerts
        stats['alerts'] = get_active_alerts(case)
        
        response_data = {
            'status': 'success',
            'stats': stats,
            'case': {
                'id': str(case.id),
                'subdomain': case.subdomain,
                'victim_name': case.victim_name,
                'name': case.name
            }
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, response_data, 300)
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def dashboard_realtime(request, case_slug):
    """
    Get real-time activity stream
    GET /api/dashboard/{case_slug}/realtime/
    """
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug) | Q(id=case_slug))
        
        # Get last 5 minutes of activity
        since = timezone.now() - timedelta(minutes=5)
        
        events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=since
        ).select_related('session').order_by('-timestamp')[:50]
        
        activity_stream = []
        for event in events:
            activity_stream.append({
                'id': str(event.id),
                'timestamp': event.timestamp.isoformat(),
                'type': event.event_type,
                'page': event.page_url,
                'user': event.fingerprint_hash[:8] if event.fingerprint_hash else 'Unknown',
                'location': f"{event.ip_city}, {event.ip_country}" if event.ip_city else event.ip_country,
                'is_suspicious': event.is_suspicious,
                'suspicious_score': event.suspicious_score,
                'is_vpn': event.is_vpn,
                'device': event.device_type,
                'browser': event.browser
            })
        
        # Get current active users
        active_users = UserSession.objects.filter(
            case=case,
            last_activity__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        return JsonResponse({
            'status': 'success',
            'activity': activity_stream,
            'active_users': active_users,
            'timestamp': timezone.now().isoformat()
        })
        
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def dashboard_suspicious_users(request, case_slug):
    """
    Get detailed suspicious users list
    GET /api/dashboard/{case_slug}/suspicious/
    """
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug) | Q(id=case_slug))
        
        # Get suspicious activities grouped by user
        suspicious_users = []
        
        # Get unique fingerprints with suspicious activity
        fingerprints = SuspiciousActivity.objects.filter(
            case=case
        ).values('fingerprint_hash').annotate(
            total_activities=Count('id'),
            max_severity=Max('severity_level'),
            avg_confidence=Avg('confidence_score')
        ).order_by('-max_severity', '-total_activities')[:100]
        
        for fp_data in fingerprints:
            fingerprint = fp_data['fingerprint_hash']
            
            # Get user sessions
            sessions = UserSession.objects.filter(
                case=case,
                fingerprint_hash=fingerprint
            ).order_by('-created_at')
            
            if not sessions:
                continue
                
            first_session = sessions.last()
            last_session = sessions.first()
            
            # Get all suspicious activities
            activities = SuspiciousActivity.objects.filter(
                case=case,
                fingerprint_hash=fingerprint
            ).order_by('-created_at')[:10]
            
            # Get recent events
            recent_events = TrackingEvent.objects.filter(
                case=case,
                fingerprint_hash=fingerprint
            ).order_by('-timestamp')[:20]
            
            # Calculate risk score
            risk_score = calculate_user_risk_score(activities, recent_events)
            
            user_data = {
                'fingerprint': fingerprint[:16] + '...' if fingerprint else 'Unknown',
                'fingerprint_full': fingerprint,
                'first_seen': first_session.created_at.isoformat() if first_session else None,
                'last_seen': last_session.last_activity.isoformat() if last_session else None,
                'total_sessions': sessions.count(),
                'total_events': recent_events.count(),
                'suspicious_activities': fp_data['total_activities'],
                'max_severity': fp_data['max_severity'],
                'avg_confidence': fp_data['avg_confidence'],
                'risk_score': risk_score,
                'risk_level': get_risk_level(risk_score),
                
                # Location data
                'locations': list(sessions.values_list('ip_city', flat=True).distinct()),
                'countries': list(sessions.values_list('ip_country', flat=True).distinct()),
                'uses_vpn': sessions.filter(is_vpn=True).exists(),
                
                # Device data
                'devices': list(sessions.values('device_type', 'browser', 'os').distinct()),
                
                # Activity details
                'activities': [
                    {
                        'id': str(activity.id),
                        'type': activity.activity_type,
                        'severity': activity.severity_level,
                        'confidence': activity.confidence_score,
                        'timestamp': activity.created_at.isoformat(),
                        'details': activity.details
                    }
                    for activity in activities
                ],
                
                # Behavioral flags
                'flags': {
                    'rapid_visits': activities.filter(activity_type='rapid_visits').exists(),
                    'unusual_hours': sessions.filter(is_unusual_hour=True).count() > 0,
                    'vpn_usage': sessions.filter(is_vpn=True).count() / max(sessions.count(), 1),
                    'geo_jumps': activities.filter(activity_type='geo_jump').exists(),
                    'data_scraping': activities.filter(activity_type='data_scraping').exists(),
                }
            }
            
            suspicious_users.append(user_data)
        
        # Sort by risk score
        suspicious_users.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return JsonResponse({
            'status': 'success',
            'users': suspicious_users,
            'total': len(suspicious_users)
        })
        
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
def dashboard_patterns(request, case_slug):
    """
    Get behavioral patterns analysis
    GET /api/dashboard/{case_slug}/patterns/
    """
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug) | Q(id=case_slug))
        
        # Placeholder for ML analysis
        patterns = {'clusters': [], 'suspicious_clusters': []}
        
        # Analyze temporal patterns
        temporal_patterns = analyze_temporal_patterns(case)
        
        # Analyze navigation patterns
        navigation_patterns = analyze_navigation_patterns(case)
        
        # Analyze interaction patterns
        interaction_patterns = analyze_interaction_patterns(case)
        
        return JsonResponse({
            'status': 'success',
            'patterns': {
                'behavioral_clusters': patterns,
                'temporal': temporal_patterns,
                'navigation': navigation_patterns,
                'interaction': interaction_patterns
            }
        })
        
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def export_data(request, case_slug):
    """
    Export case data
    POST /api/dashboard/{case_slug}/export/
    """
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug) | Q(id=case_slug))
        data = json.loads(request.body)
        
        export_type = data.get('type', 'csv')  # csv, json, pdf
        include_suspicious = data.get('include_suspicious', True)
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        # Build export data
        export_data = build_export_data(case, include_suspicious, date_from, date_to)
        
        if export_type == 'json':
            return JsonResponse(export_data)
        elif export_type == 'csv':
            # Convert to CSV format
            csv_data = convert_to_csv(export_data)
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="case_{case_slug}_export.csv"'
            return response
        else:
            return JsonResponse({'error': 'Unsupported export type'}, status=400)
            
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================
# WIDGET ENDPOINTS
# ============================================

@login_required
def visitor_metrics_widget(request, case_slug):
    """Get visitor metrics widget data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        metrics = {
            'total_visitors': UserSession.objects.filter(case=case).values('fingerprint_hash').distinct().count(),
            'visitors_24h': UserSession.objects.filter(case=case, created_at__gte=last_24h).values('fingerprint_hash').distinct().count(),
            'visitors_7d': UserSession.objects.filter(case=case, created_at__gte=last_7d).values('fingerprint_hash').distinct().count(),
            'page_views': TrackingEvent.objects.filter(case=case).count(),
            'avg_session_duration': UserSession.objects.filter(case=case).aggregate(avg=Avg('total_duration'))['avg'] or 0,
        }
        
        return JsonResponse({'status': 'success', 'data': metrics})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def suspicious_activity_widget(request, case_slug):
    """Get suspicious activity widget data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        activities = SuspiciousActivity.objects.filter(case=case).order_by('-created_at')[:10]
        
        data = [{
            'id': str(a.id),
            'type': a.activity_type,
            'severity': a.severity_level,
            'timestamp': a.created_at.isoformat(),
            'fingerprint': a.fingerprint_hash[:8] if a.fingerprint_hash else 'Unknown',
        } for a in activities]
        
        return JsonResponse({'status': 'success', 'data': data})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def geographic_map_widget(request, case_slug):
    """Get geographic distribution data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        locations = TrackingEvent.objects.filter(case=case).values('ip_country', 'ip_city').annotate(
            count=Count('id')
        ).order_by('-count')[:50]
        
        return JsonResponse({'status': 'success', 'data': list(locations)})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def activity_timeline_widget(request, case_slug):
    """Get activity timeline data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        hours = int(request.GET.get('hours', 24))
        
        since = timezone.now() - timedelta(hours=hours)
        events = TrackingEvent.objects.filter(case=case, timestamp__gte=since).order_by('-timestamp')[:100]
        
        timeline = [{
            'id': str(e.id),
            'timestamp': e.timestamp.isoformat(),
            'type': e.event_type,
            'page': e.page_url,
            'suspicious': e.is_suspicious,
        } for e in events]
        
        return JsonResponse({'status': 'success', 'data': timeline})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def engagement_metrics_widget(request, case_slug):
    """Get engagement metrics data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        metrics = {
            'avg_time_on_page': TrackingEvent.objects.filter(case=case).aggregate(avg=Avg('time_on_page'))['avg'] or 0,
            'avg_scroll_depth': TrackingEvent.objects.filter(case=case).aggregate(avg=Avg('scroll_depth'))['avg'] or 0,
            'total_clicks': TrackingEvent.objects.filter(case=case).aggregate(sum=Sum('clicks_count'))['sum'] or 0,
            'bounce_rate': UserSession.objects.filter(case=case, bounce=True).count() / max(UserSession.objects.filter(case=case).count(), 1) * 100,
        }
        
        return JsonResponse({'status': 'success', 'data': metrics})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def alerts_panel_widget(request, case_slug):
    """Get alerts panel data"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        alerts = Alert.objects.filter(case=case, resolved=False).order_by('-priority', '-created_at')[:10]
        
        data = [{
            'id': str(a.id),
            'type': a.alert_type,
            'priority': a.priority,
            'title': a.title,
            'message': a.message,
            'timestamp': a.created_at.isoformat(),
        } for a in alerts]
        
        return JsonResponse({'status': 'success', 'data': data})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def realtime_activity_stream(request, case_slug):
    """Get real-time activity stream"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        since = timezone.now() - timedelta(minutes=1)
        events = TrackingEvent.objects.filter(case=case, timestamp__gte=since).order_by('-timestamp')[:20]
        
        stream = [{
            'id': str(e.id),
            'timestamp': e.timestamp.isoformat(),
            'type': e.event_type,
            'user': e.fingerprint_hash[:8] if e.fingerprint_hash else 'Unknown',
            'page': e.page_url,
        } for e in events]
        
        return JsonResponse({'status': 'success', 'data': stream})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


@login_required
def realtime_metrics(request, case_slug):
    """Get real-time metrics"""
    try:
        case = Case.objects.get(Q(slug=case_slug) | Q(subdomain=case_slug))
        
        now = timezone.now()
        last_minute = now - timedelta(minutes=1)
        last_5_minutes = now - timedelta(minutes=5)
        
        metrics = {
            'active_users': UserSession.objects.filter(case=case, last_activity__gte=last_5_minutes).count(),
            'events_per_minute': TrackingEvent.objects.filter(case=case, timestamp__gte=last_minute).count(),
            'suspicious_events': TrackingEvent.objects.filter(case=case, timestamp__gte=last_5_minutes, is_suspicious=True).count(),
        }
        
        return JsonResponse({'status': 'success', 'data': metrics})
    except Case.DoesNotExist:
        return JsonResponse({'error': 'Case not found'}, status=404)


# ============================================
# ADMIN ENDPOINTS
# ============================================

@login_required
@require_http_methods(["GET"])
def admin_alerts(request):
    """
    Get all active alerts across all cases
    GET /api/admin/alerts/
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        alerts = Alert.objects.filter(
            resolved=False
        ).select_related('case', 'suspicious_activity').order_by('-priority', '-created_at')[:100]
        
        alert_list = []
        for alert in alerts:
            alert_list.append({
                'id': str(alert.id),
                'case': {
                    'id': str(alert.case.id),
                    'subdomain': alert.case.subdomain,
                    'victim_name': alert.case.victim_name
                } if alert.case else None,
                'type': alert.alert_type,
                'priority': alert.priority,
                'title': alert.title,
                'message': alert.message,
                'fingerprint': alert.fingerprint_hash[:16] if alert.fingerprint_hash else None,
                'created_at': alert.created_at.isoformat(),
                'acknowledged': alert.acknowledged,
                'data': alert.data
            })
        
        return JsonResponse({
            'status': 'success',
            'alerts': alert_list,
            'total': len(alert_list)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def admin_flag_user(request, fingerprint):
    """
    Flag a user for law enforcement review
    POST /api/admin/flag/{fingerprint}/
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Update all suspicious activities for this user
        SuspiciousActivity.objects.filter(
            fingerprint_hash=fingerprint
        ).update(
            flagged_for_law_enforcement=True,
            reviewed=True,
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        
        # Create high priority alert
        cases = Case.objects.filter(
            suspicious_activities__fingerprint_hash=fingerprint
        ).distinct()
        
        for case in cases:
            Alert.objects.create(
                case=case,
                alert_type='law_enforcement',
                priority='critical',
                title=f"User Flagged for Law Enforcement",
                message=f"User {fingerprint[:16]} has been flagged for law enforcement review. Reason: {data.get('reason', 'No reason provided')}",
                fingerprint_hash=fingerprint,
                data={
                    'flagged_by': request.user.username,
                    'reason': data.get('reason'),
                    'notes': data.get('notes')
                }
            )
        
        return JsonResponse({
            'status': 'success',
            'message': 'User flagged for law enforcement review'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================
# HELPER FUNCTIONS
# ============================================

def extract_client_info(request):
    """Extract client information from request"""
    # Get IP address
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    
    # Get user agent
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    return {
        'ip': ip,
        'user_agent': user_agent,
        'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        'referer': request.META.get('HTTP_REFERER', '')
    }


def get_or_create_session(session_id, fingerprint, client_info, case):
    """Get or create a user session"""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        session, created = UserSession.objects.get_or_create(
            session_id=session_id,
            defaults={
                'case': case,
                'fingerprint_hash': fingerprint or '',
                'ip_address': client_info['ip'],
                'user_agent': client_info['user_agent'],
                'created_at': timezone.now(),
                'last_activity': timezone.now()
            }
        )
        
        if not created:
            session.last_activity = timezone.now()
            session.save()
        
        return session
    except Exception:
        # If session creation fails, return None
        return None


def enrich_event_data(data, client_info, session):
    """Enrich event data with additional information"""
    enriched = {}
    
    # Parse user agent
    if client_info['user_agent']:
        try:
            ua = parse(client_info['user_agent'])
            enriched['browser'] = ua.browser.family
            enriched['browser_version'] = ua.browser.version_string
            enriched['os'] = ua.os.family
            enriched['os_version'] = ua.os.version_string
            enriched['device_type'] = 'mobile' if ua.is_mobile else 'tablet' if ua.is_tablet else 'desktop'
            enriched['device_brand'] = ua.device.brand or ''
            enriched['device_model'] = ua.device.model or ''
        except:
            pass
    
    # GeoIP lookup (placeholder - would use real GeoIP service)
    enriched.update({
        'country': 'US',
        'region': 'Unknown',
        'city': 'Unknown',
    })
    
    # DON'T override is_vpn, is_proxy, is_tor here - those come from request data
    
    return enriched


def update_session_metrics(session, event):
    """Update session metrics based on new event"""
    if not session:
        return
        
    session.page_views += 1
    session.last_activity = timezone.now()
    
    if event.event_type == 'form_submit':
        session.forms_submitted += 1
    elif event.event_type == 'copy':
        session.copy_events += 1
    
    # Calculate average time per page
    if session.page_views > 1:
        duration = (session.last_activity - session.created_at).total_seconds()
        session.avg_time_per_page = duration / session.page_views
        session.total_duration = int(duration)
    
    session.save()


def calculate_basic_suspicious_score(event):
    """Calculate basic suspicious score without ML"""
    score = 0.0
    
    # Check for VPN/Proxy/Tor
    if event.is_tor:
        score += 0.6  # Match ML system: 6.0 / 10
    if event.is_vpn:
        score += 0.36  # Match ML system: 3.6 / 10
    if event.is_proxy:
        score += 0.2
    
    # Check for unusual hour
    if event.is_unusual_hour:
        score += 0.1
    
    # Check for rapid events
    if event.event_type in ['rapid_navigation', 'suspicious_pattern']:
        score += 0.2
    
    return min(score, 1.0)


def create_suspicious_alert(event, score, detection_result=None):
    """Create alert for suspicious activity"""
    if not event.case:
        return  # Don't create alerts without a case
        
    Alert.objects.create(
        case=event.case,
        alert_type='suspicious_user',
        priority='high' if score > 0.9 else 'medium',
        title=f"Suspicious Activity Detected - {detection_result.get('threat_level', 'UNKNOWN')} - Score: {score:.2f}",
        message=f"User {event.fingerprint_hash[:16] if event.fingerprint_hash else 'Unknown'} triggered suspicious behavior detection",
        session=event.session,
        fingerprint_hash=event.fingerprint_hash,
        data={
            'event_id': str(event.id),
            'event_type': event.event_type,
            'score': score,
            'criminal_score': detection_result.get('criminal_score', 0) if detection_result else 0,
            'threat_level': detection_result.get('threat_level', 'UNKNOWN') if detection_result else 'UNKNOWN',
            'detections': detection_result.get('detections', []) if detection_result else [],
            'ip': event.ip_address,
            'location': f"{event.ip_city}, {event.ip_country}" if event.ip_city else event.ip_country or 'Unknown'
        }
    )


def calculate_user_risk_score(activities, events):
    """Calculate overall risk score for a user"""
    if not activities.exists():
        return 0.0
    
    # Weight different factors
    total_activities = activities.count()
    severity_sum = sum(a.severity_level for a in activities)
    severity_score = severity_sum / (total_activities * 5) if total_activities > 0 else 0
    
    confidence_sum = sum(a.confidence_score for a in activities)
    confidence_score = confidence_sum / total_activities if total_activities > 0 else 0
    
    frequency_score = min(total_activities / 10, 1.0)
    
    # Check for specific high-risk patterns
    high_risk_types = ['geo_jump', 'data_scraping', 'sql_injection', 'xss_attempt']
    high_risk_count = activities.filter(activity_type__in=high_risk_types).count()
    high_risk_score = high_risk_count / len(high_risk_types) if len(high_risk_types) > 0 else 0
    
    # Calculate weighted score
    risk_score = (
        severity_score * 0.3 +
        confidence_score * 0.3 +
        frequency_score * 0.2 +
        high_risk_score * 0.2
    )
    
    return min(risk_score, 1.0)


def get_risk_level(risk_score):
    """Convert risk score to risk level"""
    if risk_score >= 0.8:
        return 'CRITICAL'
    elif risk_score >= 0.6:
        return 'HIGH'
    elif risk_score >= 0.4:
        return 'MEDIUM'
    elif risk_score >= 0.2:
        return 'LOW'
    else:
        return 'MINIMAL'


def parse_local_timestamp(timestamp_str):
    """Parse local timestamp string"""
    if not timestamp_str:
        return None
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except:
        return None


def get_visitor_trend(case):
    """Get visitor trend data for last 7 days"""
    trends = []
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        count = UserSession.objects.filter(
            case=case,
            created_at__date=date
        ).values('fingerprint_hash').distinct().count()
        trends.append({'date': date.isoformat(), 'visitors': count})
    return list(reversed(trends))


def get_suspicious_trend(case):
    """Get suspicious activity trend for last 7 days"""
    trends = []
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        count = SuspiciousActivity.objects.filter(
            case=case,
            created_at__date=date
        ).count()
        trends.append({'date': date.isoformat(), 'activities': count})
    return list(reversed(trends))


def get_geographic_distribution(case):
    """Get geographic distribution of visitors"""
    distribution = TrackingEvent.objects.filter(case=case).values('ip_country').annotate(
        count=Count('fingerprint_hash', distinct=True)
    ).order_by('-count')[:10]
    return list(distribution)


def get_device_breakdown(case):
    """Get device type breakdown"""
    breakdown = TrackingEvent.objects.filter(case=case).values('device_type').annotate(
        count=Count('fingerprint_hash', distinct=True)
    ).order_by('-count')
    return list(breakdown)


def get_top_referrers(case):
    """Get top referrer sources"""
    referrers = TrackingEvent.objects.filter(case=case).exclude(
        referrer_url=''
    ).values('referrer_url').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    return list(referrers)


def get_peak_hours(case):
    """Get peak activity hours"""
    hours = []
    for hour in range(24):
        count = TrackingEvent.objects.filter(
            case=case,
            timestamp__hour=hour
        ).count()
        hours.append({'hour': hour, 'count': count})
    return hours


def get_recent_suspicious(case):
    """Get recent suspicious activities"""
    activities = SuspiciousActivity.objects.filter(case=case).order_by('-created_at')[:10]
    return [{
        'id': str(a.id),
        'type': a.activity_type,
        'severity': a.severity_level,
        'timestamp': a.created_at.isoformat(),
        'fingerprint': a.fingerprint_hash[:8] if a.fingerprint_hash else 'Unknown',
    } for a in activities]


def get_active_alerts(case):
    """Get active alerts for case"""
    alerts = Alert.objects.filter(case=case, resolved=False).order_by('-priority', '-created_at')[:10]
    return [{
        'id': str(a.id),
        'type': a.alert_type,
        'priority': a.priority,
        'title': a.title,
        'timestamp': a.created_at.isoformat(),
    } for a in alerts]


def analyze_temporal_patterns(case):
    """Analyze temporal patterns in user behavior"""
    patterns = {
        'peak_hours': get_peak_hours(case),
        'day_of_week': [],
        'unusual_access_times': 0,
    }
    
    # Day of week analysis
    for day in range(7):
        count = TrackingEvent.objects.filter(
            case=case,
            timestamp__week_day=day + 1  # Django uses 1=Sunday, 7=Saturday
        ).count()
        patterns['day_of_week'].append({'day': day, 'count': count})
    
    # Count unusual hour accesses
    patterns['unusual_access_times'] = TrackingEvent.objects.filter(
        case=case,
        is_unusual_hour=True
    ).count()
    
    return patterns


def analyze_navigation_patterns(case):
    """Analyze navigation patterns"""
    patterns = {
        'most_visited_pages': [],
        'entry_pages': [],
        'exit_pages': [],
    }
    
    # Most visited pages
    pages = TrackingEvent.objects.filter(case=case).values('page_url').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    patterns['most_visited_pages'] = list(pages)
    
    # Entry pages
    entry = UserSession.objects.filter(case=case).values('entry_page').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    patterns['entry_pages'] = list(entry)
    
    # Exit pages  
    exit = UserSession.objects.filter(case=case).values('exit_page').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    patterns['exit_pages'] = list(exit)
    
    return patterns


def analyze_interaction_patterns(case):
    """Analyze user interaction patterns"""
    patterns = {
        'avg_time_on_page': 0,
        'avg_scroll_depth': 0,
        'avg_clicks': 0,
        'form_submissions': 0,
    }
    
    # Calculate averages
    aggregates = TrackingEvent.objects.filter(case=case).aggregate(
        avg_time=Avg('time_on_page'),
        avg_scroll=Avg('scroll_depth'),
        avg_clicks=Avg('clicks_count')
    )
    
    patterns['avg_time_on_page'] = aggregates['avg_time'] or 0
    patterns['avg_scroll_depth'] = aggregates['avg_scroll'] or 0
    patterns['avg_clicks'] = aggregates['avg_clicks'] or 0
    
    # Count form submissions
    patterns['form_submissions'] = TrackingEvent.objects.filter(
        case=case,
        event_type='form_submit'
    ).count()
    
    return patterns


def build_export_data(case, include_suspicious, date_from, date_to):
    """Build data for export"""
    data = {
        'case': {
            'id': str(case.id),
            'name': case.name,
            'victim_name': case.victim_name,
        },
        'events': [],
        'sessions': [],
        'suspicious_activities': [],
    }
    
    # Build query filters
    filters = {'case': case}
    if date_from:
        filters['timestamp__gte'] = date_from
    if date_to:
        filters['timestamp__lte'] = date_to
    
    # Get events
    events = TrackingEvent.objects.filter(**filters).order_by('-timestamp')[:1000]
    data['events'] = [{
        'id': str(e.id),
        'timestamp': e.timestamp.isoformat(),
        'type': e.event_type,
        'page': e.page_url,
        'ip': e.ip_address,
        'suspicious': e.is_suspicious,
    } for e in events]
    
    # Get sessions
    session_filters = {'case': case}
    if date_from:
        session_filters['created_at__gte'] = date_from
    if date_to:
        session_filters['created_at__lte'] = date_to
    
    sessions = UserSession.objects.filter(**session_filters).order_by('-created_at')[:1000]
    data['sessions'] = [{
        'id': str(s.id),
        'session_id': s.session_id,
        'created': s.created_at.isoformat(),
        'duration': s.total_duration,
        'page_views': s.page_views,
    } for s in sessions]
    
    # Get suspicious activities if requested
    if include_suspicious:
        sus_filters = {'case': case}
        if date_from:
            sus_filters['created_at__gte'] = date_from
        if date_to:
            sus_filters['created_at__lte'] = date_to
        
        suspicious = SuspiciousActivity.objects.filter(**sus_filters).order_by('-created_at')[:1000]
        data['suspicious_activities'] = [{
            'id': str(a.id),
            'timestamp': a.created_at.isoformat(),
            'type': a.activity_type,
            'severity': a.severity_level,
            'ip': a.ip_address,
        } for a in suspicious]
    
    return data


def convert_to_csv(data):
    """Convert data to CSV format"""
    output = StringIO()
    writer = csv.writer(output)
    
    # Write events
    writer.writerow(['Events'])
    writer.writerow(['ID', 'Timestamp', 'Type', 'Page', 'IP', 'Suspicious'])
    for event in data.get('events', []):
        writer.writerow([
            event['id'],
            event['timestamp'],
            event['type'],
            event['page'],
            event['ip'],
            event['suspicious']
        ])
    
    writer.writerow([])  # Empty row
    
    # Write sessions
    writer.writerow(['Sessions'])
    writer.writerow(['ID', 'Session ID', 'Created', 'Duration', 'Page Views'])
    for session in data.get('sessions', []):
        writer.writerow([
            session['id'],
            session['session_id'],
            session['created'],
            session['duration'],
            session['page_views']
        ])
    
    writer.writerow([])  # Empty row
    
    # Write suspicious activities
    if 'suspicious_activities' in data:
        writer.writerow(['Suspicious Activities'])
        writer.writerow(['ID', 'Timestamp', 'Type', 'Severity', 'IP'])
        for activity in data['suspicious_activities']:
            writer.writerow([
                activity['id'],
                activity['timestamp'],
                activity['type'],
                activity['severity'],
                activity['ip']
            ])
    
    return output.getvalue()