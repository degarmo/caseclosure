# cases/serializers.py - Updated with City and State fields

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Case, 
    SpotlightPost, 
    TemplateRegistry, 
    DeploymentLog, 
    CasePhoto,
    CaseInvitation
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
            'is_primary',
            'is_public',
            'order',
            'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'image_url']
    
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


class CaseSerializer(serializers.ModelSerializer):
    """
    Main serializer for Case model - Updated with City and State fields
    """
    # Read-only computed fields
    user_email = serializers.EmailField(source='user.email', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    full_url = serializers.CharField(source='get_full_url', read_only=True)
    full_incident_location = serializers.CharField(source='get_full_incident_location', read_only=True)
    
    # Related serializers
    photos = CasePhotoSerializer(many=True, read_only=True)
    
    # Computed photo fields
    primary_photo = serializers.SerializerMethodField()
    primary_photo_url = serializers.SerializerMethodField()
    victim_photo_url = serializers.SerializerMethodField()  # Alias for compatibility
    
    # Related counts
    spotlight_posts_count = serializers.SerializerMethodField()
    photos_count = serializers.SerializerMethodField()
    latest_deployment = serializers.SerializerMethodField()
    template_info = serializers.SerializerMethodField()
    
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
            
            # Basic case info
            'case_title',
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
            
            # Photos
            'photos',
            'primary_photo',
            'primary_photo_url',
            'victim_photo_url',
            
            # Case details
            'description',
            'case_number',
            'case_type',
            'crime_type',
            'incident_location',
            'incident_city',  # NEW FIELD
            'incident_state',  # NEW FIELD
            'full_incident_location',  # NEW COMPUTED FIELD
            'last_seen_location',
            'last_seen_date',
            'last_seen_time',
            'last_seen_wearing',
            'last_seen_with',
            'planned_activities',
            'transportation_details',
            
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
            'photos',
            'primary_photo',
            'primary_photo_url',
            'victim_photo_url',
            'render_service_id',
            'deployment_url',
            'last_deployed_at',
            'deployment_error',
            'full_url',
            'full_incident_location',
            'display_name',
            'user_email',
            'spotlight_posts_count',
            'photos_count',
            'latest_deployment',
            'template_info'
        ]
    
    def get_primary_photo(self, obj):
        """Get the primary photo object with full details"""
        primary = obj.photos.filter(is_primary=True).first()
        if primary:
            return CasePhotoSerializer(primary, context=self.context).data
        # If no primary photo marked, return the first photo
        first_photo = obj.photos.first()
        if first_photo:
            return CasePhotoSerializer(first_photo, context=self.context).data
        return None
    
    def get_primary_photo_url(self, obj):
        """Get just the URL of the primary photo"""
        primary = obj.photos.filter(is_primary=True).first()
        if not primary:
            # If no primary photo marked, use the first photo
            primary = obj.photos.first()
        
        if primary and primary.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None
    
    def get_victim_photo_url(self, obj):
        """Alias for primary_photo_url for backward compatibility"""
        return self.get_primary_photo_url(obj)
    
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
    
    def validate_incident_state(self, value):
        """Validate state field - could add state abbreviation validation here"""
        if value and len(value) > 50:
            raise serializers.ValidationError("State name is too long.")
        return value
    
    def validate_incident_city(self, value):
        """Validate city field"""
        if value and len(value) > 100:
            raise serializers.ValidationError("City name is too long.")
        return value


class CaseListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing cases (better performance)
    """
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    full_url = serializers.CharField(source='get_full_url', read_only=True)
    primary_photo_url = serializers.SerializerMethodField()
    full_incident_location = serializers.CharField(source='get_full_incident_location', read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id',
            'case_title',
            'display_name',
            'case_type',
            'crime_type',
            'template_id',
            'deployment_status',
            'subdomain',
            'full_url',
            'is_public',
            'primary_photo_url',
            'incident_city',  # NEW FIELD
            'incident_state',  # NEW FIELD
            'full_incident_location',  # NEW COMPUTED FIELD
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'primary_photo_url', 'full_incident_location']
    
    def get_primary_photo_url(self, obj):
        """Get the primary photo URL for list view"""
        primary = obj.photos.filter(is_primary=True).first()
        if not primary:
            primary = obj.photos.first()
        
        if primary and primary.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class CaseInvitationSerializer(serializers.ModelSerializer):
    """Serializer for viewing case invitations"""
    invited_by_email = serializers.CharField(source='invited_by.email', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseInvitation
        fields = [
            'id',
            'case',
            'case_title',
            'invitee_email',
            'invitee_name',
            'access_type',
            'invited_by',
            'invited_by_email',
            'subject_line',
            'message_body',
            'status',
            'invitation_code',
            'created_at',
            'expires_at',
            'accepted_at',
            'is_expired'
        ]
        read_only_fields = [
            'id',
            'invitation_code',
            'created_at',
            'expires_at',
            'status',
            'accepted_at',
            'is_expired'
        ]
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class CreateCaseInvitationSerializer(serializers.Serializer):
    """Serializer for creating new invitations"""
    invitee_name = serializers.CharField(max_length=200)
    invitee_email = serializers.EmailField()
    case_id = serializers.IntegerField()
    user_type = serializers.ChoiceField(
        choices=['police', 'investigator', 'advocate', 'family', 'other']
    )
    subject_line = serializers.CharField(max_length=255)
    message_body = serializers.CharField()
    invited_by = serializers.IntegerField()
    
    def validate_case_id(self, value):
        """Verify case exists"""
        try:
            Case.objects.get(id=value)
        except Case.DoesNotExist:
            raise serializers.ValidationError("Case not found")
        return value
    
    def validate(self, data):
        """Verify the inviter owns the case"""
        case = Case.objects.get(id=data['case_id'])
        if case.user_id != data['invited_by']:
            raise serializers.ValidationError(
                "You can only invite people to cases you own"
            )
        return data