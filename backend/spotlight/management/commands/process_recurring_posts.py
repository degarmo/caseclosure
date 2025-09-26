# /backend/spotlight/management/commands/process_recurring_posts.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from spotlight.models import SpotlightPost
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process recurring Spotlight posts and publish scheduled posts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the command without creating posts',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed information',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        verbose = options.get('verbose', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No posts will be created or modified'))
        
        # Process scheduled posts that should be published now
        published_count = self.process_scheduled_posts(dry_run, verbose)
        
        # Process recurring posts
        recurring_count = self.process_recurring_posts(dry_run, verbose)
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary:\n'
                f'- Published {published_count} scheduled posts\n'
                f'- Created {recurring_count} recurring posts'
            )
        )
    
    def process_scheduled_posts(self, dry_run=False, verbose=False):
        """Publish scheduled posts whose time has come"""
        now = timezone.now()
        
        # Find scheduled posts that should be published
        scheduled_posts = SpotlightPost.objects.filter(
            status='scheduled',
            scheduled_for__lte=now
        )
        
        if verbose:
            self.stdout.write(f'Found {scheduled_posts.count()} scheduled posts to publish