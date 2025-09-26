# dashboard/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from cases.models import Case
from accounts.models import AccountRequest

# Try to import models that might not exist yet
try:
    from tracking.models import VisitorLog, TipMessage
    TRACKING_ENABLED = True
except ImportError:
    try:
        from cases.models import VisitorLog, TipMessage
        TRACKING_ENABLED = True
    except ImportError:
        TRACKING_ENABLED = False
        # Create dummy classes so the code doesn't break
        class VisitorLog:
            objects = type('objects', (), {
                'filter': lambda *args, **kwargs: type('QuerySet', (), {
                    'count': lambda: 0,
                    'values': lambda *args: type('QuerySet', (), {
                        'distinct': lambda: type('QuerySet', (), {'count': lambda: 0})(),
                        'annotate': lambda **kwargs: []
                    })(),
                    'order_by': lambda *args: [],
                    'aggregate': lambda **kwargs: {}
                })(),
                'none': lambda: []
            })()
        
        class TipMessage:
            objects = type('objects', (), {
                'filter': lambda *args, **kwargs: type('QuerySet', (), {
                    'count': lambda: 0,
                    'order_by': lambda *args: []
                })(),
                'none': lambda: []
            })()

User = get_user_model()

class DashboardStatsView(APIView):
    """
    Get dashboard statistics for the current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get time range
        days = int(request.GET.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get user's cases
        if user.is_staff:
            cases = Case.objects.all()
        else:
            cases = Case.objects.filter(user=user)
        
        # Calculate stats
        total_visitors = 0
        total_fingerprints = 0
        suspicious_count = 0
        tips_count = 0
        active_now = 0
        engagement = 0
        
        if TRACKING_ENABLED:
            # Only try to get visitor data if tracking models exist
            for case in cases:
                visitors = VisitorLog.objects.filter(
                    case=case,
                    created_at__gte=start_date
                )
                total_visitors += visitors.count()
                total_fingerprints += visitors.values('fingerprint').distinct().count()
                suspicious_count += visitors.filter(suspicious_score__gte=0.7).count()
            
            # Get tips count
            tips_count = TipMessage.objects.filter(
                case__in=cases,
                created_at__gte=start_date,
                is_read=False
            ).count()
            
            # Active users (those who visited in last hour)
            active_now = VisitorLog.objects.filter(
                case__in=cases,
                created_at__gte=timezone.now() - timedelta(hours=1)
            ).values('fingerprint').distinct().count()
            
            # Engagement rate (example calculation)
            if total_visitors > 0:
                engaged_visitors = VisitorLog.objects.filter(
                    case__in=cases,
                    created_at__gte=start_date,
                    time_on_site__gte=30  # 30+ seconds
                ).count()
                engagement = int((engaged_visitors / total_visitors) * 100)
        else:
            # Return zeros instead of random mock data
            total_visitors = 0
            total_fingerprints = 0
            tips_count = 0
            engagement = 0
            suspicious_count = 0
            active_now = 0
        
        return Response({
            'visitors': total_visitors,
            'fingerprints': total_fingerprints,
            'tips': tips_count,
            'engagement': engagement,
            'suspicious': suspicious_count,
            'activeNow': active_now,
        })


class AdminUsersListView(APIView):
    """
    Admin endpoint to get all users with details
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        users = User.objects.all().select_related('profile').prefetch_related('case_set')
        
        user_data = []
        for user in users:
            user_data.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'cases_count': user.case_set.count() if hasattr(user, 'case_set') else 0,
                'verified': getattr(user.profile, 'verified', False) if hasattr(user, 'profile') else False,
                'phone': getattr(user.profile, 'phone', '') if hasattr(user, 'profile') else '',
                'account_type': getattr(user.profile, 'account_type', 'basic') if hasattr(user, 'profile') else 'basic',
            })
        
        return Response(user_data)


