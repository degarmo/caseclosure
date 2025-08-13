"""
Base Detector Class
Abstract base class that all detector modules inherit from
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class BaseDetector(ABC):
    """Abstract base class for all detector modules"""
    
    def __init__(self, services: 'ServiceContainer', config: Dict[str, Any] = None):
        """
        Initialize base detector with dependency injection
        
        Args:
            services: Container with all shared services
            config: Optional configuration overrides
        """
        self.services = services
        self.config = config or {}
        
        # Access shared services through the container
        self.redis_client = services.redis_client
        self.cache = services.cache
        self.database = services.database
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load configuration
        self.thresholds = self._load_thresholds()
        self.risk_weights = self._load_risk_weights()
        
        # Initialize detector-specific components
        self._initialize()
    
    @abstractmethod
    def _initialize(self) -> None:
        """Initialize detector-specific components"""
        pass
    
    @abstractmethod
    def analyze(self, event: Any, history: List[Dict] = None) -> Dict[str, Any]:
        """
        Main analysis method that each detector must implement
        
        Args:
            event: The event to analyze
            history: Optional historical events for context
            
        Returns:
            Dict containing analysis results with standard structure:
            {
                'triggered': bool,
                'score': float (0-10),
                'severity': int (1-5),
                'details': dict
            }
        """
        pass
    
    def _load_thresholds(self) -> Dict[str, Any]:
        """Load thresholds from configuration"""
        from .constants import THRESHOLDS
        
        # Allow config overrides
        thresholds = THRESHOLDS.copy()
        if 'thresholds' in self.config:
            thresholds.update(self.config['thresholds'])
        
        return thresholds
    
    def _load_risk_weights(self) -> Dict[str, float]:
        """Load risk weights from configuration"""
        from .constants import RISK_WEIGHTS
        
        # Allow config overrides
        weights = RISK_WEIGHTS.copy()
        if 'risk_weights' in self.config:
            weights.update(self.config['risk_weights'])
        
        return weights
    
    def get_user_history(self, fingerprint_hash: str, case_id: str, 
                        hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get user history from cache or database
        
        Args:
            fingerprint_hash: User's fingerprint hash
            case_id: Case identifier
            hours: How many hours of history to retrieve
            
        Returns:
            List of historical events
        """
        cache_key = f'history:{fingerprint_hash}:{case_id}:{hours}h'
        
        # Try cache first
        cached_history = self.services.get_cached_data(cache_key)
        if cached_history:
            return cached_history
        
        # Fetch from database
        history = self.services.database.get_user_history(
            fingerprint_hash, case_id, hours
        )
        
        # Cache for future use
        self.services.cache_data(cache_key, history, ttl=600)
        
        return history
    
    def create_result(self, triggered: bool = False, score: float = 0.0,
                     severity: int = 0, details: Dict = None) -> Dict[str, Any]:
        """
        Create a standardized result dictionary
        
        Args:
            triggered: Whether the detection was triggered
            score: Risk score (0-10)
            severity: Severity level (1-5)
            details: Additional details
            
        Returns:
            Standardized result dictionary
        """
        return {
            'triggered': triggered,
            'score': min(max(score, 0.0), 10.0),  # Ensure 0-10 range
            'severity': min(max(severity, 0), 5),   # Ensure 0-5 range
            'details': details or {},
            'detector': self.__class__.__name__,
            'timestamp': datetime.now().isoformat()
        }
    
    def log_detection(self, event_id: str, result: Dict[str, Any]) -> None:
        """
        Log detection result
        
        Args:
            event_id: Event identifier
            result: Detection result
        """
        if result['triggered']:
            self.logger.info(
                f"Detection triggered for event {event_id}: "
                f"Score={result['score']}, Severity={result['severity']}"
            )
            
            # Store in metrics system
            self.services.metrics.record_detection(
                detector=self.__class__.__name__,
                score=result['score'],
                severity=result['severity']
            )
    
    def validate_event(self, event: Any) -> bool:
        """
        Validate that event has required fields
        
        Args:
            event: Event to validate
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ['fingerprint_hash', 'ip_address', 'page_url', 'event_type']
        
        for field in required_fields:
            if not hasattr(event, field):
                self.logger.warning(f"Event missing required field: {field}")
                return False
        
        return True
    
    def calculate_weighted_score(self, indicators: Dict[str, float]) -> float:
        """
        Calculate weighted score from multiple indicators
        
        Args:
            indicators: Dict of indicator names to scores
            
        Returns:
            Weighted score (0-10)
        """
        total_score = 0.0
        total_weight = 0.0
        
        for indicator, score in indicators.items():
            weight = self.risk_weights.get(indicator, 1.0)
            total_score += score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        # Normalize to 0-10 scale
        normalized = (total_score / total_weight)
        return min(normalized, 10.0)


class ServiceContainer:
    """Container for dependency injection of shared services"""
    
    def __init__(self, redis_client=None, cache=None, database=None, 
                 metrics=None, config=None):
        """
        Initialize service container
        
        Args:
            redis_client: Redis client instance
            cache: Cache service instance
            database: Database service instance
            metrics: Metrics service instance
            config: Configuration dictionary
        """
        self.redis_client = redis_client
        self.cache = cache
        self.database = database
        self.metrics = metrics or MetricsService()
        self.config = config or {}
        
        # Validate services
        self._validate_services()
    
    def _validate_services(self) -> None:
        """Validate that required services are available"""
        if not self.database:
            raise ValueError("Database service is required")
        
        if not self.cache and not self.redis_client:
            logger.warning("No cache service available, performance may be impacted")
    
    def get_cached_data(self, key: str) -> Optional[Any]:
        """
        Get data from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached data or None
        """
        if self.redis_client:
            try:
                import json
                data = self.redis_client.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        
        if self.cache:
            return self.cache.get(key)
        
        return None
    
    def cache_data(self, key: str, data: Any, ttl: int = 3600) -> None:
        """
        Cache data
        
        Args:
            key: Cache key
            data: Data to cache
            ttl: Time to live in seconds
        """
        if self.redis_client:
            try:
                import json
                self.redis_client.setex(key, ttl, json.dumps(data))
                return
            except Exception as e:
                logger.error(f"Redis set error: {e}")
        
        if self.cache:
            self.cache.set(key, data, ttl)


class MetricsService:
    """Service for recording metrics"""
    
    def __init__(self):
        self.detections = []
        self.alerts = []
    
    def record_detection(self, detector: str, score: float, severity: int):
        """Record a detection event"""
        self.detections.append({
            'detector': detector,
            'score': score,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        })
    
    def record_alert(self, alert_type: str, priority: str):
        """Record an alert"""
        self.alerts.append({
            'type': alert_type,
            'priority': priority,
            'timestamp': datetime.now().isoformat()
        })
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get current statistics"""
        return {
            'total_detections': len(self.detections),
            'total_alerts': len(self.alerts),
            'avg_score': sum(d['score'] for d in self.detections) / len(self.detections) if self.detections else 0,
            'high_severity_count': sum(1 for d in self.detections if d['severity'] >= 4)
        }


class DatabaseService:
    """Abstract database service interface"""
    
    def get_user_history(self, fingerprint_hash: str, case_id: str, 
                         hours: int) -> List[Dict[str, Any]]:
        """Get user history from database"""
        # This would be implemented based on your actual database
        # For now, returning empty list as placeholder
        return []
    
    def save_detection(self, detection: Dict[str, Any]) -> None:
        """Save detection to database"""
        pass
    
    def save_alert(self, alert: Dict[str, Any]) -> None:
        """Save alert to database"""
        pass