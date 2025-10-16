# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Max
from .models import (
    SpotlightPost, SpotlightMedia, SpotlightLike, SpotlightComment,
    SpotlightFlag, UserViolation, SpotlightSettings
)

User = get_user_model()

# EXISTING SERIALIZERS
class SpotlightMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpotlightMedia
        fields = ['id', 'file', 'media_type', 'caption', 'order', 'width', 'height']

class SpotlightCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = SpotlightComment
        fields = ['id', 'content', 'author', 'author_name', 'author_avatar', 
                  'created_at', 'is_edited', 'replies']
    
    def get_author_avatar(self, obj):
        # Implement avatar URL logic if you have user profiles
        return None
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return SpotlightCommentSerializer(obj.replies.all(), many=True).data
        return []

class SpotlightPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    media = SpotlightMediaSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    comments = SpotlightCommentSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    case_title = serializers.SerializerMethodField()  # ✅ NEW
    
    class Meta:
        model = SpotlightPost
        fields = ['id', 'case', 'case_title', 'title', 'content', 'content_text', 'status',  # ✅ UPDATED: Added case, case_title
                  'scheduled_for', 'published_at', 'author', 'author_name', 
                  'author_username', 'views_count', 'likes_count', 'comments_count',
                  'media', 'is_liked', 'is_bookmarked', 'comments', 'slug', 
                  'is_featured', 'created_at', 'updated_at', 'tags', 'case_name',
                  'is_flagged', 'post_type', 'priority', 'featured_image']  # ✅ UPDATED: Added featured_image
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        # Implement bookmark logic if you have a bookmark model
        return False
    
    def get_case_title(self, obj):  # ✅ NEW METHOD
        """Get the case title if case exists"""
        if obj.case:
            return obj.case.case_title or f"{obj.case.first_name} {obj.case.last_name}"
        return None

class SpotlightPostCreateSerializer(serializers.ModelSerializer):
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SpotlightPost
        fields = ['case', 'title', 'content', 'content_text', 'status',  # ✅ UPDATED: Added case
                  'scheduled_for', 'media_files', 'tags', 'case_name',
                  'post_type', 'priority', 'is_sensitive', 'featured_image']  # ✅ UPDATED: Added post_type, priority, is_sensitive, featured_image
    
    def validate(self, data):
        """Validate case permissions"""
        request = self.context.get('request')
        case = data.get('case')
        
        if case and request:
            # Staff can post to any case
            if not request.user.is_staff:
                # Regular users can only post to their own cases
                if case.user != request.user:
                    raise serializers.ValidationError(
                        "You don't have permission to post to this case"
                    )
        
        return data
    
    def create(self, validated_data):
        media_files = validated_data.pop('media_files', [])
        post = SpotlightPost.objects.create(**validated_data)
        
        # Handle media uploads
        for index, file in enumerate(media_files):
            SpotlightMedia.objects.create(
                post=post,
                file=file,
                order=index,
                media_type='video' if file.content_type.startswith('video') else 'image'
            )
        
        return post

# MODERATION SERIALIZERS
class SpotlightFlagSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    reporter_username = serializers.CharField(source='reported_by.username', read_only=True)
    
    class Meta:
        model = SpotlightFlag
        fields = ['id', 'reason', 'description', 'reporter_name', 'reporter_username', 
                  'created_at', 'resolved', 'action_taken', 'resolved_at']

class ModerationQueueSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    flags = SpotlightFlagSerializer(many=True, read_only=True)
    flags_count = serializers.IntegerField(read_only=True)
    media = SpotlightMediaSerializer(many=True, read_only=True)
    case_title = serializers.SerializerMethodField()  # ✅ NEW
    
    class Meta:
        model = SpotlightPost
        fields = ['id', 'case', 'case_title', 'title', 'content', 'content_text', 'author_name',  # ✅ UPDATED: Added case, case_title
                  'author_username', 'case_name', 'created_at', 'published_at',
                  'flags', 'flags_count', 'media', 'status', 'tags', 
                  'views_count', 'likes_count', 'comments_count']
    
    def get_case_title(self, obj):  # ✅ NEW METHOD
        if obj.case:
            return obj.case.case_title or f"{obj.case.first_name} {obj.case.last_name}"
        return None

class UserViolationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    post_title = serializers.CharField(source='related_post.title', read_only=True)
    
    class Meta:
        model = UserViolation
        fields = ['id', 'user', 'user_name', 'user_username', 'violation_type', 
                  'description', 'action_taken', 'created_at', 'expires_at',
                  'is_active', 'related_post', 'post_title']

class AccountOverviewSerializer(serializers.ModelSerializer):
    violations_count = serializers.IntegerField(read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    flagged_posts_count = serializers.IntegerField(read_only=True)
    last_violation = serializers.DateTimeField(read_only=True)
    account_status = serializers.SerializerMethodField()
    recent_violations = serializers.SerializerMethodField()
    trust_score = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'date_joined', 'last_login', 'violations_count', 'posts_count',
                  'flagged_posts_count', 'last_violation', 'account_status', 
                  'recent_violations', 'trust_score', 'is_active']
    
    def get_account_status(self, obj):
        from django.utils import timezone
        # Check for active suspensions/bans
        active_violation = obj.violations.filter(
            Q(action_taken='permanent_ban', is_active=True) |
            Q(action_taken='temporary_suspension', expires_at__gt=timezone.now(), is_active=True)
        ).first()
        
        if active_violation:
            if active_violation.action_taken == 'permanent_ban':
                return 'banned'
            return 'suspended'
        
        if obj.violations.filter(action_taken='warning').exists():
            return 'warned'
        
        return 'active'
    
    def get_recent_violations(self, obj):
        recent = obj.violations.all()[:3]
        return UserViolationSerializer(recent, many=True).data
    
    def get_trust_score(self, obj):
        # Calculate trust score based on behavior
        score = 100
        score -= obj.violations.count() * 10
        score += obj.spotlight_posts.filter(status='published').count() * 2
        score = max(0, min(100, score))  # Keep between 0-100
        return score

class SpotlightStatsSerializer(serializers.Serializer):
    # Overview stats
    total_posts = serializers.IntegerField()
    posts_today = serializers.IntegerField()
    posts_this_week = serializers.IntegerField()
    posts_this_month = serializers.IntegerField()
    
    # User stats
    active_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    total_users = serializers.IntegerField()
    
    # Moderation stats
    flagged_content = serializers.IntegerField()
    resolved_flags = serializers.IntegerField()
    pending_moderation = serializers.IntegerField()
    violations_this_week = serializers.IntegerField()
    
    # Engagement stats
    total_likes = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    engagement_rate = serializers.FloatField()
    avg_likes_per_post = serializers.FloatField()
    
    # Trending data
    top_tags = serializers.ListField()
    top_authors = serializers.ListField()
    hourly_activity = serializers.ListField()
    
    # Moderation breakdown
    flag_reasons = serializers.DictField()
    violation_types = serializers.DictField()

class SpotlightSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpotlightSettings
        fields = '__all__'

class FlagPostSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=[choice[0] for choice in SpotlightFlag.REASON_CHOICES])
    description = serializers.CharField(required=False, allow_blank=True)

class ModeratePostSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'remove', 'block'])
    reason = serializers.CharField(required=False)
    violation_type = serializers.CharField(required=False)
    duration = serializers.ChoiceField(choices=['temporary', 'permanent'], required=False)
    days = serializers.IntegerField(required=False, min_value=1, max_value=365)