class ActivityFeedView(APIView):
    """
    Get recent activity for user's cases
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        limit = int(request.GET.get('limit', 20))
        
        activities = []
        
        if TRACKING_ENABLED:
            # Get user's cases
            if user.is_staff:
                cases = Case.objects.all()
            else:
                cases = Case.objects.filter(user=user)
            
            # Get recent visitor logs
            visitor_logs = VisitorLog.objects.filter(
                case__in=cases
            ).order_by('-created_at')[:limit]
            
            for log in visitor_logs:
                activities.append({
                    'id': str(log.id),
                    'type': 'page_view',
                    'action': f'viewed {log.page_path}',
                    'user': log.fingerprint[:8] if log.fingerprint else 'Anonymous',
                    'page': log.page_path,
                    'location': f"{log.city}, {log.country}" if log.city else log.country,
                    'timestamp': log.created_at,
                    'suspicious_score': log.suspicious_score,
                    'risk': 'high' if log.suspicious_score >= 0.7 else 'medium' if log.suspicious_score >= 0.4 else 'low'
                })
        else:
            # Return mock data for development
            from datetime import datetime
            activities = [
                {
                    'id': '1',
                    'type': 'page_view',
                    'action': 'viewed case page',
                    'user': 'Visitor1',
                    'page': '/case/123',
                    'location': 'Milwaukee, WI',
                    'timestamp': timezone.now() - timedelta(minutes=5),
                    'suspicious_score': 0.2,
                    'risk': 'low'
                },
                {
                    'id': '2',
                    'type': 'tip_submitted',
                    'action': 'submitted a tip',
                    'user': 'Anonymous',
                    'page': '/tips/submit',
                    'location': 'Chicago, IL',
                    'timestamp': timezone.now() - timedelta(minutes=15),
                    'suspicious_score': 0.1,
                    'risk': 'low'
                }
            ]
        
        return Response(activities)


class RealtimeActivityView(APIView):
    """
    Get real-time activity (last 5 minutes)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        activities = []
        active_users = 0
        
        if TRACKING_ENABLED:
            user = request.user
            
            # Get user's cases
            if user.is_staff:
                cases = Case.objects.all()
            else:
                cases = Case.objects.filter(user=user)
            
            # Get activity from last 5 minutes
            recent_time = timezone.now() - timedelta(minutes=5)
            
            recent_visitors = VisitorLog.objects.filter(
                case__in=cases,
                created_at__gte=recent_time
            ).order_by('-created_at')
            
            for log in recent_visitors[:10]:
                activities.append({
                    'id': str(log.id),
                    'type': 'realtime',
                    'description': f"Visitor from {log.city or 'Unknown'} viewing {log.page_path}",
                    'time': log.created_at,
                    'location': log.city,
                    'risk': log.suspicious_score
                })
            
            # Count unique active users
            active_users = recent_visitors.values('fingerprint').distinct().count()
        else:
            # Return mock data for development
            import random
            active_users = random.randint(0, 10)
            if active_users > 0:
                activities = [
                    {
                        'id': '1',
                        'type': 'realtime',
                        'description': 'Visitor from Milwaukee viewing case page',
                        'time': timezone.now() - timedelta(minutes=1),
                        'location': 'Milwaukee',
                        'risk': 0.1
                    }
                ]
        
        return Response({
            'results': activities,
            'active_users': active_users
        })


class LocationAnalyticsView(APIView):
    """
    Get visitor locations analytics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        location_data = []
        
        if TRACKING_ENABLED:
            user = request.user
            days = int(request.GET.get('days', 7))
            start_date = timezone.now() - timedelta(days=days)
            
            # Get user's cases
            if user.is_staff:
                cases = Case.objects.all()
            else:
                cases = Case.objects.filter(user=user)
            
            # Aggregate by location
            locations = VisitorLog.objects.filter(
                case__in=cases,
                created_at__gte=start_date
            ).values('city', 'state', 'country').annotate(
                visits=Count('id'),
                unique_visitors=Count('fingerprint', distinct=True)
            ).order_by('-visits')[:10]
            
            for loc in locations:
                # Calculate risk based on suspicious activity from that location
                suspicious = VisitorLog.objects.filter(
                    case__in=cases,
                    city=loc['city'],
                    created_at__gte=start_date,
                    suspicious_score__gte=0.7
                ).count()
                
                risk = 'low'
                if suspicious > 5:
                    risk = 'high'
                elif suspicious > 2:
                    risk = 'medium'
                
                location_data.append({
                    'city': f"{loc['city']}, {loc['state']}" if loc['city'] else loc['country'],
                    'name': loc['city'] or loc['country'],
                    'visits': loc['visits'],
                    'count': loc['visits'],
                    'unique_visitors': loc['unique_visitors'],
                    'risk': risk
                })
        else:
            # Return mock data for development
            location_data = [
                {'city': 'Milwaukee, WI', 'name': 'Milwaukee', 'visits': 89, 'count': 89, 'unique_visitors': 45, 'risk': 'low'},
                {'city': 'Chicago, IL', 'name': 'Chicago', 'visits': 67, 'count': 67, 'unique_visitors': 34, 'risk': 'medium'},
                {'city': 'Madison, WI', 'name': 'Madison', 'visits': 45, 'count': 45, 'unique_visitors': 23, 'risk': 'low'},
            ]
        
        return Response(location_data)


class NotificationsView(APIView):
    """
    Get user notifications
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        notifications = []
        
        if TRACKING_ENABLED:
            user = request.user
            
            # Add unread tips as notifications
            if user.is_staff:
                tips = TipMessage.objects.filter(is_read=False).order_by('-created_at')[:5]
            else:
                tips = TipMessage.objects.filter(
                    case__user=user,
                    is_read=False
                ).order_by('-created_at')[:5]
            
            for tip in tips:
                notifications.append({
                    'id': f'tip_{tip.id}',
                    'type': 'tip',
                    'message': f'New tip for {tip.case.first_name} {tip.case.last_name}',
                    'time': tip.created_at,
                    'created_at': tip.created_at,
                    'read': False,
                    'urgent': tip.is_urgent if hasattr(tip, 'is_urgent') else False
                })
            
            # Add suspicious visitor alerts
            recent_suspicious = VisitorLog.objects.filter(
                case__user=user,
                suspicious_score__gte=0.8,
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).order_by('-created_at')[:3]
            
            for visitor in recent_suspicious:
                notifications.append({
                    'id': f'alert_{visitor.id}',
                    'type': 'alert',
                    'message': f'Suspicious visitor detected on {visitor.case.first_name} {visitor.case.last_name}\'s page',
                    'time': visitor.created_at,
                    'created_at': visitor.created_at,
                    'read': False,
                    'urgent': True
                })
        else:
            # Return empty notifications for development
            pass
        
        # Sort by time if any notifications exist
        if notifications:
            notifications.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response(notifications[:10] if notifications else [])


class MessagesUnreadCountView(APIView):
    """
    Get unread messages/tips count
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        count = 0
        
        if TRACKING_ENABLED:
            user = request.user
            
            if user.is_staff:
                count = TipMessage.objects.filter(is_read=False).count()
            else:
                count = TipMessage.objects.filter(
                    case__user=user,
                    is_read=False
                ).count()
        
        return Response({'count': count})


class AdminAlertsCountView(APIView):
    """
    Get admin alerts count
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Count various alerts
        pending_requests = AccountRequest.objects.filter(status='pending').count()
        
        suspicious_visitors = 0
        if TRACKING_ENABLED:
            suspicious_visitors = VisitorLog.objects.filter(
                suspicious_score__gte=0.9,
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).count()
        
        total_alerts = pending_requests + suspicious_visitors
        
        return Response({'count': total_alerts})


class LastActivityView(APIView):
    """
    Get user's last activity
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # This could track the user's last action
        # For now, return a simple response
        return Response({
            'time': timezone.now(),
            'action': 'Viewed dashboard'
        })