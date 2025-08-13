"""
Detector Facade Class
Main interface that coordinates all detection modules
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

from .base_detector import ServiceContainer
from .criminal_indicators import CriminalIndicatorDetector
from .evasion_detector import EvasionDetector
from .temporal_analyzer import TemporalAnalyzer
from .behavioral_patterns import BehavioralPatternDetector
from .content_forensics import ContentForensicsAnalyzer
from .biometric_profiler import BiometricProfiler
from .network_analyzer import NetworkAnalyzer
from .environmental_analyzer import EnvironmentalAnalyzer
from .psychological_detector import PsychologicalDetector
from .honeytrap_manager import HoneytrapManager
from .session_analyzer import SessionAnalyzer
from .alert_manager import AlertManager
from .detector_utils import DetectorUtils

logger = logging.getLogger(__name__)


class CriminalDetectionSystem:
    """
    Facade class that provides a unified interface to all detection modules
    """
    
    def __init__(self, services: ServiceContainer, config: Dict[str, Any] = None):
        """
        Initialize the criminal detection system
        
        Args:
            services: Container with all shared services
            config: Optional configuration overrides
        """
        self.services = services
        self.config = config or {}
        self.utils = DetectorUtils()
        
        # Initialize all detector modules
        self._initialize_detectors()
        
        # Initialize alert manager
        self.alert_manager = AlertManager(self)
        
        # Configuration
        self.parallel_execution = self.config.get('parallel_execution', True)
        self.max_workers = self.config.get('max_workers', 10)
        
        logger.info("Criminal Detection System initialized")
    
    def _initialize_detectors(self) -> None:
        """Initialize all detector modules with dependency injection"""
        
        # Core detectors
        self.criminal_detector = CriminalIndicatorDetector(self.services, self.config)
        self.evasion_detector = EvasionDetector(self.services, self.config)
        self.temporal_analyzer = TemporalAnalyzer(self.services, self.config)
        self.behavioral_detector = BehavioralPatternDetector(self.services, self.config)
        
        # Specialized detectors
        self.content_analyzer = ContentForensicsAnalyzer(self.services, self.config)
        self.biometric_profiler = BiometricProfiler(self.services, self.config)
        self.network_analyzer = NetworkAnalyzer(self.services, self.config)
        self.environmental_analyzer = EnvironmentalAnalyzer(self.services, self.config)
        self.psychological_detector = PsychologicalDetector(self.services, self.config)
        
        # Security detectors
        self.honeytrap_manager = HoneytrapManager(self.services, self.config)
        self.session_analyzer = SessionAnalyzer(self.services, self.config)
        
        # Store all detectors for iteration
        self.detectors = {
            'criminal': self.criminal_detector,
            'evasion': self.evasion_detector,
            'temporal': self.temporal_analyzer,
            'behavioral': self.behavioral_detector,
            'content': self.content_analyzer,
            'biometric': self.biometric_profiler,
            'network': self.network_analyzer,
            'environmental': self.environmental_analyzer,
            'psychological': self.psychological_detector,
            'honeytrap': self.honeytrap_manager,
            'session': self.session_analyzer,
        }
    
    def analyze_event(self, event: Any, comprehensive: bool = False) -> Dict[str, Any]:
        """
        Analyze a single event through all relevant detectors
        
        Args:
            event: The event to analyze
            comprehensive: If True, run all detectors; if False, use smart selection
            
        Returns:
            Comprehensive analysis results
        """
        start_time = datetime.now()
        
        # Validate event
        if not self._validate_event(event):
            return self._create_error_result("Invalid event format")
        
        # Get user history
        history = self._get_user_history(event)
        
        # Determine which detectors to run
        detectors_to_run = self._select_detectors(event, comprehensive)
        
        # Run detections
        if self.parallel_execution:
            results = self._run_parallel_detection(event, history, detectors_to_run)
        else:
            results = self._run_sequential_detection(event, history, detectors_to_run)
        
        # Aggregate results
        aggregated = self._aggregate_results(results)
        
        # Calculate final score
        final_score = self._calculate_final_score(aggregated)
        
        # Determine if alerts are needed
        self._process_alerts(event, aggregated, final_score)
        
        # Record metrics
        execution_time = (datetime.now() - start_time).total_seconds()
        self._record_metrics(event, aggregated, final_score, execution_time)
        
        return {
            'event_id': str(event.id) if hasattr(event, 'id') else None,
            'fingerprint_hash': event.fingerprint_hash,
            'timestamp': datetime.now().isoformat(),
            'criminal_score': final_score,
            'threat_level': self._determine_threat_level(final_score),
            'detections': aggregated,
            'recommended_actions': self._generate_recommendations(aggregated, final_score),
            'execution_time': execution_time,
            'detectors_run': list(detectors_to_run.keys())
        }
    
    def analyze_batch(self, events: List[Any]) -> List[Dict[str, Any]]:
        """
        Analyze multiple events in batch
        
        Args:
            events: List of events to analyze
            
        Returns:
            List of analysis results
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.analyze_event, event): event 
                      for event in events}
            
            for future in as_completed(futures):
                try:
                    result = future.result(timeout=30)
                    results.append(result)
                except Exception as e:
                    logger.error(f"Batch analysis error: {e}")
                    results.append(self._create_error_result(str(e)))
        
        return results
    
    def get_user_profile(self, fingerprint_hash: str, case_id: str) -> Dict[str, Any]:
        """
        Get comprehensive user profile based on all historical activity
        
        Args:
            fingerprint_hash: User's fingerprint hash
            case_id: Case identifier
            
        Returns:
            Comprehensive user profile
        """
        # Get extended history
        history = self.services.database.get_user_history(
            fingerprint_hash, case_id, hours=720  # 30 days
        )
        
        if not history:
            return {'error': 'No history found for user'}
        
        profile = {
            'fingerprint_hash': fingerprint_hash,
            'case_id': case_id,
            'total_events': len(history),
            'first_seen': history[-1]['timestamp'] if history else None,
            'last_seen': history[0]['timestamp'] if history else None,
            'risk_profile': {},
            'behavioral_patterns': {},
            'network_indicators': {},
            'psychological_profile': {}
        }
        
        # Analyze patterns across history
        profile['risk_profile'] = self._analyze_risk_profile(history)
        profile['behavioral_patterns'] = self._analyze_behavioral_patterns(history)
        profile['network_indicators'] = self._analyze_network_indicators(history)
        profile['psychological_profile'] = self._analyze_psychological_profile(history)
        
        # Calculate overall risk score
        profile['overall_risk_score'] = self._calculate_profile_risk_score(profile)
        
        return profile
    
    def deploy_honeytrap(self, case_id: str, trap_type: str) -> Dict[str, Any]:
        """
        Deploy a new honeytrap for a case
        
        Args:
            case_id: Case identifier
            trap_type: Type of honeytrap to deploy
            
        Returns:
            Honeytrap deployment details
        """
        return self.honeytrap_manager.deploy_dynamic_honeytrap(case_id, trap_type)
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """
        Get overall system statistics
        
        Returns:
            System statistics and metrics
        """
        return {
            'metrics': self.services.metrics.get_statistics(),
            'active_detectors': list(self.detectors.keys()),
            'cache_status': self._get_cache_status(),
            'alert_statistics': self.alert_manager.get_alert_statistics('all'),
            'system_health': self._check_system_health()
        }
    
    # Private helper methods
    
    def _validate_event(self, event: Any) -> bool:
        """Validate event has required fields"""
        required_fields = ['fingerprint_hash', 'ip_address', 'page_url', 'event_type']
        
        for field in required_fields:
            if not hasattr(event, field):
                logger.warning(f"Event missing required field: {field}")
                return False
        
        return True
    
    def _get_user_history(self, event: Any) -> List[Dict[str, Any]]:
        """Get user history for context"""
        return self.services.database.get_user_history(
            event.fingerprint_hash,
            event.case_id if hasattr(event, 'case_id') else 'unknown',
            hours=48
        )
    
    def _select_detectors(self, event: Any, comprehensive: bool) -> Dict[str, Any]:
        """Select which detectors to run based on event type"""
        if comprehensive:
            return self.detectors
        
        # Smart selection based on event type
        selected = {}
        
        # Always run core detectors for criminal cases
        selected['criminal'] = self.detectors['criminal']
        selected['evasion'] = self.detectors['evasion']
        
        # Add specific detectors based on event type
        event_type = event.event_type.lower()
        
        if 'search' in event_type:
            selected['content'] = self.detectors['content']
        
        if 'mouse' in event_type or 'typing' in event_type:
            selected['biometric'] = self.detectors['biometric']
        
        if event.is_tor or event.is_vpn:
            selected['network'] = self.detectors['network']
        
        if 'login' in event_type or 'session' in event_type:
            selected['session'] = self.detectors['session']
        
        # Add behavioral analysis for extended sessions
        if hasattr(event, 'time_on_page') and event.time_on_page > 60:
            selected['behavioral'] = self.detectors['behavioral']
            selected['psychological'] = self.detectors['psychological']
        
        return selected
    
    def _run_parallel_detection(self, event: Any, history: List[Dict], 
                               detectors: Dict[str, Any]) -> Dict[str, Any]:
        """Run detectors in parallel"""
        results = {}
        
        with ThreadPoolExecutor(max_workers=min(len(detectors), self.max_workers)) as executor:
            futures = {}
            
            for name, detector in detectors.items():
                future = executor.submit(self._run_single_detector, detector, event, history)
                futures[future] = name
            
            for future in as_completed(futures):
                name = futures[future]
                try:
                    result = future.result(timeout=10)
                    results[name] = result
                except Exception as e:
                    logger.error(f"Detector {name} failed: {e}")
                    results[name] = {'triggered': False, 'error': str(e)}
        
        return results
    
    def _run_sequential_detection(self, event: Any, history: List[Dict], 
                                 detectors: Dict[str, Any]) -> Dict[str, Any]:
        """Run detectors sequentially"""
        results = {}
        
        for name, detector in detectors.items():
            try:
                results[name] = self._run_single_detector(detector, event, history)
            except Exception as e:
                logger.error(f"Detector {name} failed: {e}")
                results[name] = {'triggered': False, 'error': str(e)}
        
        return results
    
    def _run_single_detector(self, detector: Any, event: Any, 
                           history: List[Dict]) -> Dict[str, Any]:
        """Run a single detector"""
        # Different detectors have different method signatures
        detector_name = detector.__class__.__name__
        
        if hasattr(detector, 'analyze'):
            return detector.analyze(event, history)
        elif hasattr(detector, 'check_honey_trap_interaction'):
            return detector.check_honey_trap_interaction(event)
        elif hasattr(detector, 'analyze_criminal_behavior'):
            return detector.analyze_criminal_behavior(event)
        else:
            # Fallback for detectors with custom methods
            return {'triggered': False, 'error': 'Incompatible detector interface'}
    
    def _aggregate_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregate results from all detectors"""
        aggregated = {
            'triggered_detectors': [],
            'total_score': 0.0,
            'max_score': 0.0,
            'critical_indicators': [],
            'all_details': {}
        }
        
        for name, result in results.items():
            if result.get('triggered'):
                aggregated['triggered_detectors'].append(name)
                
                score = result.get('score', 0.0)
                aggregated['total_score'] += score
                aggregated['max_score'] = max(aggregated['max_score'], score)
                
                if score >= 8.0:
                    aggregated['critical_indicators'].append({
                        'detector': name,
                        'score': score,
                        'details': result.get('details', {})
                    })
            
            aggregated['all_details'][name] = result
        
        return aggregated
    
    def _calculate_final_score(self, aggregated: Dict[str, Any]) -> float:
        """Calculate final criminal score"""
        if not aggregated['triggered_detectors']:
            return 0.0
        
        # Use maximum score if any critical indicator
        if aggregated['max_score'] >= 9.0:
            return aggregated['max_score']
        
        # Otherwise, use weighted average with escalation
        base_score = aggregated['total_score'] / len(self.detectors)
        
        # Apply escalation factor for multiple detections
        escalation_factor = 1.0 + (len(aggregated['triggered_detectors']) - 1) * 0.1
        
        final_score = min(base_score * escalation_factor, 10.0)
        
        return round(final_score, 1)
    
    def _determine_threat_level(self, score: float) -> str:
        """Determine threat level from score"""
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
    
    def _process_alerts(self, event: Any, aggregated: Dict[str, Any], 
                       score: float) -> None:
        """Process and send alerts based on detection results"""
        if score >= 8.0:
            # Critical alert for law enforcement
            self.alert_manager.create_law_enforcement_alert(
                event, aggregated['all_details'], score
            )
        elif score >= 6.0:
            # Create criminal activity record
            self.alert_manager.create_criminal_activity_record(
                event, aggregated['all_details'], score
            )
        
        # Check for specific critical indicators
        for indicator in aggregated['critical_indicators']:
            if 'evidence_tampering' in str(indicator['details']):
                self.alert_manager.create_tampering_alert(
                    event, 'evidence_tampering'
                )
    
    def _generate_recommendations(self, aggregated: Dict[str, Any], 
                                 score: float) -> List[str]:
        """Generate recommended actions based on results"""
        recommendations = []
        
        if score >= 8.0:
            recommendations.append("🚨 IMMEDIATE: Contact law enforcement")
            recommendations.append("📋 Preserve all digital evidence")
        
        if score >= 6.0:
            recommendations.append("🔍 Initiate detailed investigation")
            recommendations.append("📊 Monitor user continuously")
        
        if 'evasion' in aggregated['triggered_detectors']:
            recommendations.append("🔒 Implement additional tracking measures")
        
        if 'honeytrap' in aggregated['triggered_detectors']:
            recommendations.append("🎯 User triggered honeytrap - confirmed malicious")
        
        if 'psychological' in aggregated['triggered_detectors']:
            recommendations.append("⚠️ Monitor for escalation patterns")
        
        return recommendations
    
    def _record_metrics(self, event: Any, aggregated: Dict[str, Any], 
                       score: float, execution_time: float) -> None:
        """Record metrics for monitoring"""
        self.services.metrics.record_detection(
            detector='facade',
            score=score,
            severity=min(int(score / 2), 5)
        )
        
        # Log slow executions
        if execution_time > 5.0:
            logger.warning(f"Slow detection: {execution_time}s for event {event.id}")
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Create error result"""
        return {
            'error': error_message,
            'timestamp': datetime.now().isoformat(),
            'criminal_score': 0.0,
            'threat_level': 'ERROR'
        }
    
    def _get_cache_status(self) -> Dict[str, Any]:
        """Get cache service status"""
        return {
            'redis_available': bool(self.services.redis_client),
            'cache_available': bool(self.services.cache)
        }
    
    def _check_system_health(self) -> Dict[str, Any]:
        """Check overall system health"""
        return {
            'status': 'healthy',
            'detectors_loaded': len(self.detectors),
            'services_available': {
                'redis': bool(self.services.redis_client),
                'cache': bool(self.services.cache),
                'database': bool(self.services.database)
            }
        }
    
    def _analyze_risk_profile(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze risk profile from history"""
        # Implementation would analyze patterns in history
        return {'risk_level': 'medium', 'confidence': 0.75}
    
    def _analyze_behavioral_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze behavioral patterns from history"""
        return {'pattern_type': 'investigative', 'consistency': 0.8}
    
    def _analyze_network_indicators(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze network indicators from history"""
        return {'vpn_usage': 0.3, 'tor_usage': 0.0, 'proxy_usage': 0.1}
    
    def _analyze_psychological_profile(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze psychological profile from history"""
        return {'stress_level': 'moderate', 'obsession_score': 6.5}
    
    def _calculate_profile_risk_score(self, profile: Dict[str, Any]) -> float:
        """Calculate overall risk score from profile"""
        # Aggregate various profile aspects
        return 5.5  # Placeholder