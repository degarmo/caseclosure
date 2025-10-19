# cases/models.py - Complete model file with City and State fields added

import uuid
import os
import json
import secrets
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils.text import slugify
from django.utils import timezone

def case_logo_upload_path(instance, filename):
    """Generate unique path for case logos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('case_logos', filename)

def case_photo_upload_path(instance, filename):
    """Generate unique path for case photos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('cases', str(instance.id), 'photos', filename)

def spotlight_photo_upload_path(instance, filename):
    """Generate unique path for spotlight post photos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('cases', str(instance.case.id), 'spotlight', filename)

def generate_leo_invite_code():
    """Generate a unique 12-character invite code for LEO invitations"""
    return secrets.token_hex(6).upper()


class TemplateRegistry(models.Model):
    """
    Registry of available templates and their UNIQUE schemas.
    Each template can have completely different customizable sections!
    """
    template_id = models.CharField(
        max_length=50, 
        primary_key=True,
        help_text="Unique identifier like 'beacon', 'justice', 'legacy'"
    )
    name = models.CharField(max_length=100)
    description = models.TextField()
    version = models.CharField(max_length=20, default='1.0.0')
    
    schema = models.JSONField(
        default=dict,
        help_text="UNIQUE schema for this template defining customizable sections"
    )
    
    components = models.JSONField(
        default=dict,
        help_text="Maps section names to React component paths"
    )
    
    preview_image = models.URLField(blank=True, null=True)
    thumbnail_image = models.URLField(blank=True, null=True)
    
    features = models.JSONField(
        default=list,
        help_text="List of features: ['spotlight', 'guestbook', 'timeline', 'donation']"
    )
    
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'template_registry'
        ordering = ['name']
        verbose_name_plural = 'Template registries'
    
    def __str__(self):
        return f"{self.name} ({self.template_id})"


class Case(models.Model):
    """Main case model - each case is a website instance"""
    
    # User relationship
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
        related_name="cases"
    )
    
    # Template selection
    template_id = models.CharField(
        max_length=50, 
        default='beacon',
        help_text='Selected template design'
    )
    
    template_version = models.CharField(
        max_length=20, 
        default='1.0.0',
        help_text='Template version for compatibility'
    )
    
    template_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Stores all template-specific customizations"
    )
    
    # Basic case information
    case_title = models.CharField(
        max_length=200, 
        help_text="Title for the case/website"
    )
    
    # Victim/Person Information
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100, blank=True)
    
    date_of_birth = models.DateField(blank=True, null=True)
    date_of_death = models.DateField(blank=True, null=True)
    date_missing = models.DateField(blank=True, null=True)
    
    # Physical Description
    age = models.IntegerField(blank=True, null=True)
    height_feet = models.IntegerField(blank=True, null=True)
    height_inches = models.IntegerField(blank=True, null=True)
    weight = models.IntegerField(blank=True, null=True, help_text="Weight in pounds")
    race = models.CharField(max_length=50, blank=True)
    sex = models.CharField(
        max_length=20, 
        blank=True,
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('other', 'Other')
        ]
    )
    hair_color = models.CharField(max_length=50, blank=True)
    eye_color = models.CharField(max_length=50, blank=True)
    distinguishing_features = models.TextField(blank=True)
    
    # Main photo
    primary_photo = models.ImageField(
        upload_to=case_photo_upload_path, 
        blank=True, 
        null=True
    )
    
    # Case Details
    case_number = models.CharField(max_length=100, blank=True)
    case_type = models.CharField(
        max_length=50,
        choices=[
            ('missing', 'Missing Person'),
            ('homicide', 'Homicide'),
            ('unidentified', 'Unidentified'),
            ('cold_case', 'Cold Case'),
            ('other', 'Other')
        ],
        default='missing'
    )
    
    crime_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Alias for case_type for backward compatibility"
    )
    
    incident_date = models.DateField(blank=True, null=True)
    incident_location = models.CharField(max_length=255, blank=True)
    
    # NEW FIELDS: City and State for incident location
    incident_city = models.CharField(
        max_length=100, 
        blank=True,
        help_text="City where the incident occurred"
    )
    incident_state = models.CharField(
        max_length=50, 
        blank=True,
        help_text="State/Province where the incident occurred"
    )
    
    last_seen_location = models.CharField(max_length=255, blank=True)
    last_seen_date = models.DateField(blank=True, null=True)
    last_seen_time = models.TimeField(blank=True, null=True)
    last_seen_wearing = models.TextField(blank=True)
    last_seen_with = models.TextField(blank=True)
    planned_activities = models.TextField(blank=True)
    transportation_details = models.TextField(blank=True)
    
    # Investigation Details
    investigating_agency = models.CharField(max_length=255, blank=True)
    detective_name = models.CharField(max_length=255, blank=True)
    detective_phone = models.CharField(max_length=50, blank=True)
    detective_email = models.EmailField(blank=True)
    
    # Reward Information
    reward_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    reward_details = models.TextField(blank=True)
    
    # Story/Description
    description = models.TextField(
        blank=True, 
        help_text="Main story or case description"
    )
    
    # Domain Configuration
    subdomain = models.SlugField(
        max_length=50, 
        unique=True, 
        blank=True, 
        null=True,
        validators=[
            MinLengthValidator(3),
            RegexValidator(
                regex='^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$',
                message='Subdomain must be lowercase letters, numbers, and hyphens only'
            )
        ],
        help_text="Subdomain for caseclosure.org"
    )
    
    custom_domain = models.CharField(
        max_length=255, 
        unique=True, 
        blank=True, 
        null=True,
        help_text="Custom domain like memorial.example.com"
    )
    
    # Deployment Status
    deployment_status = models.CharField(
        max_length=20,
        choices=[
            ('not_deployed', 'Not Deployed'),
            ('deploying', 'Deploying'),
            ('deployed', 'Deployed'),
            ('failed', 'Failed'),
            ('updating', 'Updating')
        ],
        default='not_deployed'
    )
    
    render_service_id = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Render.com service ID"
    )
    
    deployment_url = models.URLField(
        blank=True,
        help_text="Live website URL"
    )
    
    last_deployed_at = models.DateTimeField(null=True, blank=True)
    deployment_error = models.TextField(blank=True)
    
    # SSL Status
    ssl_status = models.CharField(
        max_length=20,
        choices=[
            ('not_needed', 'Not Needed'),
            ('pending', 'Pending'),
            ('active', 'Active'),
            ('failed', 'Failed')
        ],
        default='not_needed'
    )
    
    # Publishing Status
    is_public = models.BooleanField(
        default=False,
        help_text="Whether the website is publicly accessible"
    )
    
    is_disabled = models.BooleanField(
        default=False,
        help_text="Temporarily disable the website"
    )
    
    # Archive status (soft delete)
    archived = models.BooleanField(
        default=False,
        help_text="Archive case instead of deleting"
    )
    archived_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def slug(self):
        """Virtual slug property for compatibility with tracking middleware"""
        if self.case_title:
            return slugify(f"{self.case_title}-{self.id}" if self.id else self.case_title)
        elif self.first_name and self.last_name:
            return slugify(f"{self.first_name}-{self.last_name}-{self.id}" if self.id else f"{self.first_name}-{self.last_name}")
        return f"case-{self.id}" if self.id else "case-new"
    
    def get_full_url(self):
        """Get the full URL for the deployed website"""
        if self.deployment_url:
            return self.deployment_url
        elif self.custom_domain:
            return f"https://{self.custom_domain}"
        elif self.subdomain:
            return f"https://{self.subdomain}.caseclosure.org"
        return None
    
    def get_display_name(self):
        """Get formatted display name"""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        
        name = ' '.join(parts)
        if self.nickname:
            name += f' "{self.nickname}"'
        return name
    
    def get_full_incident_location(self):
        """Get formatted incident location with city and state"""
        parts = []
        if self.incident_location:
            parts.append(self.incident_location)
        if self.incident_city:
            parts.append(self.incident_city)
        if self.incident_state:
            parts.append(self.incident_state)
        return ', '.join(parts) if parts else ''
    
    def save(self, *args, **kwargs):
        # Auto-sync crime_type with case_type
        if not self.crime_type:
            self.crime_type = self.case_type
        
        # Auto-generate subdomain if not set
        if not self.subdomain and self.first_name and self.last_name:
            base_subdomain = slugify(f"{self.first_name}-{self.last_name}")[:40]
            subdomain = base_subdomain
            counter = 1
            
            while Case.objects.filter(subdomain=subdomain).exclude(pk=self.pk).exists():
                subdomain = f"{base_subdomain}-{counter}"
                counter += 1
            
            self.subdomain = subdomain
        
        # Set archived timestamp
        if self.archived and not self.archived_at:
            self.archived_at = timezone.now()
        elif not self.archived:
            self.archived_at = None
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_display_name()} - {self.case_title}"
    
    class Meta:
        db_table = 'cases'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subdomain']),
            models.Index(fields=['custom_domain']),
            models.Index(fields=['user', '-created_at']),
        ]


# Rest of the models remain the same...
class SpotlightPost(models.Model):
    """Blog posts for the Spotlight section"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='spotlight_posts'
    )
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    content = models.TextField()
    excerpt = models.TextField(
        max_length=500, 
        blank=True,
        help_text="Short summary for preview"
    )
    
    featured_image = models.ImageField(
        upload_to=spotlight_photo_upload_path, 
        blank=True, 
        null=True
    )
    
    image_gallery = models.JSONField(
        default=list, 
        blank=True,
        help_text="List of image URLs for gallery"
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('published', 'Published'),
            ('scheduled', 'Scheduled'),
            ('archived', 'Archived')
        ],
        default='draft'
    )
    
    published_at = models.DateTimeField(null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    
    meta_description = models.CharField(max_length=160, blank=True)
    
    view_count = models.IntegerField(default=0)
    is_pinned = models.BooleanField(
        default=False,
        help_text="Pin to top of spotlight feed"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            
            base_slug = self.slug
            counter = 1
            while SpotlightPost.objects.filter(
                case=self.case, 
                slug=self.slug
            ).exclude(pk=self.pk).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.case.case_title}"
    
    class Meta:
        db_table = 'spotlight_posts'
        ordering = ['-is_pinned', '-published_at', '-created_at']
        unique_together = [['case', 'slug']]
        indexes = [
            models.Index(fields=['case', 'status', '-published_at']),
        ]


class CasePhoto(models.Model):
    """Additional photos for a case (gallery)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='photos'
    )
    
    image = models.ImageField(upload_to=case_photo_upload_path)
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'case_photos'
        ordering = ['order', 'uploaded_at']


class CaseAccess(models.Model):
    """Control who can access a case and what they can see"""
    
    ACCESS_LEVELS = [
        ('viewer', 'View Only'),
        ('tips_only', 'Tips Only'),
        ('leo', 'Law Enforcement Officer'),
        ('private_investigator', 'Private Investigator'),
        ('advocate', 'Victim Advocate'),
        ('collaborator', 'Family Collaborator'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='access_permissions')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='case_access'
    )
    
    access_level = models.CharField(max_length=30, choices=ACCESS_LEVELS, default='viewer')
    
    # Granular permissions
    can_view_tips = models.BooleanField(default=True)
    can_view_tracking = models.BooleanField(default=False)
    can_view_personal_info = models.BooleanField(default=False)
    can_view_evidence = models.BooleanField(default=True)
    can_export_data = models.BooleanField(default=False)
    can_contact_family = models.BooleanField(default=True)
    
    # Invitation details
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='sent_invitations'
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    invitation_message = models.TextField(blank=True)
    
    # Acceptance
    accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    last_accessed = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)
    actions_log = models.JSONField(default=list)
    
    def log_action(self, action, request=None):
        """Log actions for audit trail"""
        log_entry = {
            'action': action,
            'timestamp': timezone.now().isoformat(),
        }
        if request:
            log_entry['ip'] = request.META.get('REMOTE_ADDR', '')
        
        self.actions_log.append(log_entry)
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save()
    
    def is_active(self):
        """Check if access is still valid"""
        if not self.accepted:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True
    
    class Meta:
        unique_together = ['case', 'user']
        db_table = 'case_access'
        indexes = [
            models.Index(fields=['case', 'user']),
            models.Index(fields=['access_level', 'accepted']),
        ]


class LEOInvite(models.Model):
    """Invitation system for Law Enforcement Officers"""
    
    invite_code = models.CharField(
        max_length=12, 
        unique=True,
        default=generate_leo_invite_code
    )
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='leo_invites')
    
    # Officer details
    officer_name = models.CharField(max_length=255)
    officer_email = models.EmailField()
    department = models.CharField(max_length=255)
    badge_number = models.CharField(max_length=50, blank=True)
    
    # Access configuration
    access_config = models.JSONField(
        default=dict,
        help_text="Permissions configuration for this LEO"
    )
    
    # Invite metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_leo_invites'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    # Usage tracking
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_leo_invite'
    )
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()
    
    class Meta:
        db_table = 'leo_invites'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invite_code']),
            models.Index(fields=['case', '-created_at']),
        ]


class DeploymentLog(models.Model):
    """Track deployment history and debugging"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='deployment_logs'
    )
    
    action = models.CharField(
        max_length=50,
        choices=[
            ('deploy', 'Initial Deploy'),
            ('update', 'Update'),
            ('rollback', 'Rollback'),
            ('dns_update', 'DNS Update'),
            ('ssl_provision', 'SSL Provision'),
            ('delete', 'Delete')
        ]
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('started', 'Started'),
            ('in_progress', 'In Progress'),
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled')
        ]
    )
    
    render_deploy_id = models.CharField(max_length=100, blank=True)
    
    details = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.completed_at and self.started_at:
            delta = self.completed_at - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'deployment_logs'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['case', '-started_at']),
        ]