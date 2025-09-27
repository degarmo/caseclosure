from django.apps import AppConfig
from django.conf import settings


class TrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tracker'
    
    detection_system = None
    
    def ready(self):
        """Initialize the detection system when Django starts"""
        # Temporarily disabled for AWS deployment
        pass
        # from .detection_simple import create_simple_detection_system
        # self.detection_system = create_simple_detection_system()
        # TrackerConfig.detection_system = self.detection_system


# Helper function to get the detection system
def get_detection_system():
    """Get the initialized detection system"""
    # Temporarily return None while ML is disabled
    return None
    # from django.apps import apps
    # app_config = apps.get_app_config('tracker')
    # if hasattr(app_config, 'detection_system'):
    #     return app_config.detection_system
    # else:
    #     from .detection_simple import create_simple_detection_system
    #     return create_simple_detection_system()