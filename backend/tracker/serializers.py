# serializers.py - Django REST Framework Serializers

from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import re

from .models import (
    Case, TrackingEvent, UserSession, SuspiciousActivity,
    DeviceFingerprint, Alert, MLModel
)


class CaseSerializer(serializers.ModelSerializer):
    """Serializer for Case model"""
    
    total_visitors = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = [
            'id', 'slug', 'victim_name', 'case_type', 'case_number',
            'description', 'location', 'date_occurred', 'is_active',
            'contact_email', 'contact_phone', 'law_enforcement_contact',
            'total_views', 'unique_visitors', 'suspicious_visitors',
            'tips_received', 'total_visitors', 'recent_activity',
            'risk_level', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_views', 'unique_visitors', 'suspicious_visitors',
            'tips_received', 'created_at', 'updated_at'
        ]
    
    def get_total_visitors(self, obj):
        """Get total unique visitors in last 30 days"""
        since = timezone.now() - timedelta(days=30)
        return UserSession.objects.filter(
            case=obj,
            created_at__gte=since
        ).distinct('fingerprint_hash').count()
    
    def get_recent_activity(self, obj):
        """Check if there's been recent activity"""
        last_event = TrackingEvent.objects.filter(case=obj).order_by('-timestamp').first()
        if last_event:
            return {
                'last_activity': last_event.timestamp.isoformat(),
                'is_active': (timezone.now() - last_event.timestamp).seconds < 300
            }
        return None
    
    def get_risk_level(self, obj):
        """Calculate overall risk level for the case"""
        high_risk = SuspiciousActivity.objects.filter(
            case=obj,
            severity_level__gte=4,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        if high_risk > 10:
            return 'CRITICAL'
        elif high_risk > 5:
            return 'HIGH'
        elif high_risk > 0:
            return 'MEDIUM'
        return 'LOW'


class TrackingEventSerializer(serializers.ModelSerializer):
    """Serializer for TrackingEvent model"""
    
    case_slug = serializers.CharField(write_only=True, required=False)
    session_id = serializers.CharField(write_only=True)
    fingerprint = serializers.CharField(write_only=True)
    
    # Additional data from frontend
    eventType = serializers.CharField(source='event_type', required=True)
    eventData = serializers.JSONField(source='event_data', required=False, default=dict)
    url = serializers.CharField(source='page_url', required=True)
    pageTitle = serializers.CharField(source='page_title', required=False, allow_blank=True)
    referrer = serializers.CharField(source='referrer_url', required=False, allow_blank=True)
    
    # Browser/Device data
    screenWidth = serializers.IntegerField(source='screen_width', required=False)
    screenHeight = serializers.IntegerField(source='screen_height', required=False)
    viewport = serializers.DictField(required=False)
    
    # Time data
    localTime = serializers.CharField(required=False)
    timezone = serializers.CharField(required=False)
    isUnusualHour = serializers.BooleanField(source='is_unusual_hour', required=False)
    
    # Interaction data
    timeOnPage = serializers.IntegerField(source='time_on_page', required=False)
    scrollDepth = serializers.FloatField(source='scroll_depth', required=False)
    clicksCount = serializers.IntegerField(source='clicks_count', required=False, default=0)
    
    class Meta:
        model = TrackingEvent
        fields = [
            'id', 'case_slug', 'session_id', 'fingerprint',
            'eventType', 'eventData', 'url', 'pageTitle', 'referrer',
            'screenWidth', 'screenHeight', 'viewport',
            'localTime', 'timezone', 'isUnusualHour',
            'timeOnPage', 'scrollDepth', 'clicksCount',
            'timestamp', 'suspicious_score', 'is_suspicious'
        ]
        read_only_fields = ['id', 'timestamp', 'suspicious_score', 'is_suspicious']
    
    def validate_eventType(self, value):
        """Validate event type"""
        valid_types = [choice[0] for choice in TrackingEvent.EVENT_TYPES]
        if value not in valid_types:
            # Try to map common event types
            event_map = {
                'pageview': 'page_view',
                'page-view': 'page_view',
                'click': 'click',
                'submit': 'form_submit',
                'scroll': 'scroll',
            }
            value = event_map.get(value.lower(), value)
            
            if value not in valid_types:
                raise serializers.ValidationError(f"Invalid event type: {value}")
        return value
    
    def validate_scrollDepth(self, value):
        """Ensure scroll depth is between 0 and 100"""
        if value is not None:
            if value < 0 or value > 100:
                raise serializers.ValidationError("Scroll depth must be between 0 and 100")
        return value
    
    def create(self, validated_data):
        """Create tracking event with additional processing"""
        # Extract nested data
        viewport = validated_data.pop('viewport', {})
        if viewport:
            validated_data['viewport_width'] = viewport.get('width')
            validated_data['viewport_height'] = viewport.get('height')
        
        # Handle case lookup
        case_slug = validated_data.pop('case_slug', None)
        if case_slug and case_slug != 'global':
            try:
                validated_data['case'] = Case.objects.get(slug=case_slug)
            except Case.DoesNotExist:
                raise serializers.ValidationError({"case_slug": "Case not found"})
        
        # Create the event
        return super().create(validated_data)


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for UserSession model"""
    
    events_count = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    risk_indicators = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'session_id', 'fingerprint_hash', 'ip_address',
            'ip_country', 'ip_city', 'is_vpn', 'user_agent',
            'browser', 'os', 'device_type', 'timezone',
            'is_unusual_hour', 'page_views', 'total_duration',
            'events_count', 'duration', 'risk_indicators',
            'location', 'suspicious_score', 'is_suspicious',
            'risk_level', 'created_at', 'last_activity'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity']
    
    def get_events_count(self, obj):
        """Get total events in session"""
        return obj.events.count()
    
    def get_duration(self, obj):
        """Calculate session duration"""
        if obj.last_activity and obj.created_at:
            duration = (obj.last_activity - obj.created_at).total_seconds()
            return {
                'seconds': duration,
                'formatted': self.format_duration(duration)
            }
        return None
    
    def get_risk_indicators(self, obj):
        """Get risk indicators for session"""
        indicators = []
        
        if obj.is_vpn:
            indicators.append('VPN')
        if obj.is_unusual_hour:
            indicators.append('Unusual Hour')
        if obj.suspicious_score > 0.5:
            indicators.append('Suspicious')
        if obj.copy_events > 10:
            indicators.append('Excessive Copying')
        if obj.rapid_clicks > 5:
            indicators.append('Rapid Clicks')
        
        return indicators
    
    def get_location(self, obj):
        """Format location string"""
        parts = []
        if obj.ip_city:
            parts.append(obj.ip_city)
        if obj.ip_country:
            parts.append(obj.ip_country)
        return ', '.join(parts) if parts else 'Unknown'
    
    @staticmethod
    def format_duration(seconds):
        """Format duration in human-readable format"""
        if seconds < 60:
            return f"{int(seconds)} seconds"
        elif seconds < 3600:
            return f"{int(seconds / 60)} minutes"
        else:
            return f"{seconds / 3600:.1f} hours"


class SuspiciousActivitySerializer(serializers.ModelSerializer):
    """Serializer for SuspiciousActivity model"""
    
    case_info = serializers.SerializerMethodField()
    session_info = serializers.SerializerMethodField()
    severity_display = serializers.CharField(source='get_severity_level_display', read_only=True)
    activity_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    
    class Meta:
        model = SuspiciousActivity
        fields = [
            'id', 'case', 'case_info', 'session', 'session_info',
            'session_identifier', 'fingerprint_hash', 'ip_address',
            'activity_type', 'activity_display', 'severity_level',
            'severity_display', 'confidence_score', 'details',
            'evidence', 'ml_prediction', 'anomaly_score',
            'reviewed', 'reviewed_by', 'reviewed_at', 'action_taken',
            'flagged_for_law_enforcement', 'law_enforcement_notified',
            'false_positive', 'whitelisted', 'created_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'reviewed_at', 'ml_prediction', 'anomaly_score'
        ]
    
    def get_case_info(self, obj):
        """Get basic case information"""
        if obj.case:
            return {
                'id': str(obj.case.id),
                'slug': obj.case.slug,
                'victim_name': obj.case.victim_name
            }
        return None
    
    def get_session_info(self, obj):
        """Get basic session information"""
        if obj.session:
            return {
                'id': str(obj.session.id),
                'session_id': obj.session.session_id,
                'browser': obj.session.browser,
                'device': obj.session.device_type
            }
        return None
    
    def validate_severity_level(self, value):
        """Validate severity level"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Severity level must be between 1 and 5")
        return value
    
    def validate_confidence_score(self, value):
        """Validate confidence score"""
        if value < 0 or value > 1:
            raise serializers.ValidationError("Confidence score must be between 0 and 1")
        return value


class SuspiciousActivityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating suspicious activity reports"""
    
    caseId = serializers.CharField(write_only=True)
    sessionId = serializers.CharField(required=False, allow_blank=True)
    fingerprint = serializers.CharField(required=False, allow_blank=True)
    ipAddress = serializers.IPAddressField(required=False, default='0.0.0.0')
    activityType = serializers.CharField()
    severityLevel = serializers.IntegerField(min_value=1, max_value=5)
    description = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = SuspiciousActivity
        fields = [
            'caseId', 'sessionId', 'fingerprint', 'ipAddress',
            'activityType', 'severityLevel', 'description',
            'details', 'evidence'
        ]
    
    def validate_activityType(self, value):
        """Validate or map activity type"""
        valid_types = [choice[0] for choice in SuspiciousActivity.ACTIVITY_TYPES]
        if value not in valid_types:
            # Default to manual_report for unknown types
            return 'suspicious_pattern'
        return value
    
    def create(self, validated_data):
        """Create suspicious activity with case lookup"""
        case_id = validated_data.pop('caseId')
        try:
            case = Case.objects.get(slug=case_id)
        except Case.DoesNotExist:
            raise serializers.ValidationError({"caseId": "Case not found"})
        
        # Map fields
        validated_data['case'] = case
        validated_data['session_identifier'] = validated_data.pop('sessionId', '')
        validated_data['fingerprint_hash'] = validated_data.pop('fingerprint', '')
        validated_data['ip_address'] = validated_data.pop('ipAddress', '0.0.0.0')
        validated_data['activity_type'] = validated_data.pop('activityType')
        validated_data['severity_level'] = validated_data.pop('severityLevel')
        
        # Add description to details if provided
        description = validated_data.pop('description', None)
        if description:
            if 'details' not in validated_data:
                validated_data['details'] = {}
            validated_data['details']['description'] = description
        
        return super().create(validated_data)


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model"""
    
    case_info = serializers.SerializerMethodField()
    suspicious_activity_info = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id', 'case', 'case_info', 'alert_type', 'priority',
            'title', 'message', 'suspicious_activity',
            'suspicious_activity_info', 'fingerprint_hash',
            'data', 'recommended_actions', 'acknowledged',
            'acknowledged_by', 'acknowledged_at', 'resolved',
            'resolved_by', 'resolved_at', 'resolution_notes',
            'email_sent', 'sms_sent', 'push_sent', 'age',
            'created_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'acknowledged_at', 'resolved_at'
        ]
    
    def get_case_info(self, obj):
        """Get basic case information"""
        return {
            'id': str(obj.case.id),
            'slug': obj.case.slug,
            'victim_name': obj.case.victim_name,
            'case_type': obj.case.case_type
        }
    
    def get_suspicious_activity_info(self, obj):
        """Get suspicious activity details if linked"""
        if obj.suspicious_activity:
            return {
                'id': str(obj.suspicious_activity.id),
                'type': obj.suspicious_activity.activity_type,
                'severity': obj.suspicious_activity.severity_level,
                'timestamp': obj.suspicious_activity.created_at.isoformat()
            }
        return None
    
    def get_age(self, obj):
        """Get age of alert"""
        age = timezone.now() - obj.created_at
        if age.days > 0:
            return f"{age.days} days"
        elif age.seconds > 3600:
            return f"{age.seconds // 3600} hours"
        else:
            return f"{age.seconds // 60} minutes"


