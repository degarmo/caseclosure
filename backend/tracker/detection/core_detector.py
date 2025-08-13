"""
Core Criminal Detection System
Main orchestrator for criminal behavior analysis
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import redis
import json
import logging
from django.utils import timezone
from django.core.cache import cache

from .models import TrackingEvent, UserSession, Alert, SuspiciousActivity
from .constants import THRESHOLDS, RISK_WEIGHTS

logger = logging.getLogger(__name__)


class EnhancedSuspiciousDetector:
    """
    Enhanced suspicious behavior detection system specifically designed 
    for criminal investigation cases (kidnapping, murder, etc.)
    Uses a 10-point scoring system as requested
    """
    
    def __init__(self):
        # Initialize Redis connection for caching
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=True
            )
            self.redis_available = True
        except:
            self.redis_client = None
            self.redis_available = False
            logger.warning("Redis not available, using Django cache")
        
        # Load configuration
        self.thresholds = THRESHOLDS
        self.risk_weights = RISK_WEIGHTS
        
        # Initialize sub-detectors (will be imported from other modules)
        self._init_detectors()
    
    def _init_detectors(self):
        """Initialize all sub-detector modules"""
        # These will be imported from the respective modules
        from .detectors.criminal_indicators import CriminalIndicatorDetector
        from .detectors.evasion_detector import EvasionDetector
        from .detectors.temporal_analyzer import TemporalAnalyzer
        from .detectors.behavioral_patterns import BehavioralPatternDetector
        
        self.criminal_detector = CriminalIndicatorDetector(self)
        self.evasion_detector = EvasionDetector(self)
        self.temporal_analyzer = TemporalAnalyzer(self)
        self.behavioral_detector = BehavioralPatternDetector(self)
    
    def analyze_criminal_behavior(self, event: TrackingEvent) -> float:
        """
        Main analysis method specifically for criminal investigation cases
        Returns a score between 0.0 and 10.0 (10 being most suspicious)
        """
        try:
            # Get comprehensive user history
            history = self.get_extended_user_history(event.fingerprint_hash, event.case_id)
            session = event.session if hasattr(event, 'session') else None
            
            # Run all criminal-specific detection checks
            criminal_indicators = {
                # Critical behavioral patterns
                'tor_usage': self.criminal_detector.check_tor_usage_criminal(event),
                'evidence_tampering': self.criminal_detector.check_evidence_tampering(event, history),
                'admin_probing': self.criminal_detector.check_admin_probing(event, history),
                'victim_obsession': self.criminal_detector.check_victim_obsession(event, history),
                'stalking_patterns': self.criminal_detector.check_stalking_patterns(event, history),
                'witness_targeting': self.criminal_detector.check_witness_targeting(event, history),
                
                # High-risk patterns
                'geographic_evasion': self.evasion_detector.check_geographic_evasion(event, history),
                'identity_manipulation': self.evasion_detector.check_identity_manipulation(event, history),
                'timeline_obsession': self.temporal_analyzer.check_timeline_obsession(event, history),
                'advanced_evasion': self.evasion_detector.check_advanced_evasion(event, history),
                
                # Medium-risk patterns
                'vpn_usage': self.evasion_detector.check_criminal_vpn_usage(event, history),
                'device_switching': self.evasion_detector.check_device_manipulation(event, history),
                'unusual_timing': self.temporal_analyzer.check_criminal_timing(event, history),
                'rapid_visits': self.behavioral_detector.check_obsessive_visits(event, history),
                
                # Supporting indicators
                'proxy_usage': self.evasion_detector.check_proxy_chains(event, history),
                'behavioral_anomalies': self.behavioral_detector.check_criminal_behavioral_anomalies(event, history),
            }
            
            # Calculate 10-point criminal suspicion score
            score = self.calculate_criminal_score(criminal_indicators)
            
            # Enhanced pattern learning for criminal behavior
            self.store_criminal_analysis(event.fingerprint_hash, score, criminal_indicators)
            
            # Create criminal activity record if warranted
            if score >= 6.0:  # Medium-high threshold
                self.create_criminal_activity_record(event, criminal_indicators, score)
            
            # Create critical alert for high-risk scores
            if score >= 8.0:  # High threshold for law enforcement alert
                self.create_law_enforcement_alert(event, criminal_indicators, score)
            
            return score
            
        except Exception as e:
            logger.error(f"Error analyzing criminal behavior: {e}")
            return 0.0
    
    def calculate_criminal_score(self, indicators: Dict[str, Dict]) -> float:
        """Calculate 10-point criminal suspicion score"""
        total_score = 0.0
        triggered_count = 0
        max_individual_score = 0.0
        
        for indicator_name, indicator_data in indicators.items():
            if isinstance(indicator_data, dict) and indicator_data.get('triggered'):
                individual_score = indicator_data.get('score', 0.0)
                max_individual_score = max(max_individual_score, individual_score)
                total_score += individual_score
                triggered_count += 1
        
        # If any single indicator is maximum (10.0), return that
        if max_individual_score >= 10.0:
            return 10.0
        
        # Apply escalation for multiple indicators
        if triggered_count > 1:
            escalation_factor = 1.0 + (triggered_count - 1) * 0.15
            total_score *= escalation_factor
        
        # Cap at 10.0
        final_score = min(total_score, 10.0)
        
        return round(final_score, 1)
    
    def get_extended_user_history(self, fingerprint_hash: str, case_id: str) -> List[Dict[str, Any]]:
        """Get extended user history for criminal behavior analysis"""
        cache_key = f'criminal_history:{fingerprint_hash}:{case_id}'
        
        # Try cache first
        if self.redis_available:
            cached = self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        else:
            cached = cache.get(cache_key)
            if cached:
                return cached
        
        # Get extended history from database (48 hours for criminal cases)
        history = []
        recent_events = TrackingEvent.objects.filter(
            fingerprint_hash=fingerprint_hash,
            case_id=case_id,
            timestamp__gte=timezone.now() - timedelta(hours=48)
        ).order_by('-timestamp')[:200]  # More events for criminal analysis
        
        for event in recent_events:
            history.append({
                'id': str(event.id),
                'timestamp': event.timestamp.isoformat(),
                'event_type': event.event_type,
                'page_url': event.page_url,
                'ip_address': event.ip_address,
                'is_vpn': event.is_vpn,
                'is_tor': event.is_tor,
                'is_proxy': event.is_proxy,
                'device_type': event.device_type,
                'browser': event.browser,
                'os': event.os,
                'city': event.ip_city,
                'country': event.ip_country,
                'time_on_page': event.time_on_page,
                'scroll_depth': event.scroll_depth,
                'user_agent': event.user_agent,
                'referrer_url': event.referrer_url,
                'event_data': event.event_data,
                'timezone': getattr(event, 'timezone', None),
            })
        
        # Cache for 10 minutes (shorter for criminal cases)
        if self.redis_available:
            self.redis_client.setex(cache_key, 600, json.dumps(history))
        else:
            cache.set(cache_key, history, 600)
        
        return history
    
    def store_criminal_analysis(self, fingerprint_hash: str, score: float, indicators: Dict) -> None:
        """Store enhanced analysis result for criminal pattern learning"""
        cache_key = f'criminal_analysis:{fingerprint_hash}'
        
        result = {
            'timestamp': timezone.now().isoformat(),
            'score': score,
            'threat_level': self._calculate_threat_level(score, indicators),
            'critical_indicators': [k for k, v in indicators.items() if isinstance(v, dict) and v.get('score', 0) >= 8.0],
            'all_indicators': [k for k, v in indicators.items() if isinstance(v, dict) and v.get('triggered')],
            'requires_attention': score >= 6.0,
            'law_enforcement_flag': score >= 8.0,
        }
        
        if self.redis_available:
            self.redis_client.lpush(cache_key, json.dumps(result))
            self.redis_client.ltrim(cache_key, 0, 199)  # Keep more history for criminal cases
            self.redis_client.expire(cache_key, 172800)  # Expire after 48 hours
        else:
            history = cache.get(cache_key, [])
            history.insert(0, result)
            cache.set(cache_key, history[:200], 172800)
    
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
    
    def create_criminal_activity_record(self, event: TrackingEvent, indicators: Dict, score: float) -> None:
        """Create enhanced criminal activity record"""
        # Determine primary criminal activity type
        activity_type = self._determine_criminal_activity_type(indicators)
        
        # Calculate threat level
        threat_level = self._calculate_threat_level(score, indicators)
        
        SuspiciousActivity.objects.create(
            case=event.case,
            session=event.session,
            session_identifier=event.session_identifier,
            fingerprint_hash=event.fingerprint_hash,
            ip_address=event.ip_address,
            activity_type=activity_type,
            severity_level=min(int(score), 5),
            confidence_score=score / 10.0,  # Convert to 0-1 scale
            details={
                'criminal_indicators': {k: v for k, v in indicators.items() if isinstance(v, dict) and v.get('triggered')},
                'criminal_score': score,
                'threat_level': threat_level,
                'event_id': str(event.id),
                'event_type': event.event_type,
                'page_url': event.page_url,
                'timestamp': event.timestamp.isoformat(),
                'law_enforcement_relevant': score >= 8.0,
            },
            evidence={
                'user_agent': event.user_agent,
                'referrer': event.referrer_url,
                'ip_details': {
                    'country': event.ip_country,
                    'city': event.ip_city,
                    'is_vpn': event.is_vpn,
                    'is_tor': event.is_tor,
                    'is_proxy': event.is_proxy,
                },
                'device_details': {
                    'browser': event.browser,
                    'os': event.os,
                    'device_type': event.device_type,
                },
                'behavioral_data': {
                    'time_on_page': event.time_on_page,
                    'scroll_depth': event.scroll_depth,
                    'event_data': event.event_data,
                }
            }
        )
    
    def create_law_enforcement_alert(self, event: TrackingEvent, indicators: Dict, score: float) -> None:
        """Create critical alert for law enforcement"""
        critical_indicators = [
            k for k, v in indicators.items() 
            if isinstance(v, dict) and v.get('triggered') and v.get('score', 0) >= 8.0
        ]
        
        Alert.objects.create(
            case=event.case,
            alert_type='criminal_suspect',
            priority='critical',
            title=f"🚨 CRITICAL: Potential Suspect Activity - Score: {score}/10",
            message=f"High-risk criminal behavior detected from user {event.fingerprint_hash[:16]}",
            fingerprint_hash=event.fingerprint_hash,
            data={
                'event_id': str(event.id),
                'criminal_score': score,
                'critical_indicators': critical_indicators,
                'ip_address': event.ip_address,
                'location': f"{event.ip_city}, {event.ip_country}" if event.ip_city else event.ip_country,
                'law_enforcement_priority': True,
                'evidence_preservation_required': True,
            },
            recommended_actions=[
                '🚨 IMMEDIATE: Contact law enforcement',
                '📋 Preserve all digital evidence',
                '🔒 Consider IP address blocking',
                '📞 Alert case investigators',
                '💾 Backup user activity logs',
                '🔍 Cross-reference with known suspects',
                '⚖️ Document for legal proceedings',
            ]
        )
    
    def _determine_criminal_activity_type(self, indicators: Dict) -> str:
        """Determine the primary criminal activity type"""
        # Priority order for criminal activity types
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