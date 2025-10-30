# views.py
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum, F, Max
from datetime import datetime, timedelta
from collections import Counter
from .models import (
    SpotlightPost, SpotlightLike, SpotlightComment, 
    SpotlightFlag, UserViolation, SpotlightSettings
)
from .serializers import (
    SpotlightPostSerializer, 
    SpotlightPostCreateSerializer,
    SpotlightCommentSerializer,
    ModerationQueueSerializer,
    AccountOverviewSerializer,
    SpotlightStatsSerializer,
    SpotlightFlagSerializer,
    UserViolationSerializer,
    SpotlightSettingsSerializer,
    FlagPostSerializer,
    ModeratePostSerializer
)

class SpotlightPostViewSet(viewsets.ModelViewSet):
    # No default permission_classes - handled by get_permissions()
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            # Allow anyone to view posts
            permission_classes = [AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Require authentication for creating/editing
            permission_classes = [IsAuthenticated]
        elif self.action in ['moderation_queue', 'moderate', 'accounts', 'stats', 'spotlight_settings']:
            # Admin only actions
            permission_classes = [IsAdminUser]
        else:
            # Default to authenticated for other custom actions
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = SpotlightPost.objects.all()
        
        # ✅ NEW: Case filtering
        case_id = self.request.query_params.get('case_id')
        if case_id:
            if case_id.lower() in ['none', 'null', 'main']:
                # Main site posts only
                queryset = queryset.filter(case__isnull=True)
            else:
                # Specific case posts
                queryset = queryset.filter(case_id=case_id)
        
        # Check if user is authenticated
        if self.request.user.is_authenticated:
            if self.request.user.is_staff:
                # Staff can see everything
                pass
            else:
                # Authenticated non-staff users see their own posts and published posts
                queryset = queryset.filter(
                    Q(author=self.request.user) | 
                    Q(status='published', published_at__lte=timezone.now())
                ).exclude(status__in=['removed', 'flagged'])
        else:
            # Unauthenticated users only see published posts
            queryset = queryset.filter(
                status='published',
                published_at__lte=timezone.now()
            ).exclude(status__in=['removed', 'flagged'])
        
        # Apply filters from query params
        status_filter = self.request.query_params.get('status')
        if status_filter:
            # Only allow filtering by status if user is authenticated
            if self.request.user.is_authenticated:
                queryset = queryset.filter(status=status_filter)
            elif status_filter == 'published':
                # Public users can only filter for published posts
                queryset = queryset.filter(status='published')
        
        author_filter = self.request.query_params.get('author')
        if author_filter:
            queryset = queryset.filter(author__username=author_filter)
        
        tag_filter = self.request.query_params.get('tag')
        if tag_filter:
            queryset = queryset.filter(tags__contains=[tag_filter])
        
        return queryset.select_related('author', 'case').prefetch_related('media', 'likes', 'comments', 'flags')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SpotlightPostCreateSerializer
        return SpotlightPostSerializer
    
    def perform_create(self, serializer):
        # 🔒 AUTHORIZATION CHECK - Verify user can post to this case
        case_id = serializer.validated_data.get('case')
        if case_id:
            from cases.models import Case, CaseAccess
            from django.shortcuts import get_object_or_404
            
            case = get_object_or_404(Case, id=case_id.id if hasattr(case_id, 'id') else case_id)
            
            # Check if user owns the case
            if case.user != self.request.user:
                # Check if user has CaseAccess with posting permissions
                case_access = CaseAccess.objects.filter(
                    case=case,
                    user=self.request.user,
                    accepted=True
                ).first()
                
                # For now, only case owners can post
                # TODO: Add can_post_updates field to CaseAccess model
                if not case_access:
                    raise serializers.ValidationError({
                        "case": "You don't have permission to post to this case."
                    })
                
                # LEO users should not be able to post
                if self.request.user.profile.account_type == 'leo':
                    raise serializers.ValidationError({
                        "case": "Law enforcement officers have view-only access."
                    })
        
        # Check user posting limits
        try:
            settings = SpotlightSettings.get_settings()
        except Exception as e:
            print(f"Warning: Could not get SpotlightSettings: {e}")
            settings = SpotlightSettings.objects.create()
        
        user = self.request.user
        
        # Check hourly limit
        hour_ago = timezone.now() - timedelta(hours=1)
        recent_posts = SpotlightPost.objects.filter(
            author=user,
            created_at__gte=hour_ago
        ).count()
        
        if recent_posts >= settings.max_posts_per_hour:
            raise serializers.ValidationError("Posting limit exceeded. Please try again later.")
        
        # Check for active bans/suspensions
        try:
            active_ban = user.violations.filter(
                Q(action_taken='permanent_ban', is_active=True) |
                Q(action_taken='temporary_suspension', expires_at__gt=timezone.now(), is_active=True)
            ).exists()
        except AttributeError:
            # User model doesn't have violations relation
            active_ban = False
        
        if active_ban:
            raise serializers.ValidationError("Your account is currently restricted from posting.")
        
        # Auto-moderate content if enabled
        if settings.auto_moderation_enabled:
            content = serializer.validated_data.get('content_text', '')
            if self._contains_spam_keywords(content, settings.spam_keywords):
                serializer.validated_data['status'] = 'flagged'
                serializer.validated_data['is_flagged'] = True
        
        # IMPORTANT: Set published_at for published posts
        if serializer.validated_data.get('status') == 'published':
            serializer.validated_data['published_at'] = timezone.now()
        
        serializer.save(author=self.request.user)
    
    def _contains_spam_keywords(self, content, keywords):
        """Check if content contains spam keywords"""
        if not keywords:
            return False
        content_lower = content.lower()
        return any(keyword.lower() in content_lower for keyword in keywords)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = SpotlightLike.objects.get_or_create(
            post=post,
            user=request.user
        )
        
        if not created:
            like.delete()
            post.likes_count = post.likes.count()
            post.save()
            return Response({'liked': False, 'likes_count': post.likes_count})
        
        post.likes_count = post.likes.count()
        post.save()
        return Response({'liked': True, 'likes_count': post.likes_count})
    
    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = self.get_object()
        serializer = SpotlightCommentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            post.comments_count = post.comments.count()
            post.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        post = self.get_object()
        post.views_count += 1
        post.save()
        return Response({'views_count': post.views_count})
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Alias for view action for compatibility"""
        return self.view(request, pk)
    
    @action(detail=False, methods=['get'])
    def scheduled(self, request):
        """Get all scheduled posts for the authenticated user"""
        posts = self.get_queryset().filter(
            status='scheduled',
            scheduled_for__gt=timezone.now()
        )
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    # MODERATION ENDPOINTS
    
    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag a post for moderation"""
        post = self.get_object()
        serializer = FlagPostSerializer(data=request.data)
        
        if serializer.is_valid():
            flag, created = SpotlightFlag.objects.update_or_create(
                post=post,
                reported_by=request.user,
                defaults={
                    'reason': serializer.validated_data['reason'],
                    'description': serializer.validated_data.get('description', '')
                }
            )
            
            # Update post flag status
            post.is_flagged = True
            if post.flags.count() >= 3:  # Auto-flag after 3 reports
                post.status = 'flagged'
            post.save()
            
            if created:
                return Response({'message': 'Post flagged for review'}, status=status.HTTP_201_CREATED)
            return Response({'message': 'Flag updated'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def moderation_queue(self, request):
        """Get all flagged posts pending moderation"""
        flagged_posts = SpotlightPost.objects.filter(
            Q(flags__resolved=False) | Q(status='flagged')
        ).annotate(
            flags_count=Count('flags')
        ).distinct().order_by('-flags_count', '-created_at')
        
        page = self.paginate_queryset(flagged_posts)
        if page is not None:
            serializer = ModerationQueueSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ModerationQueueSerializer(flagged_posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def moderate(self, request, pk=None):
        """Handle moderation actions"""
        post = self.get_object()
        serializer = ModeratePostSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')
        
        if action == 'approve':
            # Approve post and resolve flags
            post.status = 'published'
            post.is_flagged = False
            if not post.published_at:
                post.published_at = timezone.now()
            post.save()
            
            post.flags.update(
                resolved=True,
                resolved_by=request.user,
                resolved_at=timezone.now(),
                action_taken='approved'
            )
            
            return Response({'message': 'Post approved', 'status': 'approved'})
        
        elif action == 'remove':
            # Remove post
            post.status = 'removed'
            post.save()
            
            # Resolve flags
            post.flags.update(
                resolved=True,
                resolved_by=request.user,
                resolved_at=timezone.now(),
                action_taken='removed'
            )
            
            # Create violation record
            UserViolation.objects.create(
                user=post.author,
                violation_type=serializer.validated_data.get('violation_type', 'other'),
                description=reason,
                related_post=post,
                action_taken='content_removal',
                created_by=request.user
            )
            
            return Response({'message': 'Post removed', 'status': 'removed'})
        
        elif action == 'block':
            # Block user
            duration = serializer.validated_data.get('duration', 'permanent')
            
            if duration == 'temporary':
                days = serializer.validated_data.get('days', 7)
                expires_at = timezone.now() + timedelta(days=days)
                action_taken = 'temporary_suspension'
                message = f'User suspended for {days} days'
            else:
                expires_at = None
                action_taken = 'permanent_ban'
                message = 'User permanently banned'
            
            # Create violation
            UserViolation.objects.create(
                user=post.author,
                violation_type=serializer.validated_data.get('violation_type', 'other'),
                description=reason,
                related_post=post,
                action_taken=action_taken,
                created_by=request.user,
                expires_at=expires_at
            )
            
            # Remove all user's flagged posts
            post.author.spotlight_posts.filter(is_flagged=True).update(
                status='removed'
            )
            
            # Resolve flags
            post.flags.update(
                resolved=True,
                resolved_by=request.user,
                resolved_at=timezone.now(),
                action_taken='user_blocked'
            )
            
            return Response({'message': message, 'status': 'blocked'})
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def accounts(self, request):
        """Get account overview with violation history"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.annotate(
            violations_count=Count('violations'),
            posts_count=Count('spotlight_posts'),
            flagged_posts_count=Count('spotlight_posts', filter=Q(spotlight_posts__is_flagged=True)),
            last_violation=Max('violations__created_at')
        ).filter(
            Q(violations_count__gt=0) | Q(posts_count__gt=0)
        )
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter == 'banned':
            users = users.filter(violations__action_taken='permanent_ban', violations__is_active=True)
        elif status_filter == 'suspended':
            users = users.filter(
                violations__action_taken='temporary_suspension',
                violations__expires_at__gt=timezone.now(),
                violations__is_active=True
            )
        
        users = users.distinct().order_by('-violations_count', '-flagged_posts_count')
        
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = AccountOverviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AccountOverviewSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def stats(self, request):
        """Get comprehensive Spotlight statistics"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Post statistics
        total_posts = SpotlightPost.objects.filter(status='published').count()
        posts_today = SpotlightPost.objects.filter(
            created_at__gte=today_start
        ).count()
        posts_this_week = SpotlightPost.objects.filter(
            created_at__gte=week_start
        ).count()
        posts_this_month = SpotlightPost.objects.filter(
            created_at__gte=month_start
        ).count()
        
        # User statistics
        total_users = User.objects.filter(spotlight_posts__isnull=False).distinct().count()
        active_users = User.objects.filter(
            spotlight_posts__created_at__gte=now - timedelta(days=7)
        ).distinct().count()
        new_users_today = User.objects.filter(
            date_joined__gte=today_start
        ).count()
        
        # Moderation statistics
        flagged_content = SpotlightPost.objects.filter(is_flagged=True).count()
        resolved_flags = SpotlightFlag.objects.filter(resolved=True).count()
        pending_moderation = SpotlightFlag.objects.filter(resolved=False).values('post').distinct().count()
        violations_this_week = UserViolation.objects.filter(
            created_at__gte=week_start
        ).count()
        
        # Engagement statistics
        total_likes = SpotlightLike.objects.count()
        total_comments = SpotlightComment.objects.count()
        posts_with_engagement = SpotlightPost.objects.filter(
            Q(likes_count__gt=0) | Q(comments_count__gt=0)
        ).count()
        engagement_rate = (posts_with_engagement / total_posts * 100) if total_posts > 0 else 0
        avg_likes = SpotlightPost.objects.filter(
            status='published'
        ).aggregate(avg=Avg('likes_count'))['avg'] or 0
        
        # Get top tags
        all_tags = []
        for post in SpotlightPost.objects.filter(status='published', tags__isnull=False):
            if post.tags:
                all_tags.extend(post.tags)
        
        tag_counts = Counter(all_tags)
        top_tags = [
            {'tag': tag, 'count': count} 
            for tag, count in tag_counts.most_common(10)
        ]
        
        # Get top authors
        top_authors_qs = User.objects.annotate(
            post_count=Count('spotlight_posts', filter=Q(spotlight_posts__status='published')),
            total_likes=Sum('spotlight_posts__likes_count', filter=Q(spotlight_posts__status='published'))
        ).filter(post_count__gt=0).order_by('-total_likes')[:5]
        
        top_authors = [
            {
                'username': author.username,
                'posts': author.post_count,
                'likes': author.total_likes or 0
            }
            for author in top_authors_qs
        ]
        
        # Hourly activity (last 24 hours)
        hourly_activity = []
        for i in range(24):
            hour_start = now - timedelta(hours=23-i)
            hour_end = hour_start + timedelta(hours=1)
            count = SpotlightPost.objects.filter(
                created_at__range=(hour_start, hour_end)
            ).count()
            hourly_activity.append({
                'hour': hour_start.strftime('%H:00'),
                'posts': count
            })
        
        # Flag reasons breakdown
        flag_reasons = {}
        for choice in SpotlightFlag.REASON_CHOICES:
            count = SpotlightFlag.objects.filter(reason=choice[0]).count()
            if count > 0:
                flag_reasons[choice[1]] = count
        
        # Violation types breakdown
        violation_types = {}
        for choice in UserViolation.VIOLATION_TYPES:
            count = UserViolation.objects.filter(violation_type=choice[0]).count()
            if count > 0:
                violation_types[choice[1]] = count
        
        stats_data = {
            # Posts
            'total_posts': total_posts,
            'posts_today': posts_today,
            'posts_this_week': posts_this_week,
            'posts_this_month': posts_this_month,
            
            # Users
            'total_users': total_users,
            'active_users': active_users,
            'new_users_today': new_users_today,
            
            # Moderation
            'flagged_content': flagged_content,
            'resolved_flags': resolved_flags,
            'pending_moderation': pending_moderation,
            'violations_this_week': violations_this_week,
            
            # Engagement
            'total_likes': total_likes,
            'total_comments': total_comments,
            'engagement_rate': round(engagement_rate, 2),
            'avg_likes_per_post': round(avg_likes, 2),
            
            # Trending
            'top_tags': top_tags,
            'top_authors': top_authors,
            'hourly_activity': hourly_activity,
            
            # Breakdowns
            'flag_reasons': flag_reasons,
            'violation_types': violation_types,
        }
        
        serializer = SpotlightStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAdminUser])
    def spotlight_settings(self, request):
        """Get or update Spotlight settings"""
        settings = SpotlightSettings.get_settings()
        
        if request.method == 'PATCH':
            serializer = SpotlightSettingsSerializer(
                settings, 
                data=request.data, 
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SpotlightSettingsSerializer(settings)
        return Response(serializer.data)