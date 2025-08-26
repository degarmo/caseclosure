# cases/views.py - Updated views with template customization and deployment

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import json
import logging

from .models import Case, SpotlightPost, TemplateRegistry, DeploymentLog, CasePhoto
from .serializers import (
    CaseSerializer, 
    SpotlightPostSerializer, 
    TemplateRegistrySerializer,
    DeploymentLogSerializer,
    CasePhotoSerializer
)
from .services.deployment import RenderDeploymentService, SimpleStaticDeployment

logger = logging.getLogger(__name__)


class CaseViewSet(viewsets.ModelViewSet):

# Add this method INSIDE the CaseViewSet class in your views.py
# It should be at the same indentation level as other methods like perform_create, stats, etc.

# In cases/views.py, inside the CaseViewSet class (around line 200, after the stats method):

    @action(detail=False, methods=['get'], url_path='by-subdomain/(?P<subdomain>[^/.]+)')
    def by_subdomain(self, request, subdomain=None):
        """
        Get case by subdomain for public website rendering
        """
        try:
            # Find the case by subdomain
            case = Case.objects.get(
                subdomain=subdomain,
                is_public=True,
                is_disabled=False
            )
            
            # Check if the case is deployed
            if case.deployment_status != 'deployed':
                return Response(
                    {'error': 'This website is not yet deployed'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize the case data
            serializer = self.get_serializer(case)
            
            # Add spotlight posts if the template supports it
            spotlight_posts = []
            try:
                posts = SpotlightPost.objects.filter(
                    case=case,
                    status='published'
                ).order_by('-published_at')[:10]
                
                spotlight_posts = SpotlightPostSerializer(posts, many=True, context={'request': request}).data
            except:
                pass  # Template might not have spotlight feature
            
            response_data = serializer.data
            response_data['spotlight_posts'] = spotlight_posts
            
            return Response(response_data)
            
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching case by subdomain: {str(e)}")
            return Response(
                {'error': 'An error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    """
    ViewSet for Case model with template customization and deployment support.
    """
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        """
        Filter cases based on user permissions and account type.
        """
        try:
            user = self.request.user
            
            # Superusers and staff can see all cases
            if user.is_superuser or user.is_staff:
                return Case.objects.all().order_by('-created_at')
            
            # Check if user has a profile with special permissions
            try:
                profile = user.profile
                
                # Admin account type can see all cases
                if profile.account_type == 'admin':
                    return Case.objects.all().order_by('-created_at')
                
                # Detective can see their own cases plus cases they're assigned to
                if profile.account_type == 'detective':
                    return Case.objects.filter(
                        Q(user=user) | 
                        Q(detective_email=user.email)
                    ).distinct().order_by('-created_at')
                
                # Advocate might be able to see multiple cases
                if profile.account_type == 'advocate':
                    return Case.objects.filter(user=user).order_by('-created_at')
                
                # Verified family members see their own cases
                if profile.account_type == 'verified':
                    return Case.objects.filter(user=user).order_by('-created_at')
                
            except Exception as e:
                logger.debug(f"Error accessing profile for user {user.id}: {str(e)}")
            
            # Default: Basic users only see their own cases
            return Case.objects.filter(user=user).order_by('-created_at')
            
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return Case.objects.none()
    
    def perform_create(self, serializer):
        """
        Automatically set the user when creating a case.
        Initialize template_data based on selected template.
        """
        user = self.request.user
        
        # Check profile permissions
        try:
            if hasattr(user, 'profile'):
                profile = user.profile
                
                if not profile.can_create_cases:
                    raise PermissionDenied("You don't have permission to create cases. Please contact support.")
                
                if profile.current_cases >= profile.max_cases:
                    raise PermissionDenied(f"You have reached your maximum limit of {profile.max_cases} cases.")
                
                if not profile.phone_verified:
                    raise PermissionDenied("Please verify your phone number before creating a case.")
                
                try:
                    profile.increment_case_count()
                except Exception as e:
                    logger.warning(f"Could not increment case count: {str(e)}")
        except Exception as e:
            logger.debug(f"Profile check during case creation: {str(e)}")
        
        # Get template ID from request
        template_id = self.request.data.get('template_id', 'beacon')
        
        # Initialize template_data with default values from template schema
        try:
            template = TemplateRegistry.objects.get(template_id=template_id)
            initial_template_data = {
                'customizations': self._get_default_customizations(template.schema),
                'metadata': {
                    'created_at': timezone.now().isoformat(),
                    'template_version': template.version
                }
            }
        except TemplateRegistry.DoesNotExist:
            initial_template_data = {'customizations': {}, 'metadata': {}}
        
        # Save the case with user and initial template data
        serializer.save(
            user=user,
            template_data=initial_template_data
        )
    
    def _get_default_customizations(self, schema):
        """
        Extract default values from template schema.
        """
        customizations = {}
        
        for section_key, section_value in schema.items():
            if isinstance(section_value, dict):
                customizations[section_key] = {}
                for field_key, field_config in section_value.items():
                    if isinstance(field_config, dict) and 'default' in field_config:
                        customizations[section_key][field_key] = field_config['default']
        
        return customizations
    
    @action(detail=True, methods=['post'])
    def save_customizations(self, request, id=None):
        """
        Save template customizations for a case.
        """
        try:
            case = self.get_object()
            
            # Check ownership
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only edit your own cases.")
            
            customizations = request.data.get('customizations', {})
            
            # Update template_data
            if not case.template_data:
                case.template_data = {}
            
            case.template_data['customizations'] = customizations
            case.template_data['metadata'] = {
                'last_edited': timezone.now().isoformat(),
                'editor_version': '1.0.0'
            }
            
            case.save()
            
            return Response({
                'success': True,
                'message': 'Customizations saved successfully',
                'template_data': case.template_data
            })
            
        except Exception as e:
            logger.error(f"Error saving customizations: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def deploy(self, request, id=None):
        """
        Deploy the case website to Render/CDN.
        """
        try:
            case = self.get_object()
            
            # Check ownership
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only deploy your own cases.")
            
            # Get domain configuration
            subdomain = request.data.get('subdomain')
            custom_domain = request.data.get('custom_domain')
            
            # Validate subdomain
            if subdomain:
                if Case.objects.filter(subdomain=subdomain).exclude(id=case.id).exists():
                    return Response(
                        {'error': 'This subdomain is already taken.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                case.subdomain = subdomain
            
            if custom_domain:
                if Case.objects.filter(custom_domain=custom_domain).exclude(id=case.id).exists():
                    return Response(
                        {'error': 'This domain is already in use.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                case.custom_domain = custom_domain
            
            # Update deployment status
            case.deployment_status = 'deploying'
            case.save()
            
            # Create deployment log
            deployment_log = DeploymentLog.objects.create(
                case=case,
                action='deploy' if not case.render_service_id else 'update',
                status='started',
                details={
                    'subdomain': subdomain,
                    'custom_domain': custom_domain,
                    'template': case.template_id
                }
            )
            
            # Use deployment service (async in production)
            if settings.USE_CELERY:
                from .tasks import deploy_case_task
                deploy_case_task.delay(case.id, deployment_log.id)
            else:
                # Synchronous deployment for development
                deployment_service = RenderDeploymentService()
                result = deployment_service.deploy_case(case)
            
            return Response({
                'success': True,
                'message': 'Deployment started',
                'deployment_id': str(deployment_log.id),
                'url': case.get_full_url()
            })
            
        except Exception as e:
            logger.error(f"Error deploying case: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def deployment_status(self, request, id=None):
        """
        Check deployment status for a case.
        """
        try:
            case = self.get_object()
            
            # Get latest deployment log
            latest_log = case.deployment_logs.first()
            
            response_data = {
                'status': case.deployment_status,
                'url': case.get_full_url(),
                'ssl_status': case.ssl_status,
                'last_deployed': case.last_deployed_at.isoformat() if case.last_deployed_at else None,
                'steps': {}  # For progress tracking
            }
            
            if latest_log:
                response_data['latest_deployment'] = {
                    'id': str(latest_log.id),
                    'action': latest_log.action,
                    'status': latest_log.status,
                    'started_at': latest_log.started_at.isoformat(),
                    'completed_at': latest_log.completed_at.isoformat() if latest_log.completed_at else None,
                    'error': latest_log.error_message
                }
                
                # Add progress steps from details
                if latest_log.details:
                    response_data['steps'] = latest_log.details.get('steps', {})
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error checking deployment status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def update_template_section(self, request, id=None):
        """
        Update a specific section of template customizations.
        """
        try:
            case = self.get_object()
            
            # Check ownership
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only edit your own cases.")
            
            section = request.data.get('section')  # e.g., 'hero', 'timeline'
            section_data = request.data.get('data')
            
            if not section:
                return Response(
                    {'error': 'Section name is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Initialize template_data if needed
            if not case.template_data:
                case.template_data = {'customizations': {'sections': {}}}
            
            if 'customizations' not in case.template_data:
                case.template_data['customizations'] = {'sections': {}}
            
            if 'sections' not in case.template_data['customizations']:
                case.template_data['customizations']['sections'] = {}
            
            # Update the specific section
            case.template_data['customizations']['sections'][section] = section_data
            case.template_data['metadata'] = {
                'last_edited': timezone.now().isoformat(),
                'last_edited_section': section
            }
            
            case.save()
            
            return Response({
                'success': True,
                'message': f'Section {section} updated successfully',
                'section_data': section_data
            })
            
        except Exception as e:
            logger.error(f"Error updating template section: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def my_cases(self, request):
        """
        Get only the current user's cases.
        """
        try:
            cases = Case.objects.filter(user=request.user).order_by('-created_at')
            serializer = self.get_serializer(cases, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_cases: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve cases'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get statistics about user's cases including deployment stats.
        """
        try:
            user = request.user
            queryset = self.get_queryset()
            
            stats = {
                'total_cases': queryset.count(),
                'public_cases': queryset.filter(is_public=True).count(),
                'private_cases': queryset.filter(is_public=False).count(),
                'deployed_cases': queryset.filter(deployment_status='deployed').count(),
                'cases_with_rewards': queryset.filter(reward_amount__isnull=False).count(),
                'cases_by_template': {},
                'deployment_stats': {
                    'deployed': queryset.filter(deployment_status='deployed').count(),
                    'deploying': queryset.filter(deployment_status='deploying').count(),
                    'failed': queryset.filter(deployment_status='failed').count(),
                    'not_deployed': queryset.filter(deployment_status='not_deployed').count(),
                }
            }
            
            # Count by template
            for template in TemplateRegistry.objects.filter(is_active=True):
                count = queryset.filter(template_id=template.template_id).count()
                if count > 0:
                    stats['cases_by_template'][template.template_id] = count
            
            # Add user-specific stats if profile exists
            try:
                if hasattr(user, 'profile'):
                    profile = user.profile
                    stats.update({
                        'can_create_cases': getattr(profile, 'can_create_cases', True),
                        'current_cases': getattr(profile, 'current_cases', 0),
                        'max_cases': getattr(profile, 'max_cases', 10),
                        'remaining_cases': max(0, getattr(profile, 'max_cases', 10) - getattr(profile, 'current_cases', 0)),
                        'account_type': getattr(profile, 'account_type', 'basic'),
                        'is_verified': getattr(profile, 'identity_verified', False),
                    })
            except Exception as e:
                logger.debug(f"Could not get profile stats: {str(e)}")
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error in stats: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_destroy(self, instance):
        """
        When deleting a case, cleanup related data and decrement user's case count.
        """
        try:
            # Decrement user's case count if profile exists
            if hasattr(instance.user, 'profile'):
                instance.user.profile.decrement_case_count()
            
            # TODO: Clean up deployed resources if needed
            # if instance.render_service_id:
            #     deployment_service = RenderDeploymentService()
            #     deployment_service.delete_service(instance)
            
        except Exception as e:
            logger.warning(f"Error during case deletion cleanup: {str(e)}")
        
        super().perform_destroy(instance)


class SpotlightPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Spotlight blog posts.
    """
    serializer_class = SpotlightPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter posts based on case ownership.
        """
        user = self.request.user
        
        # Get case_id from URL params if provided
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            # Filter by specific case
            return SpotlightPost.objects.filter(
                case__id=case_id,
                case__user=user
            ).order_by('-created_at')
        
        # Return all posts for user's cases
        return SpotlightPost.objects.filter(
            case__user=user
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """
        Create a new spotlight post.
        """
        case_id = self.request.data.get('case_id')
        
        try:
            case = Case.objects.get(id=case_id, user=self.request.user)
        except Case.DoesNotExist:
            raise ValidationError("Case not found or you don't have permission.")
        
        # Save the post
        post = serializer.save(case=case)
        
        # Update case's template_data to include this post
        if not case.template_data:
            case.template_data = {}
        
        if 'spotlight_posts' not in case.template_data:
            case.template_data['spotlight_posts'] = []
        
        # Add post reference to case
        case.template_data['spotlight_posts'].append({
            'id': str(post.id),
            'title': post.title,
            'excerpt': post.excerpt,
            'published_at': post.published_at.isoformat() if post.published_at else None
        })
        
        case.save()
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish a spotlight post.
        """
        post = self.get_object()
        
        if post.case.user != request.user:
            raise PermissionDenied("You can only publish your own posts.")
        
        post.status = 'published'
        post.published_at = timezone.now()
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        """
        Schedule a post for future publication.
        """
        post = self.get_object()
        
        if post.case.user != request.user:
            raise PermissionDenied("You can only schedule your own posts.")
        
        scheduled_time = request.data.get('scheduled_for')
        if not scheduled_time:
            return Response(
                {'error': 'scheduled_for is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        post.status = 'scheduled'
        post.scheduled_for = scheduled_time
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)


class TemplateRegistryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for available templates (read-only).
    """
    serializer_class = TemplateRegistrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only active templates.
        """
        queryset = TemplateRegistry.objects.filter(is_active=True)
        
        # Filter by premium status based on user's account
        user = self.request.user
        if hasattr(user, 'profile'):
            if user.profile.account_type not in ['pro', 'enterprise', 'admin']:
                # Basic users only see non-premium templates
                queryset = queryset.filter(is_premium=False)
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['get'])
    def schema(self, request, pk=None):
        """
        Get the customization schema for a specific template.
        """
        template = self.get_object()
        
        return Response({
            'template_id': template.template_id,
            'name': template.name,
            'schema': template.schema,
            'features': template.features,
            'version': template.version
        })
    
    @action(detail=False, methods=['get'])
    def compare(self, request):
        """
        Compare features of all available templates.
        """
        templates = self.get_queryset()
        
        comparison = []
        for template in templates:
            comparison.append({
                'id': template.template_id,
                'name': template.name,
                'description': template.description,
                'features': template.features,
                'is_premium': template.is_premium,
                'preview_image': template.preview_image
            })
        
        return Response(comparison)


class CasePhotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case photos.
    """
    serializer_class = CasePhotoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter photos by case ownership.
        """
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            return CasePhoto.objects.filter(
                case__id=case_id,
                case__user=self.request.user
            ).order_by('order', 'uploaded_at')
        
        return CasePhoto.objects.filter(
            case__user=self.request.user
        ).order_by('order', 'uploaded_at')
    
    def perform_create(self, serializer):
        """
        Upload a new photo for a case.
        """
        case_id = self.request.data.get('case_id')
        
        try:
            case = Case.objects.get(id=case_id, user=self.request.user)
        except Case.DoesNotExist:
            raise ValidationError("Case not found or you don't have permission.")
        
        serializer.save(case=case)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder photos for a case.
        """
        case_id = request.data.get('case_id')
        photo_ids = request.data.get('photo_ids', [])
        
        try:
            case = Case.objects.get(id=case_id, user=request.user)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update order for each photo
        for index, photo_id in enumerate(photo_ids):
            CasePhoto.objects.filter(
                id=photo_id,
                case=case
            ).update(order=index)
        
        return Response({'success': True, 'message': 'Photos reordered successfully'})


class DeploymentLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing deployment logs (read-only).
    """
    serializer_class = DeploymentLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter logs by case ownership.
        """
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            return DeploymentLog.objects.filter(
                case__id=case_id,
                case__user=self.request.user
            ).order_by('-started_at')
        
        return DeploymentLog.objects.filter(
            case__user=self.request.user
        ).order_by('-started_at')