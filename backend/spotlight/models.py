# spotlight/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class SpotlightPost(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('published', 'Published'),
        ('archived', 'Archived'),
        ('flagged', 'Flagged'),
        ('removed', 'Removed'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('none', 'No special event'),
        ('birthday', 'Birthday'),
        ('anniversary', 'Anniversary'),
        ('wedding', 'Wedding'),
        ('graduation', 'Graduation'),
        ('memorial', 'Memorial Day'),
        ('achievement', 'Achievement'),
        ('holiday', 'Holiday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
        related_name='spotlight_posts'
    )
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()  # Store HTML content
    content_text = models.TextField(blank=True)  # Plain text for search
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Scheduling fields
    scheduled_for = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES, default='none', blank=True)
    recurring_yearly = models.BooleanField(default=False)
    last_recurring_post = models.DateTimeField(null=True, blank=True)
    parent_post = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='recurring_posts')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Engagement metrics
    views_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    
    # SEO and visibility
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    is_featured = models.BooleanField(default=False)
    
    # Additional fields
    case_name = models.CharField(max_length=255, blank=True)
    post_type = models.CharField(max_length=50, default='update')
    priority = models.CharField(max_length=20, default='medium')
    is_sensitive = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    
    # Moderation fields
    is_flagged = models.BooleanField(default=False)
    moderation_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
            models.Index(fields=['author', 'status']),
            models.Index(fields=['is_flagged', 'status']),
            models.Index(fields=['recurring_yearly', 'last_recurring_post']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-publish if scheduled time has passed
        if self.status == 'scheduled' and self.scheduled_for and self.scheduled_for <= timezone.now():
            self.status = 'published'
            self.published_at = timezone.now()
        
        # Update slug if not set
        if not self.slug:
            from django.utils.text import slugify
            if self.title:
                base_slug = slugify(self.title)[:50]
            else:
                base_slug = f"post-{str(self.id)[:8]}"
            
            # Ensure unique slug
            slug = base_slug
            counter = 1
            while SpotlightPost.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    def should_create_recurring_post(self):
        """Check if it's time to create a recurring post"""
        if not self.recurring_yearly or not self.scheduled_for:
            return False
        
        from datetime import timedelta
        now = timezone.now()
        
        # Check if we haven't created a recurring post this year yet
        current_year = now.year
        scheduled_month = self.scheduled_for.month
        scheduled_day = self.scheduled_for.day
        
        try:
            # Get this year's date for the recurring post
            this_years_date = self.scheduled_for.replace(year=current_year)
            
            # Check if the date has passed and we haven't created a post for this year
            if now >= this_years_date:
                if not self.last_recurring_post or self.last_recurring_post.year < current_year:
                    return True
        except ValueError:
            # Handle February 29 on non-leap years
            if scheduled_month == 2 and scheduled_day == 29:
                # Use February 28 for non-leap years
                this_years_date = self.scheduled_for.replace(year=current_year, day=28)
                if now >= this_years_date:
                    if not self.last_recurring_post or self.last_recurring_post.year < current_year:
                        return True
        
        return False
    
    def create_recurring_post(self):
        """Create a new post for this year's recurrence"""
        if not self.recurring_yearly:
            return None
        
        from datetime import datetime
        current_year = timezone.now().year
        
        try:
            new_scheduled_date = self.scheduled_for.replace(year=current_year)
        except ValueError:
            # Handle February 29 on non-leap years
            new_scheduled_date = self.scheduled_for.replace(year=current_year, day=28)
        
        # Create a copy of this post
        new_post = SpotlightPost.objects.create(
            author=self.author,
            title=self.title,
            content=self.content,
            content_text=self.content_text,
            status='published' if new_scheduled_date <= timezone.now() else 'scheduled',
            scheduled_for=new_scheduled_date,
            published_at=timezone.now() if new_scheduled_date <= timezone.now() else None,
            event_type=self.event_type,
            recurring_yearly=False,  # The copy is not recurring
            parent_post=self,  # Reference to the original recurring post
            case_name=self.case_name,
            post_type=self.post_type,
            priority=self.priority,
            is_sensitive=self.is_sensitive,
            tags=self.tags,
        )
        
        # Copy media files
        for media in self.media.all():
            SpotlightMedia.objects.create(
                post=new_post,
                file=media.file,
                media_type=media.media_type,
                caption=media.caption,
                order=media.order,
            )
        
        # Update the last recurring post date
        self.last_recurring_post = timezone.now()
        self.save(update_fields=['last_recurring_post'])
        
        return new_post

class SpotlightMedia(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(SpotlightPost, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to='spotlight/%Y/%m/%d/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    caption = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Image metadata
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['order', 'uploaded_at']

class SpotlightLike(models.Model):
    post = models.ForeignKey(SpotlightPost, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'user']

class SpotlightComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(SpotlightPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']

class SpotlightFlag(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate Content'),
        ('harassment', 'Harassment'),
        ('misinformation', 'Misinformation'),
        ('copyright', 'Copyright Violation'),
        ('hate_speech', 'Hate Speech'),
        ('violence', 'Violence'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(SpotlightPost, on_delete=models.CASCADE, related_name='flags')
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flags_reported'
    )
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='flags_resolved'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.CharField(max_length=50, blank=True)
    
    class Meta:
        unique_together = ['post', 'reported_by']
        ordering = ['-created_at']

class UserViolation(models.Model):
    VIOLATION_TYPES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('hate_speech', 'Hate Speech'),
        ('misinformation', 'Misinformation'),
        ('ban_evasion', 'Ban Evasion'),
        ('multiple_violations', 'Multiple Violations'),
        ('other', 'Other'),
    ]
    
    ACTION_CHOICES = [
        ('warning', 'Warning'),
        ('content_removal', 'Content Removal'),
        ('temporary_suspension', 'Temporary Suspension'),
        ('permanent_ban', 'Permanent Ban'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='violations'
    )
    violation_type = models.CharField(max_length=30, choices=VIOLATION_TYPES)
    description = models.TextField()
    related_post = models.ForeignKey(
        SpotlightPost, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    action_taken = models.CharField(max_length=30, choices=ACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='violations_created'
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']

class SpotlightSettings(models.Model):
    """Singleton model for Spotlight settings"""
    auto_moderation_enabled = models.BooleanField(default=True)
    spam_keywords = models.JSONField(default=list)
    blocked_domains = models.JSONField(default=list)
    min_account_age_days = models.PositiveIntegerField(default=1)
    max_posts_per_hour = models.PositiveIntegerField(default=10)
    max_posts_per_day = models.PositiveIntegerField(default=50)
    require_case_association = models.BooleanField(default=False)
    require_email_verification = models.BooleanField(default=True)
    community_guidelines = models.TextField(blank=True)
    profanity_filter_enabled = models.BooleanField(default=True)
    ai_moderation_enabled = models.BooleanField(default=False)
    trust_score_threshold = models.IntegerField(default=0)
    
    class Meta:
        verbose_name_plural = "Spotlight Settings"
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj