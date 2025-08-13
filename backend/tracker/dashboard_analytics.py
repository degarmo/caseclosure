# dashboard_analytics.py - Dashboard Analytics and Metrics Module
# Location: tracker/dashboard_analytics.py

from django.db.models import Count, Sum, Avg, Q, F, Max, Min
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta
import json
import hashlib
from collections import defaultdict, Counter
import numpy as np
from typing import Dict, List, Any, Optional, Tuple


class DashboardAnalytics:
    """
    Analytics engine for dashboard metrics and insights
    """
    
    def __init__(self, case_id: str):
        self.case_id = case_id
        self.cache_timeout = 300  # 5 minutes
        
    def get_cache_key(self, metric_name: str) -> str:
        """Generate cache key for metrics"""
        return f"analytics_{self.case_id}_{metric_name}"
    
    def get_overview_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive overview statistics for dashboard
        """
        from .models import Case, TrackingEvent, UserSession, SuspiciousActivity, Alert
        
        cache_key = self.get_cache_key('overview_stats')
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        try:
            case = Case.objects.get(id=self.case_id)
        except Case.DoesNotExist:
            return {}
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        stats = {
            # Core Metrics
            'total_visitors': self._get_total_visitors(case),
            'unique_visitors_24h': self._get_unique_visitors(case, last_24h),
            'unique_visitors_7d': self._get_unique_visitors(case, last_7d),
            'unique_visitors_30d': self._get_unique_visitors(case, last_30d),
            
            # Activity Metrics
            'total_events': TrackingEvent.objects.filter(case=case).count(),
            'events_24h': TrackingEvent.objects.filter(case=case, timestamp__gte=last_24h).count(),
            'events_7d': TrackingEvent.objects.filter(case=case, timestamp__gte=last_7d).count(),
            
            # Engagement Metrics
            'avg_session_duration': self._get_avg_session_duration(case),
            'avg_pages_per_session': self._get_avg_pages_per_session(case),
            'bounce_rate': self._calculate_bounce_rate(case),
            'return_visitor_rate': self._calculate_return_visitor_rate(case),
            
            # Suspicious Activity
            'suspicious_users_total': self._get_suspicious_users_count(case),
            'suspicious_events_24h': self._get_suspicious_events(case, last_24h),
            'high_risk_users': self._get_high_risk_users_count(case),
            'critical_alerts': Alert.objects.filter(
                case=case, 
                priority='critical', 
                resolved=False
            ).count(),
            
            # Trends
            'visitor_trend': self._calculate_trend('visitors', case),
            'suspicious_trend': self._calculate_trend('suspicious', case),
            'engagement_trend': self._calculate_trend('engagement', case),
            
            # Geographic Distribution
            'top_countries': self._get_top_countries(case, limit=5),
            'top_cities': self._get_top_cities(case, limit=10),
            
            # Technology Stats
            'device_breakdown': self._get_device_breakdown(case),
            'browser_breakdown': self._get_browser_breakdown(case),
            'os_breakdown': self._get_os_breakdown(case),
            
            # Risk Assessment
            'risk_score': self._calculate_overall_risk_score(case),
            'risk_level': self._get_risk_level(case),
            'risk_factors': self._identify_risk_factors(case),
            
            # Performance Metrics
            'avg_page_load_time': self._get_avg_page_load_time(case),
            'error_rate': self._calculate_error_rate(case),
            
            # Time-based Analysis
            'peak_hours': self._get_peak_hours(case),
            'peak_days': self._get_peak_days(case),
            'unusual_activity_times': self._get_unusual_activity_times(case),
            
            # Updated timestamp
            'last_updated': now.isoformat(),
            'data_freshness': 'live'  # or 'cached'
        }
        
        # Cache the results
        cache.set(cache_key, stats, self.cache_timeout)
        
        return stats
    
    def _get_total_visitors(self, case) -> int:
        """Get total unique visitors"""
        from .models import UserSession
        return UserSession.objects.filter(case=case).distinct('fingerprint_hash').count()
    
    def _get_unique_visitors(self, case, since: datetime) -> int:
        """Get unique visitors since a specific time"""
        from .models import UserSession
        return UserSession.objects.filter(
            case=case,
            created_at__gte=since
        ).distinct('fingerprint_hash').count()
    
    def _get_avg_session_duration(self, case) -> float:
        """Calculate average session duration in seconds"""
        from .models import UserSession
        result = UserSession.objects.filter(case=case).aggregate(
            avg_duration=Avg('total_duration')
        )
        return round(result['avg_duration'] or 0, 2)
    
    def _get_avg_pages_per_session(self, case) -> float:
        """Calculate average pages viewed per session"""
        from .models import UserSession
        result = UserSession.objects.filter(case=case).aggregate(
            avg_pages=Avg('page_views')
        )
        return round(result['avg_pages'] or 0, 2)
    
    def _calculate_bounce_rate(self, case) -> float:
        """Calculate bounce rate (single page sessions)"""
        from .models import UserSession
        total_sessions = UserSession.objects.filter(case=case).count()
        if total_sessions == 0:
            return 0.0
        
        single_page_sessions = UserSession.objects.filter(
            case=case,
            page_views=1
        ).count()
        
        return round((single_page_sessions / total_sessions) * 100, 2)
    
    def _calculate_return_visitor_rate(self, case) -> float:
        """Calculate percentage of return visitors"""
        from .models import UserSession
        
        # Get visitors with more than one session
        visitor_sessions = UserSession.objects.filter(case=case).values(
            'fingerprint_hash'
        ).annotate(
            session_count=Count('id')
        )
        
        total_visitors = visitor_sessions.count()
        if total_visitors == 0:
            return 0.0
        
        return_visitors = visitor_sessions.filter(session_count__gt=1).count()
        
        return round((return_visitors / total_visitors) * 100, 2)
    
    def _get_suspicious_users_count(self, case) -> int:
        """Get count of unique suspicious users"""
        from .models import SuspiciousActivity
        return SuspiciousActivity.objects.filter(
            case=case
        ).distinct('fingerprint_hash').count()
    
    def _get_suspicious_events(self, case, since: datetime) -> int:
        """Get count of suspicious events since a specific time"""
        from .models import TrackingEvent
        return TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=since,
            is_suspicious=True
        ).count()
    
    def _get_high_risk_users_count(self, case) -> int:
        """Get count of high risk users (severity >= 4)"""
        from .models import SuspiciousActivity
        return SuspiciousActivity.objects.filter(
            case=case,
            severity_level__gte=4
        ).distinct('fingerprint_hash').count()
    
    def _calculate_trend(self, metric_type: str, case) -> Dict[str, Any]:
        """Calculate trend for a specific metric"""
        from .models import UserSession, TrackingEvent, SuspiciousActivity
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        last_week_start = today_start - timedelta(days=7)
        
        if metric_type == 'visitors':
            today_count = UserSession.objects.filter(
                case=case,
                created_at__gte=today_start
            ).distinct('fingerprint_hash').count()
            
            yesterday_count = UserSession.objects.filter(
                case=case,
                created_at__gte=yesterday_start,
                created_at__lt=today_start
            ).distinct('fingerprint_hash').count()
            
            # Daily counts for last 7 days
            daily_counts = []
            for i in range(7):
                day_start = today_start - timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                count = UserSession.objects.filter(
                    case=case,
                    created_at__gte=day_start,
                    created_at__lt=day_end
                ).distinct('fingerprint_hash').count()
                daily_counts.append(count)
            
        elif metric_type == 'suspicious':
            today_count = SuspiciousActivity.objects.filter(
                case=case,
                created_at__gte=today_start
            ).count()
            
            yesterday_count = SuspiciousActivity.objects.filter(
                case=case,
                created_at__gte=yesterday_start,
                created_at__lt=today_start
            ).count()
            
            # Daily counts for last 7 days
            daily_counts = []
            for i in range(7):
                day_start = today_start - timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                count = SuspiciousActivity.objects.filter(
                    case=case,
                    created_at__gte=day_start,
                    created_at__lt=day_end
                ).count()
                daily_counts.append(count)
            
        else:  # engagement
            today_count = TrackingEvent.objects.filter(
                case=case,
                timestamp__gte=today_start,
                event_type__in=['click', 'form_submit', 'download']
            ).count()
            
            yesterday_count = TrackingEvent.objects.filter(
                case=case,
                timestamp__gte=yesterday_start,
                timestamp__lt=today_start,
                event_type__in=['click', 'form_submit', 'download']
            ).count()
            
            daily_counts = []
            for i in range(7):
                day_start = today_start - timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                count = TrackingEvent.objects.filter(
                    case=case,
                    timestamp__gte=day_start,
                    timestamp__lt=day_end,
                    event_type__in=['click', 'form_submit', 'download']
                ).count()
                daily_counts.append(count)
        
        # Calculate percentage change
        if yesterday_count > 0:
            change_percentage = ((today_count - yesterday_count) / yesterday_count) * 100
        else:
            change_percentage = 100 if today_count > 0 else 0
        
        # Calculate 7-day average
        avg_7d = sum(daily_counts) / 7 if daily_counts else 0
        
        # Determine trend direction
        if len(daily_counts) >= 3:
            recent_avg = sum(daily_counts[:3]) / 3
            older_avg = sum(daily_counts[3:6]) / 3 if len(daily_counts) >= 6 else daily_counts[-1]
            if recent_avg > older_avg * 1.1:
                trend_direction = 'increasing'
            elif recent_avg < older_avg * 0.9:
                trend_direction = 'decreasing'
            else:
                trend_direction = 'stable'
        else:
            trend_direction = 'insufficient_data'
        
        return {
            'current': today_count,
            'previous': yesterday_count,
            'change_percentage': round(change_percentage, 1),
            'change_absolute': today_count - yesterday_count,
            'avg_7d': round(avg_7d, 1),
            'daily_counts': daily_counts,
            'trend_direction': trend_direction,
            'spark_data': daily_counts[::-1]  # Reverse for sparkline charts
        }
    
    def _get_top_countries(self, case, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top countries by visitor count"""
        from .models import TrackingEvent
        
        countries = TrackingEvent.objects.filter(
            case=case,
            ip_country__isnull=False
        ).values('ip_country').annotate(
            visitor_count=Count('fingerprint_hash', distinct=True),
            event_count=Count('id'),
            suspicious_count=Count(
                'id',
                filter=Q(is_suspicious=True)
            )
        ).order_by('-visitor_count')[:limit]
        
        result = []
        for country in countries:
            result.append({
                'country': country['ip_country'],
                'visitors': country['visitor_count'],
                'events': country['event_count'],
                'suspicious': country['suspicious_count'],
                'risk_level': 'high' if country['suspicious_count'] > 10 else 'medium' if country['suspicious_count'] > 0 else 'low'
            })
        
        return result
    
    def _get_top_cities(self, case, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top cities by visitor count"""
        from .models import TrackingEvent
        
        cities = TrackingEvent.objects.filter(
            case=case,
            ip_city__isnull=False
        ).values('ip_city', 'ip_country').annotate(
            visitor_count=Count('fingerprint_hash', distinct=True),
            event_count=Count('id')
        ).order_by('-visitor_count')[:limit]
        
        result = []
        for city in cities:
            result.append({
                'city': city['ip_city'],
                'country': city['ip_country'],
                'visitors': city['visitor_count'],
                'events': city['event_count']
            })
        
        return result
    
    def _get_device_breakdown(self, case) -> Dict[str, Any]:
        """Get device type breakdown"""
        from .models import UserSession
        
        total = UserSession.objects.filter(case=case).count()
        if total == 0:
            return {'desktop': 0, 'mobile': 0, 'tablet': 0, 'other': 0}
        
        breakdown = UserSession.objects.filter(case=case).values(
            'device_type'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        result = {}
        for item in breakdown:
            device_type = item['device_type'] or 'other'
            percentage = round((item['count'] / total) * 100, 1)
            result[device_type] = {
                'count': item['count'],
                'percentage': percentage
            }
        
        return result
    
    def _get_browser_breakdown(self, case) -> Dict[str, Any]:
        """Get browser breakdown"""
        from .models import UserSession
        
        total = UserSession.objects.filter(case=case).count()
        if total == 0:
            return {}
        
        breakdown = UserSession.objects.filter(case=case).values(
            'browser'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        result = {}
        for item in breakdown:
            browser = item['browser'] or 'unknown'
            percentage = round((item['count'] / total) * 100, 1)
            result[browser] = {
                'count': item['count'],
                'percentage': percentage
            }
        
        return result
    
    def _get_os_breakdown(self, case) -> Dict[str, Any]:
        """Get operating system breakdown"""
        from .models import UserSession
        
        total = UserSession.objects.filter(case=case).count()
        if total == 0:
            return {}
        
        breakdown = UserSession.objects.filter(case=case).values(
            'os'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        result = {}
        for item in breakdown:
            os = item['os'] or 'unknown'
            percentage = round((item['count'] / total) * 100, 1)
            result[os] = {
                'count': item['count'],
                'percentage': percentage
            }
        
        return result
    
    def _calculate_overall_risk_score(self, case) -> float:
        """Calculate overall risk score for the case (0-100)"""
        from .models import SuspiciousActivity, TrackingEvent
        
        risk_score = 0.0
        max_score = 100.0
        
        # Factor 1: Suspicious activity count (max 30 points)
        suspicious_count = SuspiciousActivity.objects.filter(case=case).count()
        if suspicious_count > 0:
            risk_score += min(30, suspicious_count * 2)
        
        # Factor 2: High severity activities (max 25 points)
        high_severity = SuspiciousActivity.objects.filter(
            case=case,
            severity_level__gte=4
        ).count()
        if high_severity > 0:
            risk_score += min(25, high_severity * 5)
        
        # Factor 3: Critical severity activities (max 20 points)
        critical_severity = SuspiciousActivity.objects.filter(
            case=case,
            severity_level=5
        ).count()
        if critical_severity > 0:
            risk_score += min(20, critical_severity * 10)
        
        # Factor 4: VPN/Proxy usage (max 10 points)
        vpn_usage = TrackingEvent.objects.filter(
            case=case,
            is_vpn=True
        ).distinct('fingerprint_hash').count()
        if vpn_usage > 0:
            risk_score += min(10, vpn_usage * 2)
        
        # Factor 5: Unusual hour activity (max 10 points)
        unusual_hour = TrackingEvent.objects.filter(
            case=case,
            is_unusual_hour=True
        ).distinct('fingerprint_hash').count()
        if unusual_hour > 0:
            risk_score += min(10, unusual_hour)
        
        # Factor 6: Data scraping patterns (max 5 points)
        scraping_patterns = SuspiciousActivity.objects.filter(
            case=case,
            activity_type='data_scraping'
        ).count()
        if scraping_patterns > 0:
            risk_score += min(5, scraping_patterns)
        
        return min(risk_score, max_score)
    
    def _get_risk_level(self, case) -> str:
        """Get risk level based on risk score"""
        risk_score = self._calculate_overall_risk_score(case)
        
        if risk_score >= 75:
            return 'CRITICAL'
        elif risk_score >= 50:
            return 'HIGH'
        elif risk_score >= 30:
            return 'MEDIUM'
        elif risk_score >= 15:
            return 'LOW'
        else:
            return 'MINIMAL'
    
    def _identify_risk_factors(self, case) -> List[Dict[str, Any]]:
        """Identify and list risk factors"""
        from .models import SuspiciousActivity, TrackingEvent, Alert
        
        risk_factors = []
        
        # Check for critical alerts
        critical_alerts = Alert.objects.filter(
            case=case,
            priority='critical',
            resolved=False
        ).count()
        if critical_alerts > 0:
            risk_factors.append({
                'factor': 'Critical Alerts',
                'severity': 'critical',
                'count': critical_alerts,
                'description': f'{critical_alerts} unresolved critical alerts'
            })
        
        # Check for high severity suspicious activities
        high_severity = SuspiciousActivity.objects.filter(
            case=case,
            severity_level__gte=4
        ).count()
        if high_severity > 0:
            risk_factors.append({
                'factor': 'High Severity Activities',
                'severity': 'high',
                'count': high_severity,
                'description': f'{high_severity} high severity suspicious activities detected'
            })
        
        # Check for VPN/Proxy usage
        vpn_users = TrackingEvent.objects.filter(
            case=case,
            is_vpn=True
        ).distinct('fingerprint_hash').count()
        if vpn_users > 0:
            risk_factors.append({
                'factor': 'VPN/Proxy Usage',
                'severity': 'medium',
                'count': vpn_users,
                'description': f'{vpn_users} users detected using VPN or proxy'
            })
        
        # Check for unusual hour activity
        unusual_hour_users = TrackingEvent.objects.filter(
            case=case,
            is_unusual_hour=True
        ).distinct('fingerprint_hash').count()
        if unusual_hour_users > 5:
            risk_factors.append({
                'factor': 'Unusual Hour Activity',
                'severity': 'low',
                'count': unusual_hour_users,
                'description': f'{unusual_hour_users} users active during unusual hours'
            })
        
        # Check for rapid visits
        rapid_visits = SuspiciousActivity.objects.filter(
            case=case,
            activity_type='rapid_visits'
        ).count()
        if rapid_visits > 0:
            risk_factors.append({
                'factor': 'Rapid Visit Patterns',
                'severity': 'medium',
                'count': rapid_visits,
                'description': 'Automated or bot-like visit patterns detected'
            })
        
        # Check for data scraping
        scraping = SuspiciousActivity.objects.filter(
            case=case,
            activity_type='data_scraping'
        ).count()
        if scraping > 0:
            risk_factors.append({
                'factor': 'Data Scraping',
                'severity': 'high',
                'count': scraping,
                'description': 'Potential data scraping attempts detected'
            })
        
        # Sort by severity
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        risk_factors.sort(key=lambda x: severity_order.get(x['severity'], 4))
        
        return risk_factors
    
    def _get_avg_page_load_time(self, case) -> float:
        """Get average page load time (mock for now)"""
        # This would typically come from performance monitoring
        return 2.3  # seconds
    
    def _calculate_error_rate(self, case) -> float:
        """Calculate error rate (mock for now)"""
        # This would typically come from error tracking
        return 0.5  # percentage
    
    def _get_peak_hours(self, case) -> List[Dict[str, Any]]:
        """Get peak activity hours"""
        from .models import TrackingEvent
        
        # Get hourly distribution for last 7 days
        last_7d = timezone.now() - timedelta(days=7)
        
        hourly_counts = defaultdict(int)
        events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=last_7d
        ).values('timestamp')
        
        for event in events:
            hour = event['timestamp'].hour
            hourly_counts[hour] += 1
        
        # Sort by count and get top 5
        sorted_hours = sorted(hourly_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        result = []
        for hour, count in sorted_hours:
            result.append({
                'hour': hour,
                'hour_label': f'{hour:02d}:00',
                'event_count': count,
                'percentage': round((count / sum(hourly_counts.values())) * 100, 1) if hourly_counts else 0
            })
        
        return result
    
    def _get_peak_days(self, case) -> List[Dict[str, Any]]:
        """Get peak activity days of week"""
        from .models import TrackingEvent
        
        # Get daily distribution for last 30 days
        last_30d = timezone.now() - timedelta(days=30)
        
        daily_counts = defaultdict(int)
        events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=last_30d
        ).values('timestamp')
        
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for event in events:
            day = event['timestamp'].weekday()
            daily_counts[day] += 1
        
        result = []
        for day_num in range(7):
            count = daily_counts.get(day_num, 0)
            result.append({
                'day': days_of_week[day_num],
                'day_num': day_num,
                'event_count': count,
                'percentage': round((count / sum(daily_counts.values())) * 100, 1) if daily_counts else 0
            })
        
        # Sort by count
        result.sort(key=lambda x: x['event_count'], reverse=True)
        
        return result
    
    def _get_unusual_activity_times(self, case) -> List[Dict[str, Any]]:
        """Get times with unusual activity patterns"""
        from .models import TrackingEvent
        
        unusual_events = TrackingEvent.objects.filter(
            case=case,
            is_unusual_hour=True
        ).values('timestamp', 'fingerprint_hash')[:20]
        
        result = []
        for event in unusual_events:
            result.append({
                'timestamp': event['timestamp'].isoformat(),
                'hour': event['timestamp'].hour,
                'user': event['fingerprint_hash'][:8] + '...',
                'day_of_week': event['timestamp'].strftime('%A')
            })
        
        return result
    
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics for live dashboard updates"""
        from .models import TrackingEvent, UserSession, Alert
        
        now = timezone.now()
        last_5min = now - timedelta(minutes=5)
        last_1min = now - timedelta(minutes=1)
        
        try:
            case = Case.objects.get(id=self.case_id)
        except:
            return {}
        
        return {
            'active_users_now': UserSession.objects.filter(
                case=case,
                last_activity__gte=last_5min
            ).count(),
            
            'events_last_minute': TrackingEvent.objects.filter(
                case=case,
                timestamp__gte=last_1min
            ).count(),
            
            'events_last_5min': TrackingEvent.objects.filter(
                case=case,
                timestamp__gte=last_5min
            ).count(),
            
            'new_alerts': Alert.objects.filter(
                case=case,
                created_at__gte=last_5min,
                resolved=False
            ).count(),
            
            'timestamp': now.isoformat()
        }
    
    def get_visitor_flow_analysis(self) -> Dict[str, Any]:
        """Analyze visitor navigation flow patterns"""
        from .models import TrackingEvent
        
        try:
            case = Case.objects.get(id=self.case_id)
        except:
            return {}
        
        # Get page transitions
        sessions_flow = defaultdict(list)
        events = TrackingEvent.objects.filter(
            case=case,
            event_type='page_view'
        ).order_by('session_identifier', 'timestamp').values(
            'session_identifier', 'page_url', 'timestamp'
        )
        
        for event in events:
            sessions_flow[event['session_identifier']].append(event['page_url'])
        
        # Analyze common paths
        path_counter = Counter()
        for session_pages in sessions_flow.values():
            for i in range(len(session_pages) - 1):
                path = f"{session_pages[i]} -> {session_pages[i+1]}"
                path_counter[path] += 1
        
        # Get top paths
        top_paths = []
        for path, count in path_counter.most_common(10):
            pages = path.split(' -> ')
            top_paths.append({
                'from': pages[0],
                'to': pages[1],
                'count': count
            })
        
        # Entry and exit pages
        entry_pages = Counter()
        exit_pages = Counter()
        
        for pages in sessions_flow.values():
            if pages:
                entry_pages[pages[0]] += 1
                exit_pages[pages[-1]] += 1
        
        return {
            'top_paths': top_paths,
            'top_entry_pages': [
                {'page': page, 'count': count} 
                for page, count in entry_pages.most_common(5)
            ],
            'top_exit_pages': [
                {'page': page, 'count': count} 
                for page, count in exit_pages.most_common(5)
            ],
            'avg_pages_per_path': round(
                sum(len(pages) for pages in sessions_flow.values()) / len(sessions_flow) 
                if sessions_flow else 0, 2
            )
        }