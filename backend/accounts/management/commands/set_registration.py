from django.core.management.base import BaseCommand
from accounts.models import SiteSettings

class Command(BaseCommand):
    help = 'Set registration mode'

    def add_arguments(self, parser):
        parser.add_argument('mode', choices=['invite_only', 'open', 'closed'])

    def handle(self, *args, **options):
        settings = SiteSettings.get_settings()
        settings.registration_mode = options['mode']
        settings.save()
        self.stdout.write(
            self.style.SUCCESS(f'Registration mode set to: {options["mode"]}')
        )