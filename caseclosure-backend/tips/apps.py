from django.apps import AppConfig


class TipsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tips'

class TipsConfig(AppConfig):
    name = 'tips'
    def ready(self):
        import tips.signals