class DeviceFingerprintSerializer(serializers.ModelSerializer):
    """Serializer for DeviceFingerprint model"""
    
    sessions_count = serializers.SerializerMethodField()
    last_seen_ago = serializers.SerializerMethodField()
    risk_assessment = serializers.SerializerMethodField()
    
    class Meta:
        model = DeviceFingerprint
        fields = [
            'id', 'fingerprint_hash', 'user_agent', 'browser',
            'browser_version', 'os', 'os_version', 'platform',
            'device_type', 'device_memory', 'hardware_concurrency',
            'screen_resolution', 'color_depth', 'languages',
            'timezone', 'timezone_offset', 'canvas_fingerprint',
            'webgl_fingerprint', 'audio_fingerprint', 'fonts',
            'plugins', 'touch_support', 'trust_score',
            'is_suspicious', 'is_bot', 'known_ips',
            'sessions_count', 'last_seen_ago', 'risk_assessment',
            'first_seen', 'last_seen', 'total_sessions'
        ]
        read_only_fields = [
            'id', 'first_seen', 'last_seen', 'total_sessions'
        ]
    
    def get_sessions_count(self, obj):
        """Get number of sessions with this fingerprint"""
        return UserSession.objects.filter(fingerprint_hash=obj.fingerprint_hash).count()
    
    def get_last_seen_ago(self, obj):
        """Get how long ago device was last seen"""
        if obj.last_seen:
            delta = timezone.now() - obj.last_seen
            if delta.days > 0:
                return f"{delta.days} days ago"
            elif delta.seconds > 3600:
                return f"{delta.seconds // 3600} hours ago"
            else:
                return f"{delta.seconds // 60} minutes ago"
        return None
    
    def get_risk_assessment(self, obj):
        """Get risk assessment for device"""
        risk_factors = []
        
        if obj.is_suspicious:
            risk_factors.append('Marked Suspicious')
        if obj.is_bot:
            risk_factors.append('Bot Detected')
        if obj.trust_score < 0.3:
            risk_factors.append('Low Trust Score')
        if len(obj.known_ips) > 10:
            risk_factors.append('Multiple IPs')
        
        return {
            'risk_factors': risk_factors,
            'risk_level': 'HIGH' if len(risk_factors) > 2 else 'MEDIUM' if risk_factors else 'LOW'
        }


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    
    # Overview stats
    total_visitors = serializers.IntegerField()
    total_page_views = serializers.IntegerField()
    suspicious_users = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    
    # Time-based stats
    visitors_24h = serializers.IntegerField()
    visitors_7d = serializers.IntegerField()
    visitors_30d = serializers.IntegerField()
    suspicious_24h = serializers.IntegerField()
    high_risk_users = serializers.IntegerField()
    
    # Trends
    visitor_trend = serializers.ListField(child=serializers.DictField())
    suspicious_trend = serializers.ListField(child=serializers.DictField())
    
    # Distributions
    geographic_distribution = serializers.ListField(child=serializers.DictField())
    device_breakdown = serializers.ListField(child=serializers.DictField())
    top_referrers = serializers.ListField(child=serializers.DictField())
    peak_hours = serializers.ListField(child=serializers.IntegerField())
    
    # Recent activity
    recent_suspicious = serializers.ListField(child=serializers.DictField())
    alerts = serializers.ListField(child=serializers.DictField())
    
    # Timezone analysis
    timezone_analysis = serializers.DictField()


