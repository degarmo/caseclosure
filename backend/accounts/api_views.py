# accounts/api_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .dashboard import DashboardConfig
from .models import CustomUser, AccountRequest
from cases.models import Case
from spotlight.models import SpotlightPost
from tracker.models import TrackingEvent, SuspiciousActivity, Alert

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_config(request):
    """Get user's dashboard configuration"""
    config = DashboardConfig(request.user)
    return Response(config.get_config())

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    config = DashboardConfig(request.user)
    
    # Get base stats
    stats = config.get_stats()
    
    # Add live counts for admins
    if config.get_role() in ['super_admin', 'admin']:
        stats['liveUsers'] = TrackingEvent.objects.filter(
            timestamp__gte=timezone.now() - timedelta(minutes=5)
        ).values('session_identifier').distinct().count()
        
        # Today's metrics
        today = timezone.now().date()
        stats['todayEvents'] = TrackingEvent.objects.filter(
            timestamp__date=today
        ).count()
        
        # Alerts count
        stats['unresolvedAlerts'] = Alert.objects.filter(
            acknowledged=False
        ).count()
        
        # Recent suspicious activity
        stats['suspiciousToday'] = SuspiciousActivity.objects.filter(
            created_at__date=today,
            reviewed=False
        ).count()
    
    # Stats for case owners
    elif config.get_role() in ['case_owner', 'family']:
        user_cases = Case.objects.filter(user=request.user)
        case_ids = user_cases.values_list('id', flat=True)
        
        # Views today
        today = timezone.now().date()
        stats['todayViews'] = TrackingEvent.objects.filter(
            case__in=case_ids,
            event_type='page_view',
            timestamp__date=today
        ).count()
        
        # Week comparison
        week_ago = timezone.now() - timedelta(days=7)
        stats['weeklyViews'] = TrackingEvent.objects.filter(
            case__in=case_ids,
            event_type='page_view',
            timestamp__gte=week_ago
        ).count()
        
        # Engagement metrics
        stats['totalEngagement'] = TrackingEvent.objects.filter(
            case__in=case_ids,
            event_type__in=['comment', 'like', 'share', 'tip_submit']
        ).count()
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_data(request, module_name):
    """Get data for a specific module"""
    config = DashboardConfig(request.user)
    
    # Check access
    if module_name not in config.get_modules():
        return Response({'error': 'Access denied'}, status=403)
    
    # Get pagination params
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    search = request.GET.get('search', '')
    
    data = {}
    permissions = config.get_permissions()
    
    if module_name == 'overview':
        # Overview combines stats with recent activity
        data = config.get_stats()
        
        # Add recent activity
        if permissions['canViewAllCases']:
            recent_events = TrackingEvent.objects.all()[:10]
        else:
            user_cases = Case.objects.filter(user=request.user)
            recent_events = TrackingEvent.objects.filter(
                case__in=user_cases
            )[:10]
        
        data['recentActivity'] = [
            {
                'id': str(event.id),
                'type': event.event_type,
                'description': f"{event.event_type.replace('_', ' ').title()} on {event.page_url}",
                'timestamp': event.timestamp.isoformat(),
            }
            for event in recent_events
        ]
        
        # Add quick stats
        data['quickStats'] = {
            'casesNeedingAttention': Case.objects.filter(
                user=request.user if not permissions['canViewAllCases'] else None,
                is_public=False
            ).count() if not permissions['canViewAllCases'] else Case.objects.filter(is_public=False).count(),
        }
    
    elif module_name == 'cases':
        # Get cases with search
        if permissions['canViewAllCases']:
            cases_query = Case.objects.all()
        else:
            cases_query = Case.objects.filter(user=request.user)
        
        # Apply search
        if search:
            cases_query = cases_query.filter(
                Q(case_title__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(case_number__icontains=search)
            )
        
        # Get total count before pagination
        total_count = cases_query.count()
        
        # Paginate
        start = (page - 1) * per_page
        end = start + per_page
        cases = cases_query.select_related('user')[start:end]
        
        data['cases'] = [
            {
                'id': str(case.id),
                'title': case.case_title,
                'victim_name': case.get_display_name(),
                'case_type': case.case_type,
                'case_number': case.case_number,
                'is_public': case.is_public,
                'is_disabled': case.is_disabled,
                'deployment_status': case.deployment_status,
                'created_at': case.created_at.isoformat() if case.created_at else None,
                'updated_at': case.updated_at.isoformat() if case.updated_at else None,
                'subdomain': case.subdomain,
                'custom_domain': case.custom_domain,
                'deployment_url': case.get_full_url(),
                'owner': {
                    'id': case.user.id,
                    'name': f"{case.user.first_name} {case.user.last_name}",
                    'email': case.user.email,
                } if permissions['canViewAllCases'] else None,
                'stats': {
                    'views': TrackingEvent.objects.filter(
                        case=case,
                        event_type='page_view'
                    ).count(),
                    'tips': 0,  # Add if you have tips model
                }
            }
            for case in cases
        ]
        
        data['pagination'] = {
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page,
        }
    
    elif module_name == 'spotlight':
        # Get spotlight posts
        if permissions['canViewAllCases']:
            posts_query = SpotlightPost.objects.all()
        else:
            posts_query = SpotlightPost.objects.filter(author=request.user)
        
        # Apply search
        if search:
            posts_query = posts_query.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        
        # Paginate
        total_count = posts_query.count()
        start = (page - 1) * per_page
        end = start + per_page
        posts = posts_query.select_related('author')[start:end]
        
        data['posts'] = [
            {
                'id': str(post.id),
                'title': post.title,
                'excerpt': post.content[:200] + '...' if len(post.content) > 200 else post.content,
                'status': post.status,
                'created_at': post.created_at.isoformat() if post.created_at else None,
                'published_at': post.published_at.isoformat() if post.published_at else None,
                'scheduled_for': post.scheduled_for.isoformat() if post.scheduled_for else None,
                'views_count': post.views_count,
                'likes_count': post.likes_count,
                'comments_count': post.comments_count,
                'author': {
                    'id': post.author.id,
                    'name': f"{post.author.first_name} {post.author.last_name}",
                },
            }
            for post in posts
        ]
        
        data['pagination'] = {
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page,
        }
    
    elif module_name == 'users':
        # Admin only - get users
        if not permissions['canManageUsers']:
            return Response({'error': 'Access denied'}, status=403)
        
        users_query = CustomUser.objects.all()
        
        # Apply search
        if search:
            users_query = users_query.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Paginate
        total_count = users_query.count()
        start = (page - 1) * per_page
        end = start + per_page
        users = users_query[start:end]
        
        data['users'] = [
            {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'account_type': user.account_type,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'cases_count': Case.objects.filter(user=user).count(),
            }
            for user in users
        ]
        
        # Add pending requests
        data['pendingRequests'] = AccountRequest.objects.filter(
            status='pending'
        ).count()
        
        data['pagination'] = {
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page,
        }
    
    elif module_name == 'tracking':
        # Get tracking data
        if permissions['canViewTracking']:
            if permissions['canViewAllCases']:
                events_query = TrackingEvent.objects.all()
                suspicious_query = SuspiciousActivity.objects.all()
            else:
                user_cases = Case.objects.filter(user=request.user)
                case_ids = user_cases.values_list('id', flat=True)
                events_query = TrackingEvent.objects.filter(case__in=case_ids)
                suspicious_query = SuspiciousActivity.objects.filter(case__in=case_ids)
            
            # Get recent events
            recent_events = events_query.order_by('-timestamp')[:50]
            
            data['recentEvents'] = [
                {
                    'id': str(event.id),
                    'event_type': event.event_type,
                    'page_url': event.page_url,
                    'ip_address': event.ip_address,
                    'browser': event.browser,
                    'os': event.os,
                    'timestamp': event.timestamp.isoformat(),
                    'is_suspicious': event.is_suspicious,
                    'case_id': str(event.case.id) if event.case else None,
                    'case_name': event.case.case_title if event.case else None,
                }
                for event in recent_events
            ]
            
            # Suspicious activity summary
            data['suspiciousActivity'] = {
                'total': suspicious_query.count(),
                'unreviewed': suspicious_query.filter(reviewed=False).count(),
                'highSeverity': suspicious_query.filter(
                    severity_level__gte=3,
                    reviewed=False
                ).count(),
            }
            
            # Active sessions
            data['activeSessions'] = TrackingEvent.objects.filter(
                timestamp__gte=timezone.now() - timedelta(minutes=30)
            ).values('session_identifier').distinct().count()
    
    elif module_name == 'analytics':
        # Analytics data
        if not permissions['canViewAnalytics']:
            return Response({'error': 'Access denied'}, status=403)
        
        # Time range
        days = int(request.GET.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        if permissions['canViewAllCases']:
            cases_filter = {}
        else:
            user_cases = Case.objects.filter(user=request.user)
            cases_filter = {'case__in': user_cases}
        
        # Daily views
        daily_stats = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            count = TrackingEvent.objects.filter(
                **cases_filter,
                timestamp__date=date.date(),
                event_type='page_view'
            ).count()
            daily_stats.append({
                'date': date.date().isoformat(),
                'views': count,
            })
        
        data['dailyStats'] = daily_stats
        
        # Top pages
        top_pages = TrackingEvent.objects.filter(
            **cases_filter,
            timestamp__gte=start_date
        ).values('page_url').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        data['topPages'] = list(top_pages)
        
        # Browser stats
        browser_stats = TrackingEvent.objects.filter(
            **cases_filter,
            timestamp__gte=start_date
        ).values('browser').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        data['browserStats'] = list(browser_stats)
    
    elif module_name == 'tips':
        # Tips module (placeholder - add your tips model logic)
        data['tips'] = []
        data['message'] = 'Tips module data would go here'
    
    elif module_name == 'system':
        # System settings (super admin only)
        if config.get_role() != 'super_admin':
            return Response({'error': 'Access denied'}, status=403)
        
        data['system'] = {
            'totalCases': Case.objects.count(),
            'totalUsers': CustomUser.objects.count(),
            'totalEvents': TrackingEvent.objects.count(),
            'diskUsage': 'N/A',  # Add actual disk usage if needed
            'version': '1.0.0',
        }
    
    return Response(data)