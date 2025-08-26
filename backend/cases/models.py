# cases/models.py - Complete model file

import uuid
import os
import json
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
    
    # THIS IS THE KEY - Each template has its own unique schema!
    schema = models.JSONField(
        default=dict,
        help_text="""
        UNIQUE schema for this template. Examples:
        
        BEACON Template might have:
        {
            "global": {
                "primaryColor": {"type": "color", "label": "Primary Color", "default": "#3B82F6"},
                "fontFamily": {"type": "select", "label": "Font", "options": ["Inter", "Roboto"], "default": "Inter"}
            },
            "sections": {
                "hero": {
                    "title": {"type": "text", "label": "Hero Title", "default": "Help Us Find"},
                    "subtitle": {"type": "text", "label": "Subtitle"},
                    "backgroundImage": {"type": "image", "label": "Background Image"}
                },
                "timeline": {
                    "showTimeline": {"type": "boolean", "label": "Show Timeline", "default": true},
                    "events": {"type": "array", "label": "Timeline Events"}
                },
                "photoGallery": {
                    "title": {"type": "text", "label": "Gallery Title", "default": "Photos"},
                    "layout": {"type": "select", "options": ["grid", "carousel"], "default": "grid"}
                }
            }
        }
        
        JUSTICE Template might have:
        {
            "global": {
                "primaryColor": {"type": "color", "label": "Primary Color", "default": "#DC2626"},
                "badgeNumber": {"type": "text", "label": "Badge Number"}
            },
            "sections": {
                "caseFacts": {
                    "title": {"type": "text", "label": "Case Facts Title"},
                    "showCaseNumber": {"type": "boolean", "default": true}
                },
                "evidence": {
                    "showEvidence": {"type": "boolean", "label": "Show Evidence Section"},
                    "documents": {"type": "array", "label": "Evidence Documents"}
                },
                "lawEnforcement": {
                    "departmentLogo": {"type": "image", "label": "Department Logo"},
                    "contactMessage": {"type": "richtext", "label": "Contact Message"}
                }
            }
        }
        
        LEGACY Template might have completely different sections:
        {
            "sections": {
                "lifeStory": {
                    "narrative": {"type": "richtext", "label": "Life Story"},
                    "birthPlace": {"type": "text", "label": "Birth Place"}
                },
                "memorialWall": {
                    "allowGuestPosts": {"type": "boolean", "default": true}
                },
                "photoAlbums": {
                    "albums": {"type": "array", "label": "Photo Albums"}
                }
            }
        }
        """
    )
    
    # Component paths for React
    components = models.JSONField(
        default=dict,
        help_text="Maps section names to React component paths"
    )
    
    preview_image = models.URLField(blank=True, null=True)
    thumbnail_image = models.URLField(blank=True, null=True)
    
    # Features this template supports
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
    """
    Main case model - each case is a website instance
    """
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
    
    # THE MAGIC FIELD - Stores ALL customizations specific to the chosen template
    template_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="""
        Stores all template-specific customizations. Structure depends on the template!
        Example:
        {
            "customizations": {
                // These fields match the template's schema
                "global": {...},
                "sections": {...}
            },
            "metadata": {
                "last_edited": "2024-01-01T00:00:00Z",
                "editor_version": "1.0.0"
            }
        }
        """
    )
    
    # Basic case information (common across all templates)
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
    
    incident_date = models.DateField(blank=True, null=True)
    incident_location = models.CharField(max_length=255, blank=True)
    last_seen_location = models.CharField(max_length=255, blank=True)
    
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
    
    # Deployment Status (for Render.com)
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
            ('not_needed', 'Not Needed'),  # For subdomains
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
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    
    def save(self, *args, **kwargs):
        # Auto-generate subdomain if not set
        if not self.subdomain and self.first_name and self.last_name:
            base_subdomain = slugify(f"{self.first_name}-{self.last_name}")[:40]
            subdomain = base_subdomain
            counter = 1
            
            while Case.objects.filter(subdomain=subdomain).exclude(pk=self.pk).exists():
                subdomain = f"{base_subdomain}-{counter}"
                counter += 1
            
            self.subdomain = subdomain
        
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


class SpotlightPost(models.Model):
    """
    Blog posts for the Spotlight section
    Available on all templates that have spotlight feature enabled
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='spotlight_posts'
    )
    
    # Content
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    content = models.TextField()
    excerpt = models.TextField(
        max_length=500, 
        blank=True,
        help_text="Short summary for preview"
    )
    
    # Media
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
    
    # Publishing
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
    
    # SEO
    meta_description = models.CharField(max_length=160, blank=True)
    
    # Engagement
    view_count = models.IntegerField(default=0)
    is_pinned = models.BooleanField(
        default=False,
        help_text="Pin to top of spotlight feed"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            
            # Ensure unique slug within case
            base_slug = self.slug
            counter = 1
            while SpotlightPost.objects.filter(
                case=self.case, 
                slug=self.slug
            ).exclude(pk=self.pk).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        
        # Auto-set published_at when publishing
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
    """
    Additional photos for a case (gallery)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='photos'
    )
    
    image = models.ImageField(upload_to=case_photo_upload_path)
    caption = models.CharField(max_length=255, blank=True)
    
    is_public = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'case_photos'
        ordering = ['order', 'uploaded_at']


class DeploymentLog(models.Model):
    """
    Track deployment history and debugging
    """
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
    
    # Render.com specific
    render_deploy_id = models.CharField(max_length=100, blank=True)
    
    # Details and errors
    details = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Timing
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