"""
Detector Factory
Factory pattern for creating and configuring detector instances
"""

from typing import Dict, Any, Optional, Type
import logging
import redis
from django.core.cache import cache

from .base_detector import ServiceContainer, DatabaseService, MetricsService
from .detector_facade import CriminalDetectionSystem

logger = logging.getLogger(__name__)


class DetectorFactory:
    """Factory for creating detector instances with proper configuration"""
    
    @staticmethod
    def create_detection_system(
        redis_host: str = 'localhost',
        redis_port: int = 6379,
        redis_db: int = 0,
        use_django_cache: bool = True,
        database_service: Optional[DatabaseService] = None,
        config: Dict[str, Any] = None
    ) -> CriminalDetectionSystem:
        """
        Create a fully configured Criminal Detection System
        
        Args:
            redis_host: Redis server host
            redis_port: Redis server port
            redis_db: Redis database number
            use_django_cache: Whether to use Django's cache
            database_service: Database service instance
            config: Configuration overrides
            
        Returns:
            Configured CriminalDetectionSystem instance
        """
        # Create service container
        services = DetectorFactory._create_service_container(
            redis_host, redis_port, redis_db,
            use_django_cache, database_service
        )
        
        # Create and return detection system
        return CriminalDetectionSystem(services, config)
    
    @staticmethod
    def create_standalone_detector(
        detector_class: Type,
        redis_client: Optional[redis.Redis] = None,
        cache_service: Optional[Any] = None,
        database_service: Optional[DatabaseService] = None,
        config: Dict[str, Any] = None
    ) -> Any:
        """
        Create a standalone detector instance
        
        Args:
            detector_class: The detector class to instantiate
            redis_client: Optional Redis client
            cache_service: Optional cache service
            database_service: Optional database service
            config: Configuration overrides
            
        Returns:
            Configured detector instance
        """
        # Create minimal service container
        services = ServiceContainer(
            redis_client=redis_client,
            cache=cache_service,
            database=database_service or DummyDatabaseService(),
            metrics=MetricsService()
        )
        
        # Create and return detector
        return detector_class(services, config)
    
    @staticmethod
    def _create_service_container(
        redis_host: str,
        redis_port: int,
        redis_db: int,
        use_django_cache: bool,
        database_service: Optional[DatabaseService]
    ) -> ServiceContainer:
        """Create and configure service container"""
        
        # Initialize Redis client
        redis_client = None
        try:
            redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True
            )
            # Test connection
            redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            redis_client = None
        
        # Initialize cache service
        cache_service = cache if use_django_cache else None
        
        # Initialize database service
        if not database_service:
            # Try to create default database service
            database_service = DetectorFactory._create_database_service()
        
        # Initialize metrics service
        metrics_service = MetricsService()
        
        # Create and return container
        return ServiceContainer(
            redis_client=redis_client,
            cache=cache_service,
            database=database_service,
            metrics=metrics_service
        )
    
    @staticmethod
    def _create_database_service() -> DatabaseService:
        """Create default database service"""
        try:
            # Try to import Django models
            from .models import TrackingEvent
            return DjangoDatabaseService()
        except ImportError:
            logger.warning("Django models not available, using dummy database service")
            return DummyDatabaseService()


class DjangoDatabaseService(DatabaseService):
    """Database service implementation using Django ORM"""
    
    def get_user_history(self, fingerprint_hash: str, case_id: str, 
                         hours: int) -> List[Dict[str, Any]]:
        """Get user history from Django database"""
        from django.utils import timezone
        from datetime import timedelta
        from .models import TrackingEvent
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        events = TrackingEvent.objects.filter(
            fingerprint_hash=fingerprint_hash,
            case_id=case_id,
            timestamp__gte=cutoff_time
        ).order_by('-timestamp')[:500]
        
        history = []
        for event in events:
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
            })
        
        return history
    
    def save_detection(self, detection: Dict[str, Any]) -> None:
        """Save detection to Django database"""
        from .models import SuspiciousActivity
        
        SuspiciousActivity.objects.create(
            fingerprint_hash=detection.get('fingerprint_hash'),
            activity_type=detection.get('activity_type', 'unknown'),
            severity_level=detection.get('severity_level', 1),
            confidence_score=detection.get('confidence_score', 0.0),
            details=detection.get('details', {}),
            evidence=detection.get('evidence', {})
        )
    
    def save_alert(self, alert: Dict[str, Any]) -> None:
        """Save alert to Django database"""
        from .models import Alert
        
        Alert.objects.create(
            alert_type=alert.get('type'),
            priority=alert.get('priority'),
            title=alert.get('title'),
            message=alert.get('message'),
            fingerprint_hash=alert.get('fingerprint_hash'),
            data=alert.get('data', {}),
            recommended_actions=alert.get('recommended_actions', [])
        )


