# tasks.py
from celery import shared_task
from django.utils import timezone
from .models import SpotlightPost

@shared_task
def publish_scheduled_posts():
    """Run this task every minute to publish scheduled posts"""
    posts_to_publish = SpotlightPost.objects.filter(
        status='scheduled',
        scheduled_for__lte=timezone.now()
    )
    
    for post in posts_to_publish:
        post.status = 'published'
        post.published_at = timezone.now()
        post.save()
    
    return f"Published {posts_to_publish.count()} posts"