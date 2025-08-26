# cases/serializers.py - Updated to match new models and functionality

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Case, 
    SpotlightPost, 
    TemplateRegistry, 
    DeploymentLog, 
    CasePhoto
)

User = get_user_model()


class TemplateRegistrySerializer(serializers.ModelSerializer):
    """
    Serializer for template registry.
    """
    class Meta:
        model = TemplateRegistry
        fields = [
            'template_id',
            'name',
            'description',
            'version',
            'schema',
            'preview_image',
            'thumbnail_image',
            'features',
            'is_premium',
            'is_active'
        ]
        read_only_fields = ['template_id']


class CasePhotoSerializer(serializers.ModelSerializer):
    """
    Serializer for case photos.
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CasePhoto
        fields = [
            'id',
            'case',
            'image',
            'image_url',
            'caption',
            'is_public',
            'order',
            'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class SpotlightPostSerializer(serializers.ModelSerializer):
    """
    Serializer for Spotlight blog posts.
    """
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SpotlightPost
        fields = [
            'id',
            'case',
            'case_title',
            'title',
            'slug',
            'content',
            'excerpt',
            'featured_image',
            'featured_image_url',
            'image_gallery',
            'status',
            'published_at',
            'scheduled_for',
            'meta_description',
            'view_count',
            'is_pinned',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'view_count', 'created_at', 'updated_at']
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


class DeploymentLogSerializer(serializers.ModelSerializer):
    """
    Serializer for deployment logs.
    """
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = DeploymentLog
        fields = [
            'id',
            'case',
            'case_title',
            'action',
            'status',
            'render_deploy_id',
            'details',
            'error_message',
            'started_at',
            'completed_at',
            'duration_seconds',
            'duration'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'duration_seconds']
    
    def get_duration(self, obj):
        if obj.duration_seconds:
            minutes = obj.duration_seconds // 60
            seconds = obj.duration_seconds % 60
            return f"{minutes}m {seconds}s"
        return None


# Updated CaseSerializer - Remove invalid fields that don't exist in the model

class CaseSerializer(serializers.ModelSerializer):
    """
    Main serializer for Case model - FIXED VERSION
    """
    # Read-only computed fields
    logo_url = serializers.SerializerMethodField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    full_url = serializers.CharField(source='get_full_url', read_only=True)
    
    # Related counts
    spotlight_posts_count = serializers.SerializerMethodField()
    photos_count = serializers.SerializerMethodField()
    latest_deployment = serializers.SerializerMethodField()
    template_info = serializers.SerializerMethodField()
    
    # Photo URLs
    primary_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = [
            # IDs and metadata
            'id', 
            'user',
            'user_email',
            'created_at', 
            'updated_at',
            
            # Template fields
            'template_id',
            'template_version',
            'template_data',
            'template_info',
            
            # Basic case info - REMOVED 'name' as it doesn't exist
            'case_title',  # This is the actual field name
            'first_name',
            'last_name',
            'middle_name',
            'nickname',
            'display_name',
            
            # Dates
            'date_of_birth',
            'date_of_death',
            'date_missing',
            'incident_date',
            
            # Physical description
            'age',
            'height_feet',
            'height_inches',
            'weight',
            'race',
            'sex',
            'hair_color',
            'eye_color',
            'distinguishing_features',
            
            # Photos - only include what exists in model
            'primary_photo',
            'primary_photo_url',
            'logo_url',  # Keep this as a computed field
            
            # Case details
            'description',
            'case_number',
            'case_type',
            'incident_location',
            'last_seen_location',
            
            # Investigation
            'investigating_agency',
            'detective_name',
            'detective_phone',
            'detective_email',
            
            # Reward
            'reward_amount',
            'reward_details',
            
            # Domain and deployment
            'subdomain',
            'custom_domain',
            'deployment_status',
            'render_service_id',
            'deployment_url',
            'full_url',
            'last_deployed_at',
            'deployment_error',
            'ssl_status',
            'latest_deployment',
            
            # Publishing
            'is_public',
            'is_disabled',
            
            # Related counts
            'spotlight_posts_count',
            'photos_count',
        ]
        read_only_fields = [
            'id', 
            'user',
            'created_at', 
            'updated_at',
            'logo_url',
            'primary_photo_url',
            'render_service_id',
            'deployment_url',
            'last_deployed_at',
            'deployment_error',
            'full_url',
            'display_name',
            'user_email',
            'spotlight_posts_count',
            'photos_count',
            'latest_deployment',
            'template_info'
        ]
    
    def get_logo_url(self, obj):
        """Get logo URL if available"""
        # Note: The Case model doesn't have a logo field, 
        # so this might need to be removed or linked to primary_photo
        if hasattr(obj, 'primary_photo') and obj.primary_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_photo.url)
            return obj.primary_photo.url
        return None
    
    def get_primary_photo_url(self, obj):
        if obj.primary_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_photo.url)
            return obj.primary_photo.url
        return None
    
    def get_spotlight_posts_count(self, obj):
        return obj.spotlight_posts.filter(status='published').count()
    
    def get_photos_count(self, obj):
        return obj.photos.filter(is_public=True).count()
    
    def get_latest_deployment(self, obj):
        latest = obj.deployment_logs.first()
        if latest:
            return {
                'status': latest.status,
                'action': latest.action,
                'started_at': latest.started_at,
                'completed_at': latest.completed_at
            }
        return None
    
    def get_template_info(self, obj):
        try:
            template = TemplateRegistry.objects.get(template_id=obj.template_id)
            return {
                'name': template.name,
                'features': template.features,
                'is_premium': template.is_premium
            }
        except TemplateRegistry.DoesNotExist:
            return None
    
    def validate_subdomain(self, value):
        """Validate subdomain format and uniqueness"""
        if value:
            import re
            if not re.match(r'^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$', value):
                raise serializers.ValidationError(
                    "Subdomain must be lowercase letters, numbers, and hyphens only (3-50 characters)"
                )
            
            # Check uniqueness
            if self.instance:
                exists = Case.objects.filter(subdomain=value).exclude(id=self.instance.id).exists()
            else:
                exists = Case.objects.filter(subdomain=value).exists()
            
            if exists:
                raise serializers.ValidationError("This subdomain is already taken.")
        
        return value
    
    def validate_custom_domain(self, value):
        """Validate custom domain format and uniqueness"""
        if value:
            import re
            domain_regex = re.compile(
                r'^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$',
                re.IGNORECASE
            )
            
            if not domain_regex.match(value):
                raise serializers.ValidationError(
                    "Please enter a valid domain (e.g., example.com)"
                )
            
            # Check uniqueness
            if self.instance:
                exists = Case.objects.filter(custom_domain=value).exclude(id=self.instance.id).exists()
            else:
                exists = Case.objects.filter(custom_domain=value).exists()
            
            if exists:
                raise serializers.ValidationError("This domain is already in use.")
        
        return value
    
    def validate_template_data(self, value):
        """Validate template_data structure"""
        if value and not isinstance(value, dict):
            raise serializers.ValidationError("Template data must be a JSON object.")
        return value


class CaseListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing cases (better performance)
    """
    logo_url = serializers.SerializerMethodField(read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    full_url = serializers.CharField(source='get_full_url', read_only=True)
    primary_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = [
            'id',
            'case_title',  # The actual field name
            'display_name',
            'case_type',
            'template_id',
            'deployment_status',
            'subdomain',
            'full_url',
            'is_public',
            'logo_url',
            'primary_photo',
            'primary_photo_url',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'logo_url', 'primary_photo_url']
    
    def get_logo_url(self, obj):
        # Map to primary_photo since there's no logo field
        if obj.primary_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_photo.url)
            return obj.primary_photo.url
        return None
    
    def get_primary_photo_url(self, obj):
        if obj.primary_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.primary_photo.url)
            return obj.primary_photo.url
        return None