class DummyDatabaseService(DatabaseService):
    """Dummy database service for testing"""
    
    def get_user_history(self, fingerprint_hash: str, case_id: str, 
                         hours: int) -> List[Dict[str, Any]]:
        """Return empty history"""
        logger.debug(f"Dummy database: get_user_history called for {fingerprint_hash}")
        return []
    
    def save_detection(self, detection: Dict[str, Any]) -> None:
        """Log detection instead of saving"""
        logger.info(f"Dummy database: Detection would be saved: {detection.get('activity_type')}")
    
    def save_alert(self, alert: Dict[str, Any]) -> None:
        """Log alert instead of saving"""
        logger.info(f"Dummy database: Alert would be saved: {alert.get('type')}")


class ConfigurationManager:
    """Manage detector configuration"""
    
    @staticmethod
    def load_config(config_path: str = None) -> Dict[str, Any]:
        """
        Load configuration from file or environment
        
        Args:
            config_path: Optional path to configuration file
            
        Returns:
            Configuration dictionary
        """
        import os
        import json
        
        config = {
            'parallel_execution': True,
            'max_workers': 10,
            'thresholds': {},
            'risk_weights': {},
            'cache_ttl': 600,
            'alert_settings': {
                'email_enabled': False,
                'sms_enabled': False,
                'dashboard_enabled': True
            }
        }
        
        # Load from file if provided
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        
        # Override with environment variables
        env_overrides = {
            'parallel_execution': os.environ.get('DETECTOR_PARALLEL', 'true').lower() == 'true',
            'max_workers': int(os.environ.get('DETECTOR_MAX_WORKERS', '10')),
            'cache_ttl': int(os.environ.get('DETECTOR_CACHE_TTL', '600'))
        }
        
        config.update({k: v for k, v in env_overrides.items() if v is not None})
        
        return config
    
    @staticmethod
    def validate_config(config: Dict[str, Any]) -> bool:
        """
        Validate configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if valid, raises exception otherwise
        """
        required_keys = ['parallel_execution', 'max_workers']
        
        for key in required_keys:
            if key not in config:
                raise ValueError(f"Missing required configuration key: {key}")
        
        if config['max_workers'] < 1:
            raise ValueError("max_workers must be at least 1")
        
        return True


# Example usage functions

def create_default_system() -> CriminalDetectionSystem:
    """Create detection system with default configuration"""
    config = ConfigurationManager.load_config()
    return DetectorFactory.create_detection_system(config=config)


def create_test_system() -> CriminalDetectionSystem:
    """Create detection system for testing (no external dependencies)"""
    config = {
        'parallel_execution': False,
        'max_workers': 1
    }
    
    return DetectorFactory.create_detection_system(
        redis_host='localhost',
        redis_port=6379,
        use_django_cache=False,
        database_service=DummyDatabaseService(),
        config=config
    )


def create_production_system(
    redis_host: str,
    redis_port: int,
    database_service: DatabaseService
) -> CriminalDetectionSystem:
    """Create production-ready detection system"""
    config = ConfigurationManager.load_config('/etc/detector/config.json')
    
    return DetectorFactory.create_detection_system(
        redis_host=redis_host,
        redis_port=redis_port,
        use_django_cache=True,
        database_service=database_service,
        config=config
    )