class RealTimeActivitySerializer(serializers.Serializer):
    """Serializer for real-time activity stream"""
    
    id = serializers.UUIDField()
    timestamp = serializers.DateTimeField()
    type = serializers.CharField()
    page = serializers.CharField()
    user = serializers.CharField()
    location = serializers.CharField()
    is_suspicious = serializers.BooleanField()
    suspicious_score = serializers.FloatField()
    is_vpn = serializers.BooleanField()
    device = serializers.CharField()
    browser = serializers.CharField()


class ExportRequestSerializer(serializers.Serializer):
    """Serializer for data export requests"""
    
    type = serializers.ChoiceField(choices=['json', 'csv', 'pdf'], default='csv')
    include_suspicious = serializers.BooleanField(default=True)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    
    def validate(self, data):
        """Validate date range"""
        if data.get('date_from') and data.get('date_to'):
            if data['date_from'] > data['date_to']:
                raise serializers.ValidationError({
                    'date_from': 'Start date must be before end date'
                })
        return data


class BatchTrackingEventSerializer(serializers.Serializer):
    """Serializer for batch tracking events"""
    
    events = serializers.ListField(
        child=TrackingEventSerializer(),
        max_length=100
    )
    
    def validate_events(self, value):
        """Validate batch size"""
        if len(value) > 100:
            raise serializers.ValidationError("Maximum 100 events per batch")
        return value


class MLModelSerializer(serializers.ModelSerializer):
    """Serializer for ML Model information"""
    
    performance_summary = serializers.SerializerMethodField()
    deployment_status = serializers.SerializerMethodField()
    
    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'model_type', 'version', 'description',
            'algorithm', 'parameters', 'features', 'accuracy',
            'precision', 'recall', 'f1_score', 'auc_score',
            'training_samples', 'training_date', 'training_duration',
            'model_file_path', 'model_size', 'is_active',
            'deployed_at', 'performance_summary', 'deployment_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_performance_summary(self, obj):
        """Get performance metrics summary"""
        metrics = {}
        if obj.accuracy:
            metrics['accuracy'] = f"{obj.accuracy * 100:.1f}%"
        if obj.precision:
            metrics['precision'] = f"{obj.precision * 100:.1f}%"
        if obj.recall:
            metrics['recall'] = f"{obj.recall * 100:.1f}%"
        if obj.f1_score:
            metrics['f1'] = f"{obj.f1_score:.3f}"
        return metrics
    
    def get_deployment_status(self, obj):
        """Get deployment status"""
        if obj.is_active:
            return {
                'status': 'Active',
                'deployed_at': obj.deployed_at.isoformat() if obj.deployed_at else None,
                'uptime': self.calculate_uptime(obj.deployed_at) if obj.deployed_at else None
            }
        return {'status': 'Inactive'}
    
    @staticmethod
    def calculate_uptime(deployed_at):
        """Calculate model uptime"""
        if deployed_at:
            delta = timezone.now() - deployed_at
            if delta.days > 0:
                return f"{delta.days} days"
            elif delta.seconds > 3600:
                return f"{delta.seconds // 3600} hours"
            else:
                return f"{delta.seconds // 60} minutes"
        return None