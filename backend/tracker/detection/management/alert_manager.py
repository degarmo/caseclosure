"""
Alert Management Module
Manages alerts, notifications, and activity records for criminal investigations
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class AlertPriority(Enum):
    """Alert priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertType(Enum):
    """Types of alerts"""
    CRIMINAL_SUSPECT = "criminal_suspect"
    EVIDENCE_TAMPERING = "evidence_tampering"
    WITNESS_INTIMIDATION = "witness_intimidation"
    SUSPICIOUS_BEHAVIOR = "suspicious_behavior"
    TECHNICAL_EVASION = "technical_evasion"
    HONEYTRAP_TRIGGERED = "honeytrap_triggered"
    COORDINATED_ACTIVITY = "coordinated_activity"
    ESCALATION_WARNING = "escalation_warning"


class AlertManager:
    """Manages alerts and notifications for suspicious activity"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.alert_queue = []
        self.notification_handlers = self._initialize_handlers()
    
    def create_law_enforcement_alert(self, event, indicators: Dict, score: float) -> Dict[str, Any]:
        """Create critical alert for law enforcement"""
        critical_indicators = [
            k for k, v in indicators.items() 
            if isinstance(v, dict) and v.get('triggered') and v.get('score', 0) >= 8.0
        ]
        
        alert = {
            'id': self._generate_alert_id(),
            'type': AlertType.CRIMINAL_SUSPECT.value,
            'priority': AlertPriority.CRITICAL.value,
            'timestamp': datetime.now().isoformat(),
            'title': f"🚨 CRITICAL: Potential Suspect Activity - Score: {score}/10",
            'message': f"High-risk criminal behavior detected from user {event.fingerprint_hash[:16]}",
            'fingerprint_hash': event.fingerprint_hash,
            'case_id': event.case_id if hasattr(event, 'case_id') else None,
            'data': {
                'event_id': str(event.id) if hasattr(event, 'id') else None,
                'criminal_score': score,
                'critical_indicators': critical_indicators,
                'ip_address': event.ip_address,
                'location': self._format_location(event),
                'law_enforcement_priority': True,
                'evidence_preservation_required': True,
                'user_agent': event.user_agent,
                'timestamp': event.timestamp.isoformat() if hasattr(event, 'timestamp') else None,
            },
            'recommended_actions': [
                '🚨 IMMEDIATE: Contact law enforcement',
                '📋 Preserve all digital evidence',
                '🔒 Consider IP address blocking',
                '📞 Alert case investigators',
                '💾 Backup user activity logs',
                '🔍 Cross-reference with known suspects',
                '⚖️ Document for legal proceedings',
            ],
            'auto_escalate': True,
            'notification_sent': False
        }
        
        # Queue for immediate notification
        self._queue_alert(alert)
        
        # Store in database
        self._store_alert(alert)
        
        # Send notifications
        self._send_notifications(alert)
        
        return alert
    
    def create_criminal_activity_record(self, event, indicators: Dict, score: float) -> Dict[str, Any]:
        """Create enhanced criminal activity record"""
        activity_type = self._determine_criminal_activity_type(indicators)
        threat_level = self._calculate_threat_level(score, indicators)
        
        record = {
            'id': self._generate_record_id(),
            'case_id': event.case_id if hasattr(event, 'case_id') else None,
            'session_id': event.session.id if hasattr(event, 'session') and event.session else None,
            'session_identifier': event.session_identifier if hasattr(event, 'session_identifier') else None,
            'fingerprint_hash': event.fingerprint_hash,
            'ip_address': event.ip_address,
            'activity_type': activity_type,
            'severity_level': min(int(score), 5),
            'confidence_score': score / 10.0,
            'timestamp': datetime.now().isoformat(),
            'details': {
                'criminal_indicators': self._filter_triggered_indicators(indicators),
                'criminal_score': score,
                'threat_level': threat_level,
                'event_id': str(event.id) if hasattr(event, 'id') else None,
                'event_type': event.event_type,
                'page_url': event.page_url,
                'law_enforcement_relevant': score >= 8.0,
            },
            'evidence': {
                'user_agent': event.user_agent,
                'referrer': event.referrer_url if hasattr(event, 'referrer_url') else None,
                'ip_details': {
                    'country': event.ip_country if hasattr(event, 'ip_country') else None,
                    'city': event.ip_city if hasattr(event, 'ip_city') else None,
                    'is_vpn': event.is_vpn if hasattr(event, 'is_vpn') else False,
                    'is_tor': event.is_tor if hasattr(event, 'is_tor') else False,
                    'is_proxy': event.is_proxy if hasattr(event, 'is_proxy') else False,
                },
                'device_details': {
                    'browser': event.browser if hasattr(event, 'browser') else None,
                    'os': event.os if hasattr(event, 'os') else None,
                    'device_type': event.device_type if hasattr(event, 'device_type') else None,
                },
                'behavioral_data': {
                    'time_on_page': event.time_on_page if hasattr(event, 'time_on_page') else None,
                    'scroll_depth': event.scroll_depth if hasattr(event, 'scroll_depth') else None,
                    'event_data': event.event_data if hasattr(event, 'event_data') else None,
                }
            }
        }
        
        # Store record
        self._store_activity_record(record)
        
        # Check if alert needed
        if score >= 6.0:
            self._create_activity_alert(record)
        
        return record
    
    def create_escalation_alert(self, fingerprint_hash: str, escalation_data: Dict) -> Dict[str, Any]:
        """Create alert for behavior escalation"""
        alert = {
            'id': self._generate_alert_id(),
            'type': AlertType.ESCALATION_WARNING.value,
            'priority': AlertPriority.HIGH.value,
            'timestamp': datetime.now().isoformat(),
            'title': "⚠️ Behavior Escalation Detected",
            'message': f"User {fingerprint_hash[:16]} showing escalating behavior patterns",
            'fingerprint_hash': fingerprint_hash,
            'data': escalation_data,
            'recommended_actions': self._generate_escalation_actions(escalation_data),
            'auto_escalate': escalation_data.get('escalation_probability', 0) > 0.7
        }
        
        self._queue_alert(alert)
        self._send_notifications(alert)
        
        return alert
    
    def create_tampering_alert(self, event, tampering_type: str) -> Dict[str, Any]:
        """Create alert for evidence tampering attempts"""
        alert = {
            'id': self._generate_alert_id(),
            'type': AlertType.EVIDENCE_TAMPERING.value,
            'priority': AlertPriority.CRITICAL.value,
            'timestamp': datetime.now().isoformat(),
            'title': "🔴 CRITICAL: Evidence Tampering Detected",
            'message': f"Attempt to tamper with {tampering_type} detected",
            'fingerprint_hash': event.fingerprint_hash,
            'data': {
                'tampering_type': tampering_type,
                'ip_address': event.ip_address,
                'page_url': event.page_url,
                'preserve_immediately': True
            },
            'recommended_actions': [
                '🔴 IMMEDIATE: Preserve all evidence',
                '📸 Take system snapshots',
                '🔒 Lock down affected systems',
                '📞 Contact digital forensics team',
                '⚖️ Prepare legal documentation'
            ],
            'auto_escalate': True
        }
        
        self._queue_alert(alert)
        self._send_notifications(alert)
        
        return alert
    
    def get_alert_statistics(self, case_id: str, time_range: Optional[int] = 24) -> Dict[str, Any]:
        """Get alert statistics for a case"""
        cutoff_time = datetime.now() - timedelta(hours=time_range)
        
        # In production, would query from database
        stats = {
            'total_alerts': 0,
            'by_priority': {
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0,
                'info': 0
            },
            'by_type': {},
            'escalation_rate': 0.0,
            'response_time_avg': 0.0,
            'unresolved_count': 0,
            'top_suspects': [],
            'trending_indicators': []
        }
        
        # Calculate statistics from stored alerts
        # This is placeholder - would query actual database
        
        return stats
    
    def manage_alert_queue(self) -> None:
        """Process queued alerts"""
        while self.alert_queue:
            alert = self.alert_queue.pop(0)
            
            # Check for alert correlation
            correlated = self._correlate_alert(alert)
            if correlated:
                alert['correlated_alerts'] = correlated
            
            # Apply alert rules
            self._apply_alert_rules(alert)
            
            # Send to appropriate handlers
            self._route_alert(alert)
    
    # Helper methods
    
    def _initialize_handlers(self) -> Dict[str, Any]:
        """Initialize notification handlers"""
        return {
            'email': self._send_email_notification,
            'sms': self._send_sms_notification,
            'dashboard': self._send_dashboard_notification,
            'api': self._send_api_notification
        }
    
    def _generate_alert_id(self) -> str:
        """Generate unique alert ID"""
        import hashlib
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"alert_{timestamp}".encode()).hexdigest()[:16]
    
    def _generate_record_id(self) -> str:
        """Generate unique record ID"""
        import hashlib
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"record_{timestamp}".encode()).hexdigest()[:16]
    
    def _format_location(self, event) -> str:
        """Format location string from event"""
        if hasattr(event, 'ip_city') and event.ip_city:
            return f"{event.ip_city}, {event.ip_country}"
        elif hasattr(event, 'ip_country') and event.ip_country:
            return event.ip_country
        return "Unknown"
    
    def _filter_triggered_indicators(self, indicators: Dict) -> Dict:
        """Filter only triggered indicators"""
        return {
            k: v for k, v in indicators.items() 
            if isinstance(v, dict) and v.get('triggered')
        }
    
    def _calculate_threat_level(self, score: float, indicators: Dict) -> str:
        """Calculate threat level based on score and indicators"""
        if score >= 9.0:
            return 'CRITICAL'
        elif score >= 7.0:
            return 'HIGH'
        elif score >= 5.0:
            return 'MEDIUM'
        elif score >= 3.0:
            return 'LOW'
        else:
            return 'MINIMAL'
    
    def _determine_criminal_activity_type(self, indicators: Dict) -> str:
        """Determine the primary criminal activity type"""
        critical_indicators = {
            'evidence_tampering': 'evidence_tampering',
            'tor_usage': 'dark_web_access',
            'victim_obsession': 'victim_stalking',
            'witness_targeting': 'witness_intimidation',
            'stalking_patterns': 'cyberstalking',
            'admin_probing': 'system_infiltration',
        }
        
        for indicator_name, activity_type in critical_indicators.items():
            if indicators.get(indicator_name, {}).get('triggered'):
                return activity_type
        
        # Secondary indicators
        if indicators.get('geographic_evasion', {}).get('triggered'):
            return 'location_evasion'
        elif indicators.get('identity_manipulation', {}).get('triggered'):
            return 'identity_fraud'
        elif indicators.get('timeline_obsession', {}).get('triggered'):
            return 'case_monitoring'
        elif indicators.get('advanced_evasion', {}).get('triggered'):
            return 'technical_evasion'
        else:
            return 'suspicious_behavior'
    
    def _queue_alert(self, alert: Dict) -> None:
        """Queue alert for processing"""
        # Add to queue with priority ordering
        priority_order = {
            'critical': 0,
            'high': 1,
            'medium': 2,
            'low': 3,
            'info': 4
        }
        
        alert_priority = priority_order.get(alert['priority'], 5)
        
        # Insert in priority order
        inserted = False
        for i, queued_alert in enumerate(self.alert_queue):
            queued_priority = priority_order.get(queued_alert['priority'], 5)
            if alert_priority < queued_priority:
                self.alert_queue.insert(i, alert)
                inserted = True
                break
        
        if not inserted:
            self.alert_queue.append(alert)
    
    def _store_alert(self, alert: Dict) -> None:
        """Store alert in database"""
        # In production, would store in database
        logger.info(f"Storing alert: {json.dumps(alert)}")
        
        # Store in Redis for quick access
        if self.parent.redis_available:
            key = f"alert:{alert['id']}"
            self.parent.redis_client.setex(key, 86400 * 7, json.dumps(alert))  # Keep for 7 days
    
    def _store_activity_record(self, record: Dict) -> None:
        """Store activity record in database"""
        # In production, would store in database
        logger.info(f"Storing activity record: {record['id']}")
        
        if self.parent.redis_available:
            key = f"activity:{record['id']}"
            self.parent.redis_client.setex(key, 86400 * 30, json.dumps(record))  # Keep for 30 days
    
    def _send_notifications(self, alert: Dict) -> None:
        """Send notifications based on alert priority"""
        if alert['priority'] == AlertPriority.CRITICAL.value:
            # Send all notification types for critical
            for handler_name, handler in self.notification_handlers.items():
                try:
                    handler(alert)
                except Exception as e:
                    logger.error(f"Failed to send {handler_name} notification: {e}")
        elif alert['priority'] == AlertPriority.HIGH.value:
            # Send email and dashboard for high
            self._send_email_notification(alert)
            self._send_dashboard_notification(alert)
        else:
            # Just dashboard for others
            self._send_dashboard_notification(alert)
        
        alert['notification_sent'] = True
    
    def _send_email_notification(self, alert: Dict) -> None:
        """Send email notification"""
        # Placeholder - would integrate with email service
        logger.info(f"Email notification would be sent for alert: {alert['id']}")
    
    def _send_sms_notification(self, alert: Dict) -> None:
        """Send SMS notification"""
        # Placeholder - would integrate with SMS service
        logger.info(f"SMS notification would be sent for alert: {alert['id']}")
    
    def _send_dashboard_notification(self, alert: Dict) -> None:
        """Send dashboard notification"""
        # Placeholder - would send to real-time dashboard
        logger.info(f"Dashboard notification sent for alert: {alert['id']}")
    
    def _send_api_notification(self, alert: Dict) -> None:
        """Send API notification to external systems"""
        # Placeholder - would call external API
        logger.info(f"API notification would be sent for alert: {alert['id']}")
    
    def _create_activity_alert(self, record: Dict) -> None:
        """Create alert from activity record if needed"""
        if record['severity_level'] >= 4:
            alert = {
                'id': self._generate_alert_id(),
                'type': AlertType.SUSPICIOUS_BEHAVIOR.value,
                'priority': AlertPriority.MEDIUM.value,
                'timestamp': datetime.now().isoformat(),
                'title': f"Suspicious Activity: {record['activity_type']}",
                'message': f"Detected {record['activity_type']} from user {record['fingerprint_hash'][:16]}",
                'fingerprint_hash': record['fingerprint_hash'],
                'data': record['details'],
                'recommended_actions': self._generate_activity_actions(record)
            }
            
            self._queue_alert(alert)
    
    def _generate_escalation_actions(self, escalation_data: Dict) -> List[str]:
        """Generate recommended actions for escalation"""
        actions = []
        
        if escalation_data.get('predicted_timeframe') == 'imminent_24h':
            actions.append('🚨 URGENT: Monitor continuously for next 24 hours')
        
        if escalation_data.get('escalation_probability', 0) > 0.8:
            actions.append('⚠️ Consider preventive intervention')
        
        actions.extend([
            '📊 Review behavioral patterns',
            '🔍 Cross-reference with other cases',
            '📞 Alert investigation team',
            '💾 Backup current evidence'
        ])
        
        return actions
    
    def _generate_activity_actions(self, record: Dict) -> List[str]:
        """Generate recommended actions for activity"""
        actions = []
        
        activity_type = record['activity_type']
        
        if activity_type == 'evidence_tampering':
            actions.append('🔴 Preserve evidence immediately')
        elif activity_type == 'dark_web_access':
            actions.append('🌐 Monitor dark web activity')
        elif activity_type == 'victim_stalking':
            actions.append('👤 Consider victim protection measures')
        
        actions.extend([
            '📋 Document activity',
            '🔍 Investigate further',
            '📊 Update case file'
        ])
        
        return actions
    
    def _correlate_alert(self, alert: Dict) -> List[str]:
        """Find correlated alerts"""
        correlated = []
        
        # Would query database for related alerts
        # Placeholder implementation
        
        return correlated
    
    def _apply_alert_rules(self, alert: Dict) -> None:
        """Apply business rules to alerts"""
        # Auto-escalate critical alerts
        if alert['priority'] == AlertPriority.CRITICAL.value:
            alert['auto_escalate'] = True
        
        # Add timestamp if missing
        if 'timestamp' not in alert:
            alert['timestamp'] = datetime.now().isoformat()
    
    def _route_alert(self, alert: Dict) -> None:
        """Route alert to appropriate handler"""
        # Route based on type and priority
        if alert['type'] == AlertType.CRIMINAL_SUSPECT.value:
            # Route to law enforcement handler
            logger.info(f"Routing to law enforcement: {alert['id']}")
        elif alert['type'] == AlertType.EVIDENCE_TAMPERING.value:
            # Route to forensics team
            logger.info(f"Routing to forensics: {alert['id']}")
        else:
            # Standard routing
            logger.info(f"Standard routing for: {alert['id']}")