import logging
from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)


class TrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tracker'

    detection_system = None

    def ready(self):
        """Initialize the ML detection system when Django starts."""
        import os
        # Skip during test collection, migrations, and other non-server commands
        # to keep startup fast.
        skip_cmds = {'migrate', 'makemigrations', 'collectstatic', 'test',
                     'shell', 'dbshell', 'check', 'inspectdb', 'showmigrations'}
        import sys
        if any(cmd in sys.argv for cmd in skip_cmds):
            return

        try:
            from .detection_simple import create_simple_detection_system
            self.detection_system = create_simple_detection_system()
            TrackerConfig.detection_system = self.detection_system
            logger.info("ML detection system initialized successfully.")
        except Exception as exc:
            # Never let ML init crash the web server.
            logger.warning(
                f"ML detection system failed to initialize (ML will be skipped): {exc}"
            )
            TrackerConfig.detection_system = None


# Helper function to get the detection system
def get_detection_system():
    """Return the initialized detection system, or None if unavailable."""
    from django.apps import apps
    try:
        app_config = apps.get_app_config('tracker')
        if getattr(app_config, 'detection_system', None) is not None:
            return app_config.detection_system
        # Lazy init: if app_config.detection_system is None we try once more
        # (handles reload edge-cases on dev server).
        from .detection_simple import create_simple_detection_system
        system = create_simple_detection_system()
        app_config.detection_system = system
        TrackerConfig.detection_system = system
        return system
    except Exception as exc:
        logger.warning(f"get_detection_system() failed: {exc}")
        return None