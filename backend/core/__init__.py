try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery is optional for local development.
    # With CELERY_ALWAYS_EAGER=True, tasks run synchronously without it.
    celery_app = None
    __all__ = ()