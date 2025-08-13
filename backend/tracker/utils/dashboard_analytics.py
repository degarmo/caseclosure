# dashboard_analytics.py - Dashboard Analytics and Reporting Module

from django.db.models import Count, Avg, F, Q, Sum, Max, Min
from django.utils import timezone
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import json
from collections import defaultdict, Counter

from .models import (
    Case, TrackingEvent, UserSession, SuspiciousActivity,
    DeviceFingerprint, Alert
)


class DashboardAnalytics:
    """
    Main analytics class for generating dashboard data and insights
    """
    
    def __init__(self, case_id: str):
        """Initialize analytics for a specific case"""
        self.case_id = case_id
        try:
            self.case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            self.case = None
    
    def get_overview_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive overview statistics for the dashboard
        """
        if not self.case:
            return {}
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        stats = {
            # Core metrics
            'total_visitors': self.get_unique_visitors(),
            'total_page_views': self.get_total_page_views(),
            'suspicious_users': self.get_suspicious_count(),
            'active_tips': self.get_active_tips_count(),
            'donations_total': self.get_donations_total(),
            
            # Time-based metrics
            'visitors_24h': self.get_unique_visitors(since=last_24h),
            'visitors_7d': self.get_unique_visitors(since=last_7d),
            'visitors_30d': self.get_unique_visitors(since=last_30d),
            
            # Growth metrics
            'visitor_growth_24h': self.calculate_growth_rate(period_hours=24),
            'visitor_growth_7d': self.calculate_growth_rate(period_days=7),
            
            # Engagement metrics
            'avg_session_duration': self.get_avg_session_duration(),
            'avg_pages_per_session': self.get_avg_pages_per_session(),
            'bounce_rate': self.get_bounce_rate(),
            
            # Risk metrics
            'high_risk_users': self.get_high_risk_users_count(),
            'critical_alerts': self.get_critical_alerts_count(),
            'vpn_usage_rate': self.get_vpn_usage_rate(),
            
            # Trends
            'suspicious_activity_trend': self.get_suspicious_trend(),
            'peak_hours': self.get_peak_activity_hours(),
            'geographic_distribution': self.get_geographic_distribution(),
            'device_breakdown': self.get_device_breakdown(),
            'referrer_sources': self.get_top_referrers(),
            
            # Real-time metrics
            'active_users_now': self.get_active_users_count(),
            'latest_activity': self.get_latest_activity_timestamp(),
        }
        
        return stats
    
    def get_unique_visitors(self, since: Optional[datetime] = None) -> int:
        """Get count of unique visitors"""
        query = UserSession.objects.filter(case=self.case)
        if since:
            query = query.filter(created_at__gte=since)
        return query.distinct('fingerprint_hash').count()
    
    def get_total_page_views(self, since: Optional[datetime] = None) -> int:
        """Get total page views"""
        query = TrackingEvent.objects.filter(
            case=self.case,
            event_type='page_view'
        )
        if since:
            query = query.filter(timestamp__gte=since)
        return query.count()
    
    def get_suspicious_count(self) -> int:
        """Get count of suspicious users"""
        return SuspiciousActivity.objects.filter(
            case=self.case
        ).distinct('fingerprint_hash').count()
    
    def get_active_tips_count(self) -> int:
        """Get count of active tips"""
        return TrackingEvent.objects.filter(
            case=self.case,
            event_type='tip_submit',
            timestamp__gte=timezone.now() - timedelta(days=30)
        ).count()
    
    def get_donations_total(self) -> float:
        """Get total donations amount"""
        donations = TrackingEvent.objects.filter(
            case=self.case,
            event_type='donation_complete'
        ).aggregate(
            total=Sum('event_data__amount')
        )
        return donations['total'] or 0.0
    
    def calculate_growth_rate(self, period_hours: int = 0, period_days: int = 0) -> float:
        """Calculate visitor growth rate"""
        if period_days:
            period = timedelta(days=period_days)
        else:
            period = timedelta(hours=period_hours)
        
        now = timezone.now()
        current_period_start = now - period
        previous_period_start = current_period_start - period
        
        current = self.get_unique_visitors(since=current_period_start)
        previous = UserSession.objects.filter(
            case=self.case,
            created_at__gte=previous_period_start,
            created_at__lt=current_period_start
        ).distinct('fingerprint_hash').count()
        
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        
        return ((current - previous) / previous) * 100
    
    def get_avg_session_duration(self) -> float:
        """Get average session duration in seconds"""
        avg_duration = UserSession.objects.filter(
            case=self.case
        ).aggregate(
            avg=Avg('total_duration')
        )
        return avg_duration['avg'] or 0.0
    
    def get_avg_pages_per_session(self) -> float:
        """Get average pages viewed per session"""
        avg_pages = UserSession.objects.filter(
            case=self.case
        ).aggregate(
            avg=Avg('page_views')
        )
        return avg_pages['avg'] or 0.0
    
    def get_bounce_rate(self) -> float:
        """Calculate bounce rate (single page sessions)"""
        total_sessions = UserSession.objects.filter(case=self.case).count()
        if total_sessions == 0:
            return 0.0
        
        bounced = UserSession.objects.filter(
            case=self.case,
            page_views=1
        ).count()
        
        return (bounced / total_sessions) * 100
    
    def get_high_risk_users_count(self) -> int:
        """Get count of high-risk users"""
        return SuspiciousActivity.objects.filter(
            case=self.case,
            severity_level__gte=4
        ).distinct('fingerprint_hash').count()
    
    def get_critical_alerts_count(self) -> int:
        """Get count of critical unresolved alerts"""
        return Alert.objects.filter(
            case=self.case,
            priority='critical',
            resolved=False
        ).count()
    
    def get_vpn_usage_rate(self) -> float:
        """Calculate VPN usage rate"""
        total = UserSession.objects.filter(case=self.case).count()
        if total == 0:
            return 0.0
        
        vpn_users = UserSession.objects.filter(
            case=self.case,
            is_vpn=True
        ).count()
        
        return (vpn_users / total) * 100
    
    def get_active_users_count(self, minutes: int = 5) -> int:
        """Get count of currently active users"""
        since = timezone.now() - timedelta(minutes=minutes)
        return UserSession.objects.filter(
            case=self.case,
            last_activity__gte=since
        ).distinct('fingerprint_hash').count()
    
    def get_latest_activity_timestamp(self) -> Optional[str]:
        """Get timestamp of latest activity"""
        latest = TrackingEvent.objects.filter(
            case=self.case
        ).order_by('-timestamp').first()
        
        if latest:
            return latest.timestamp.isoformat()
        return None
    
    def get_suspicious_trend(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get suspicious activity trend over time"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        trend = []
        current_date = start_date
        
        while current_date <= end_date:
            count = SuspiciousActivity.objects.filter(
                case=self.case,
                created_at__date=current_date
            ).count()
            
            severity_avg = SuspiciousActivity.objects.filter(
                case=self.case,
                created_at__date=current_date
            ).aggregate(avg=Avg('severity_level'))['avg'] or 0
            
            trend.append({
                'date': current_date.isoformat(),
                'count': count,
                'avg_severity': round(severity_avg, 2)
            })
            
            current_date += timedelta(days=1)
        
        return trend
    
    def get_peak_activity_hours(self) -> List[int]:
        """Get activity count by hour of day"""
        hours = [0] * 24
        
        # Get hourly counts
        hourly_data = TrackingEvent.objects.filter(
            case=self.case
        ).extra(
            select={'hour': 'EXTRACT(hour FROM timestamp)'}
        ).values('hour').annotate(
            count=Count('id')
        )
        
        for item in hourly_data:
            hour = int(item['hour'])
            hours[hour] = item['count']
        
        return hours
    
    def get_geographic_distribution(self) -> List[Dict[str, Any]]:
        """Get visitor distribution by location"""
        distribution = TrackingEvent.objects.filter(
            case=self.case
        ).values('ip_country', 'ip_city').annotate(
            visitor_count=Count('fingerprint_hash', distinct=True),
            event_count=Count('id'),
            suspicious_count=Count(
                'fingerprint_hash',
                filter=Q(is_suspicious=True),
                distinct=True
            )
        ).order_by('-visitor_count')[:20]
        
        return [
            {
                'country': item['ip_country'],
                'city': item['ip_city'],
                'visitors': item['visitor_count'],
                'events': item['event_count'],
                'suspicious': item['suspicious_count'],
                'risk_ratio': (item['suspicious_count'] / item['visitor_count'] * 100) 
                              if item['visitor_count'] > 0 else 0
            }
            for item in distribution
        ]
    
    def get_device_breakdown(self) -> Dict[str, Any]:
        """Get breakdown by device type, browser, and OS"""
        breakdown = {
            'device_types': {},
            'browsers': {},
            'operating_systems': {},
            'screen_resolutions': []
        }
        
        # Device types
        devices = UserSession.objects.filter(
            case=self.case
        ).values('device_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        for device in devices:
            if device['device_type']:
                breakdown['device_types'][device['device_type']] = device['count']
        
        # Browsers
        browsers = UserSession.objects.filter(
            case=self.case
        ).values('browser').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        for browser in browsers:
            if browser['browser']:
                breakdown['browsers'][browser['browser']] = browser['count']
        
        # Operating Systems
        os_data = UserSession.objects.filter(
            case=self.case
        ).values('os').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        for os in os_data:
            if os['os']:
                breakdown['operating_systems'][os['os']] = os['count']
        
        # Screen resolutions
        resolutions = TrackingEvent.objects.filter(
            case=self.case,
            screen_width__isnull=False,
            screen_height__isnull=False
        ).values('screen_width', 'screen_height').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        breakdown['screen_resolutions'] = [
            {
                'resolution': f"{r['screen_width']}x{r['screen_height']}",
                'count': r['count']
            }
            for r in resolutions
        ]
        
        return breakdown
    
    def get_top_referrers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top referrer sources"""
        from urllib.parse import urlparse
        
        referrers = TrackingEvent.objects.filter(
            case=self.case
        ).exclude(
            referrer_url=''
        ).values('referrer_url').annotate(
            count=Count('id'),
            unique_visitors=Count('fingerprint_hash', distinct=True)
        ).order_by('-count')[:limit]
        
        processed = []
        for ref in referrers:
            try:
                parsed = urlparse(ref['referrer_url'])
                domain = parsed.netloc or 'direct'
            except:
                domain = 'unknown'
            
            processed.append({
                'domain': domain,
                'full_url': ref['referrer_url'],
                'visits': ref['count'],
                'unique_visitors': ref['unique_visitors']
            })
        
        return processed
    
    def get_suspicious_users_detail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get detailed information about suspicious users"""
        suspicious_users = []
        
        # Get unique suspicious fingerprints
        fingerprints = SuspiciousActivity.objects.filter(
            case=self.case
        ).values('fingerprint_hash').annotate(
            activity_count=Count('id'),
            max_severity=Max('severity_level'),
            avg_confidence=Avg('confidence_score'),
            first_detected=Min('created_at'),
            last_detected=Max('created_at')
        ).order_by('-max_severity', '-activity_count')[:limit]
        
        for fp_data in fingerprints:
            fingerprint = fp_data['fingerprint_hash']
            
            # Get all sessions for this user
            sessions = UserSession.objects.filter(
                case=self.case,
                fingerprint_hash=fingerprint
            ).order_by('-created_at')
            
            if not sessions:
                continue
            
            # Get detailed activities
            activities = SuspiciousActivity.objects.filter(
                case=self.case,
                fingerprint_hash=fingerprint
            ).order_by('-created_at')[:10]
            
            # Get recent events
            recent_events = TrackingEvent.objects.filter(
                case=self.case,
                fingerprint_hash=fingerprint
            ).order_by('-timestamp')[:20]
            
            # Calculate risk metrics
            risk_score = self.calculate_user_risk_score(activities, recent_events, sessions)
            
            # Build user profile
            user_detail = {
                'fingerprint': fingerprint[:16] + '...',
                'fingerprint_full': fingerprint,
                'first_seen': sessions.last().created_at.isoformat(),
                'last_seen': sessions.first().last_activity.isoformat(),
                'first_detected': fp_data['first_detected'].isoformat(),
                'last_detected': fp_data['last_detected'].isoformat(),
                
                # Activity metrics
                'total_sessions': sessions.count(),
                'total_events': recent_events.count(),
                'suspicious_activities': fp_data['activity_count'],
                'max_severity': fp_data['max_severity'],
                'avg_confidence': round(fp_data['avg_confidence'], 2),
                
                # Risk assessment
                'risk_score': round(risk_score, 2),
                'risk_level': self.get_risk_level(risk_score),
                
                # Location data
                'locations': self.get_user_locations(sessions),
                'ip_addresses': list(sessions.values_list('ip_address', flat=True).distinct()),
                'uses_vpn': sessions.filter(is_vpn=True).exists(),
                'vpn_percentage': (sessions.filter(is_vpn=True).count() / sessions.count() * 100),
                
                # Device data
                'devices': self.get_user_devices(sessions),
                
                # Behavioral patterns
                'behavioral_profile': self.build_behavioral_profile(recent_events),
                
                # Detailed activities
                'recent_activities': [
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
                
                # Flags
                'flags': self.get_user_flags(activities, sessions, recent_events)
            }
            
            suspicious_users.append(user_detail)
        
        # Sort by risk score
        suspicious_users.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return suspicious_users
    
    def calculate_user_risk_score(self, activities, events, sessions) -> float:
        """Calculate comprehensive risk score for a user"""
        score = 0.0
        weights = {
            'severity': 0.25,
            'frequency': 0.20,
            'patterns': 0.20,
            'network': 0.15,
            'timing': 0.10,
            'behavior': 0.10
        }
        
        # Severity score
        if activities:
            severity_score = sum(a.severity_level for a in activities) / (len(activities) * 5)
            score += severity_score * weights['severity']
        
        # Frequency score
        if events:
            time_span = (events[0].timestamp - events[len(events)-1].timestamp).total_seconds() / 3600
            if time_span > 0:
                frequency_score = min(len(events) / time_span, 1.0)
                score += frequency_score * weights['frequency']
        
        # Pattern score
        pattern_score = 0
        for activity in activities:
            if activity.activity_type in ['geo_jump', 'data_scraping', 'sql_injection']:
                pattern_score += 0.3
        score += min(pattern_score, 1.0) * weights['patterns']
        
        # Network score (VPN, Tor, proxy usage)
        if sessions:
            vpn_ratio = sessions.filter(is_vpn=True).count() / sessions.count()
            score += vpn_ratio * weights['network']
        
        # Timing score (unusual hours)
        if sessions:
            unusual_ratio = sessions.filter(is_unusual_hour=True).count() / sessions.count()
            score += unusual_ratio * weights['timing']
        
        # Behavioral score
        if events:
            rapid_events = sum(1 for e in events if e.event_type == 'rapid_navigation')
            copy_events = sum(1 for e in events if e.event_type == 'copy')
            behavior_score = min((rapid_events + copy_events) / 20, 1.0)
            score += behavior_score * weights['behavior']
        
        return min(score, 1.0)
    
    def get_risk_level(self, risk_score: float) -> str:
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
    
    def get_user_locations(self, sessions) -> List[Dict[str, Any]]:
        """Get user location history"""
        locations = []
        seen = set()
        
        for session in sessions:
            location_key = f"{session.ip_city}_{session.ip_country}"
            if location_key not in seen and session.ip_city:
                seen.add(location_key)
                locations.append({
                    'city': session.ip_city,
                    'country': session.ip_country,
                    'is_vpn': session.is_vpn
                })
        
        return locations
    
    def get_user_devices(self, sessions) -> List[Dict[str, str]]:
        """Get user device information"""
        devices = []
        seen = set()
        
        for session in sessions:
            device_key = f"{session.device_type}_{session.browser}_{session.os}"
            if device_key not in seen:
                seen.add(device_key)
                devices.append({
                    'type': session.device_type or 'unknown',
                    'browser': session.browser or 'unknown',
                    'os': session.os or 'unknown'
                })
        
        return devices
    
    def build_behavioral_profile(self, events) -> Dict[str, Any]:
        """Build behavioral profile from events"""
        if not events:
            return {}
        
        profile = {
            'avg_time_between_events': 0,
            'most_common_action': None,
            'page_view_pattern': 'normal',
            'interaction_rate': 0,
            'content_engagement': 'low'
        }
        
        # Calculate average time between events
        if len(events) > 1:
            time_diffs = []
            for i in range(1, len(events)):
                diff = (events[i-1].timestamp - events[i].timestamp).total_seconds()
                time_diffs.append(diff)
            profile['avg_time_between_events'] = np.mean(time_diffs) if time_diffs else 0
        
        # Find most common action
        action_counts = Counter(e.event_type for e in events)
        if action_counts:
            profile['most_common_action'] = action_counts.most_common(1)[0][0]
        
        # Determine page view pattern
        page_views = [e for e in events if e.event_type == 'page_view']
        if page_views:
            avg_time = np.mean([e.time_on_page or 0 for e in page_views])
            if avg_time < 2:
                profile['page_view_pattern'] = 'rapid'
            elif avg_time > 60:
                profile['page_view_pattern'] = 'slow'
        
        # Calculate interaction rate
        interactions = sum(1 for e in events if e.event_type in ['click', 'form_submit', 'comment'])
        if events:
            profile['interaction_rate'] = interactions / len(events)
        
        # Determine content engagement
        engagement_events = sum(1 for e in events if e.event_type in ['comment', 'like', 'share'])
        if engagement_events > 5:
            profile['content_engagement'] = 'high'
        elif engagement_events > 0:
            profile['content_engagement'] = 'medium'
        
        return profile
    
    def get_user_flags(self, activities, sessions, events) -> Dict[str, bool]:
        """Get user behavior flags"""
        flags = {
            'rapid_visits': False,
            'unusual_hours': False,
            'vpn_usage': False,
            'geo_jumps': False,
            'data_scraping': False,
            'form_flooding': False,
            'suspicious_referrer': False,
            'multiple_devices': False
        }
        
        # Check each flag
        if activities:
            flags['rapid_visits'] = any(a.activity_type == 'rapid_visits' for a in activities)
            flags['geo_jumps'] = any(a.activity_type == 'geo_jump' for a in activities)
            flags['data_scraping'] = any(a.activity_type == 'data_scraping' for a in activities)
            flags['form_flooding'] = any(a.activity_type == 'form_flooding' for a in activities)
        
        if sessions:
            flags['unusual_hours'] = sessions.filter(is_unusual_hour=True).count() > 2
            flags['vpn_usage'] = sessions.filter(is_vpn=True).exists()
            
            # Check for multiple devices
            unique_devices = sessions.values('device_type', 'browser').distinct().count()
            flags['multiple_devices'] = unique_devices > 3
        
        if events:
            # Check for suspicious referrers
            suspicious_referrers = ['bit.ly', 'tinyurl', 't.co', 'goo.gl']
            for event in events:
                if event.referrer_url:
                    for ref in suspicious_referrers:
                        if ref in event.referrer_url:
                            flags['suspicious_referrer'] = True
                            break
        
        return flags
    
    def get_real_time_activity(self, minutes: int = 5) -> List[Dict[str, Any]]:
        """Get real-time activity stream"""
        since = timezone.now() - timedelta(minutes=minutes)
        
        events = TrackingEvent.objects.filter(
            case=self.case,
            timestamp__gte=since
        ).select_related('session').order_by('-timestamp')[:50]
        
        activity_stream = []
        for event in events:
            activity_stream.append({
                'id': str(event.id),
                'timestamp': event.timestamp.isoformat(),
                'type': event.event_type,
                'page': event.page_url,
                'user': event.fingerprint_hash[:8] + '...',
                'location': self.format_location(event.ip_city, event.ip_country),
                'is_suspicious': event.is_suspicious,
                'suspicious_score': round(event.suspicious_score, 2),
                'is_vpn': event.is_vpn,
                'device': event.device_type or 'unknown',
                'browser': event.browser or 'unknown',
                'details': self.format_event_details(event)
            })
        
        return activity_stream
    
    def format_location(self, city: str, country: str) -> str:
        """Format location string"""
        if city and country:
            return f"{city}, {country}"
        elif country:
            return country
        return 'Unknown'
    
    def format_event_details(self, event: TrackingEvent) -> str:
        """Format event details for display"""
        if event.event_type == 'page_view':
            return f"Viewed {event.page_title or 'page'}"
        elif event.event_type == 'form_submit':
            return f"Submitted {event.event_data.get('form_type', 'form')}"
        elif event.event_type == 'click':
            return f"Clicked {event.event_data.get('element', 'element')}"
        elif event.event_type == 'tip_submit':
            return "Submitted a tip"
        elif event.event_type == 'donation_complete':
            amount = event.event_data.get('amount', 0)
            return f"Donated ${amount}"
        else:
            return event.get_event_type_display()
    
    def generate_alert_recommendations(self) -> List[Dict[str, Any]]:
        """Generate actionable recommendations based on current activity"""
        recommendations = []
        
        # Check for immediate threats
        high_risk_users = SuspiciousActivity.objects.filter(
            case=self.case,
            severity_level__gte=4,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).distinct('fingerprint_hash')
        
        if high_risk_users.count() > 0:
            recommendations.append({
                'priority': 'HIGH',
                'type': 'immediate_attention',
                'title': 'High-Risk Users Detected',
                'message': f"{high_risk_users.count()} high-risk users detected in the last 24 hours",
                'users': [u.fingerprint_hash[:16] for u in high_risk_users[:5]],
                'suggested_actions': [
                    'Review detailed activity logs',
                    'Consider law enforcement notification',
                    'Document all suspicious activities',
                    'Enable enhanced monitoring for these users'
                ]
            })
        
        # Check for unusual traffic patterns
        current_hour_traffic = TrackingEvent.objects.filter(
            case=self.case,
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        avg_hourly_traffic = TrackingEvent.objects.filter(
            case=self.case,
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).count() / (7 * 24)
        
        if current_hour_traffic > avg_hourly_traffic * 3:
            recommendations.append({
                'priority': 'MEDIUM',
                'type': 'traffic_spike',
                'title': 'Unusual Traffic Spike Detected',
                'message': f"Current traffic is {(current_hour_traffic / avg_hourly_traffic):.1f}x normal",
                'suggested_actions': [
                    'Monitor for potential DDoS or bot activity',
                    'Check referrer sources for unusual patterns',
                    'Review recent social media mentions'
                ]
            })
        
        # Check for data scraping patterns
        scraping_activities = SuspiciousActivity.objects.filter(
            case=self.case,
            activity_type='data_scraping',
            created_at__gte=timezone.now() - timedelta(days=1)
        ).count()
        
        if scraping_activities > 5:
            recommendations.append({
                'priority': 'MEDIUM',
                'type': 'data_scraping',
                'title': 'Potential Data Scraping Detected',
                'message': f"{scraping_activities} data scraping attempts in the last 24 hours",
                'suggested_actions': [
                    'Implement rate limiting',
                    'Add CAPTCHA verification',
                    'Block suspicious IP addresses'
                ]
            })
        
        # Check for VPN usage patterns
        vpn_rate = self.get_vpn_usage_rate()
        if vpn_rate > 50:
            recommendations.append({
                'priority': 'LOW',
                'type': 'high_vpn_usage',
                'title': 'High VPN Usage Detected',
                'message': f"{vpn_rate:.1f}% of users are using VPN/Proxy",
                'suggested_actions': [
                    'Review VPN user activities for patterns',
                    'Consider implementing additional verification'
                ]
            })
        
        return recommendations
    
    def get_time_zone_analysis(self) -> Dict[str, Any]:
        """Analyze access patterns by timezone and unusual hours"""
        sessions = UserSession.objects.filter(case=self.case)
        
        timezone_data = defaultdict(lambda: {
            'total_visits': 0,
            'unusual_hour_visits': 0,
            'suspicious_users': 0,
            'hours': [0] * 24,
            'risk_score': 0.0
        })
        
        for session in sessions:
            tz = session.timezone or 'Unknown'
            data = timezone_data[tz]
            
            data['total_visits'] += 1
            
            if session.is_unusual_hour:
                data['unusual_hour_visits'] += 1
            
            if session.is_suspicious:
                data['suspicious_users'] += 1
            
            # Track hourly distribution
            if session.local_time:
                hour = session.local_time.hour
                data['hours'][hour] += 1
        
        # Calculate risk scores and percentages
        result = {}
        for tz, data in timezone_data.items():
            if data['total_visits'] > 0:
                data['unusual_hour_percentage'] = (data['unusual_hour_visits'] / data['total_visits']) * 100
                data['suspicious_percentage'] = (data['suspicious_users'] / data['total_visits']) * 100
                
                # Calculate risk score
                risk_score = 0.0
                if data['unusual_hour_percentage'] > 30:
                    risk_score += 0.5
                if data['suspicious_percentage'] > 20:
                    risk_score += 0.5
                
                data['risk_score'] = min(risk_score, 1.0)
                data['is_high_risk'] = risk_score > 0.5
                
                result[tz] = data
        
        return result