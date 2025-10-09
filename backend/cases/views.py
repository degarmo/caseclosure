# cases/views.py - Updated views with template customization and deployment

from rest_framework import viewsets, status
from rest_framework.views import APIView  
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.throttling import UserRateThrottle
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.core.cache import cache
from django.core.mail import send_mail
import cloudinary
from cloudinary.uploader import upload
import json
import logging
import os
import re
import time

from .models import Case, SpotlightPost, TemplateRegistry, DeploymentLog, CasePhoto, LEOInvite, CaseAccess
from .serializers import (
    CaseSerializer, 
    SpotlightPostSerializer, 
    TemplateRegistrySerializer,
    DeploymentLogSerializer,
    CasePhotoSerializer
)
from .services.deployment import get_deployment_service

logger = logging.getLogger(__name__)


# Custom throttle class for deployment rate limiting
class DeploymentRateThrottle(UserRateThrottle):
    """Limit deployments to prevent abuse - 10 per hour per user"""
    rate = '10/hour'


# Reserved subdomains that cannot be used
RESERVED_SUBDOMAINS = {
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog',
    'dashboard', 'support', 'help', 'docs', 'status',
    'cdn', 'assets', 'static', 'media', 'files', 'images',
    'staging', 'dev', 'test', 'demo', 'sandbox',
    'account', 'accounts', 'auth', 'login', 'signup',
    'register', 'logout', 'profile', 'settings',
    'billing', 'payment', 'checkout', 'subscribe'
}


class ImageUploadView(APIView):
    """
    Generic image upload endpoint for customizations.
    Uploads to Cloudinary and returns the URL.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"[DEBUG] Upload request from user: {request.user}")
        
        image = request.FILES.get('image')
        if not image:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            print(f"[DEBUG] Uploading image: {image.name}, size: {image.size}")
            
            result = upload(
                image,
                folder="caseclosure/customizations",
                resource_type="image",
                allowed_formats=['jpg', 'jpeg', 'png', 'gif', 'webp'],
                transformation=[
                    {'quality': 'auto:good'},
                    {'fetch_format': 'auto'}
                ]
            )
            
            print(f"[DEBUG] Cloudinary upload successful: {result['secure_url']}")
            
            return Response({
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'width': result.get('width'),
                'height': result.get('height')
            })
            
        except Exception as e:
            print(f"[ERROR] Cloudinary upload failed: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CaseViewSet(viewsets.ModelViewSet):
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
            
            if user.is_superuser or user.is_staff:
                return Case.objects.all().order_by('-created_at')
            
            try:
                profile = user.profile
                
                if profile.account_type == 'admin':
                    return Case.objects.all().order_by('-created_at')
                
                if profile.account_type == 'detective':
                    return Case.objects.filter(
                        Q(user=user) | 
                        Q(detective_email=user.email)
                    ).distinct().order_by('-created_at')
                
                if profile.account_type == 'advocate':
                    return Case.objects.filter(user=user).order_by('-created_at')
                
                if profile.account_type == 'verified':
                    return Case.objects.filter(user=user).order_by('-created_at')
                
            except Exception as e:
                logger.debug(f"Error accessing profile for user {user.id}: {str(e)}")
            
            return Case.objects.filter(user=user).order_by('-created_at')
            
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return Case.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Override create to handle photo upload separately."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        case = serializer.instance
        
        if 'victim_photo' in request.FILES:
            victim_photo = request.FILES['victim_photo']
            self._handle_victim_photo_upload(case, victim_photo)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to handle photo upload separately."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if 'victim_photo' in request.FILES:
            victim_photo = request.FILES['victim_photo']
            self._handle_victim_photo_upload(instance, victim_photo)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)
    
    def _handle_victim_photo_upload(self, case, photo_file):
        """Helper method to handle victim photo upload."""
        try:
            existing_primary = CasePhoto.objects.filter(
                case=case,
                is_primary=True
            ).first()
            
            if existing_primary:
                if existing_primary.image:
                    default_storage.delete(existing_primary.image.name)
                existing_primary.delete()
            
            case_photo = CasePhoto.objects.create(
                case=case,
                image=photo_file,
                caption='Primary victim photo',
                is_primary=True,
                is_public=True,
                order=0
            )
            
            logger.info(f"Victim photo uploaded for case {case.id}: {case_photo.image.url}")
            
            if hasattr(case, 'victim_photo'):
                case.victim_photo = case_photo.image
                case.save(update_fields=['victim_photo'])
            
            return case_photo
            
        except Exception as e:
            logger.error(f"Error uploading victim photo for case {case.id}: {str(e)}")
            raise ValidationError(f"Failed to upload photo: {str(e)}")
    
    def perform_create(self, serializer):
        """Automatically set the user when creating a case."""
        user = self.request.user
        
        try:
            if hasattr(user, 'profile'):
                profile = user.profile
                
                if not profile.can_create_cases:
                    raise PermissionDenied("You don't have permission to create cases.")
                
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
        
        template_id = self.request.data.get('template_id', 'beacon')
        
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
        
        serializer.save(
            user=user,
            template_data=initial_template_data
        )
    
    def _get_default_customizations(self, schema):
        """Extract default values from template schema."""
        customizations = {}
        
        for section_key, section_value in schema.items():
            if isinstance(section_value, dict):
                customizations[section_key] = {}
                for field_key, field_config in section_value.items():
                    if isinstance(field_config, dict) and 'default' in field_config:
                        customizations[section_key][field_key] = field_config['default']
        
        return customizations
    
    @action(detail=True, methods=['post'])
    def upload_victim_photo(self, request, id=None):
        """Dedicated endpoint for uploading victim photo."""
        case = self.get_object()
        
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only upload photos for your own cases.")
        
        if 'victim_photo' not in request.FILES:
            return Response(
                {'error': 'No photo file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            photo = self._handle_victim_photo_upload(case, request.FILES['victim_photo'])
            
            return Response({
                'success': True,
                'message': 'Photo uploaded successfully',
                'photo_url': photo.image.url if photo.image else None,
                'photo_id': photo.id
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def save_customizations(self, request, id=None):
        """Save customizations with improved error handling and logging."""
        try:
            case = self.get_object()
            
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only edit your own cases.")
            
            customizations = request.data.get('customizations', {})
            
            if not isinstance(customizations, dict):
                return Response(
                    {'error': 'Customizations must be an object/dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cleaned_customizations = {}
            for key, value in customizations.items():
                if value is not None:
                    cleaned_customizations[key] = value
            
            logger.info(f"Saving {len(cleaned_customizations)} customization fields for case {id}")
            
            if not case.template_data:
                case.template_data = {}
            
            if not isinstance(case.template_data, dict):
                case.template_data = {}
            
            case.template_data['customizations'] = cleaned_customizations
            case.template_data['last_saved'] = timezone.now().isoformat()
            
            try:
                case.save(update_fields=['template_data'])
                logger.info(f"Successfully saved customizations for case {id}")
            except Exception as save_error:
                logger.error(f"Database save error for case {id}: {str(save_error)}")
                return Response(
                    {'error': f'Failed to save to database: {str(save_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'success': True,
                'message': 'Customizations saved successfully',
                'template_data': case.template_data,
                'customization_count': len(cleaned_customizations)
            })
            
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Unexpected error saving customizations for case {id}: {str(e)}")
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['POST'])
    def check_subdomain(self, request):
        """Check if a subdomain is available for use."""
        subdomain = request.data.get('subdomain', '').lower().strip()
        case_id = request.data.get('case_id')  # ✅ ADD THIS LINE
        
        if not subdomain:
            return Response({
                'available': False,
                'message': 'Subdomain is required'
            })
        
        if len(subdomain) < 3:
            return Response({
                'available': False,
                'message': 'Subdomain must be at least 3 characters'
            })
        
        if not re.match(r'^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$', subdomain):
            return Response({
                'available': False,
                'message': 'Invalid format. Use only lowercase letters, numbers, and hyphens.'
            })
        
        if subdomain in RESERVED_SUBDOMAINS:
            return Response({
                'available': False,
                'message': 'This subdomain is reserved'
            })
        
        # ✅ FIXED: Exclude current case from availability check
        query = Case.objects.filter(subdomain=subdomain)
        if case_id:
            query = query.exclude(id=case_id)
        exists = query.exists()
        
        return Response({
            'available': not exists,
            'message': 'Available!' if not exists else 'This subdomain is already taken',
            'subdomain': subdomain
        })

    @action(detail=True, methods=['post'])
    def deploy(self, request, id=None):
        """Deploy the case to its subdomain with full production safeguards."""
        case = self.get_object()
        
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only deploy your own cases.")
        
        # ✅ SAFE CACHE OPERATIONS - Handle Redis not being available
        lock_key = f'deploying_case_{case.id}'
        try:
            if cache.get(lock_key):
                return Response(
                    {
                        'error': 'A deployment is already in progress for this case. Please wait.',
                        'status': 'deploying'
                    },
                    status=status.HTTP_409_CONFLICT
                )
            cache.set(lock_key, True, 300)
        except Exception as cache_error:
            logger.warning(f"Cache unavailable during deploy lock check: {cache_error}")
            # Continue without cache lock in development environments
        
        try:
            validation_errors = []
            
            if not case.first_name:
                validation_errors.append('First name is required')
            if not case.last_name:
                validation_errors.append('Last name is required')
            if not case.case_title:
                validation_errors.append('Case title is required')
            if not case.case_type:
                validation_errors.append('Case type is required')
            if not case.template_id:
                validation_errors.append('Template must be selected')
            
            if validation_errors:
                return Response(
                    {
                        'error': 'Cannot deploy incomplete case',
                        'validation_errors': validation_errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            subdomain = request.data.get('subdomain', '').lower().strip()
            
            if subdomain:
                if not re.match(r'^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$', subdomain):
                    return Response(
                        {
                            'error': 'Invalid subdomain format',
                            'details': 'Subdomain must start and end with a letter or number.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(subdomain) < 3 or len(subdomain) > 50:
                    return Response(
                        {'error': 'Subdomain must be between 3 and 50 characters'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if subdomain in RESERVED_SUBDOMAINS:
                    return Response(
                        {
                            'error': 'This subdomain is reserved',
                            'suggestion': f'{subdomain}-{case.first_name.lower()}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if Case.objects.filter(subdomain=subdomain).exclude(id=case.id).exists():
                    counter = 1
                    suggestion = f"{subdomain}-{counter}"
                    while Case.objects.filter(subdomain=suggestion).exists():
                        counter += 1
                        suggestion = f"{subdomain}-{counter}"
                    
                    return Response(
                        {
                            'error': 'This subdomain is already taken',
                            'suggestion': suggestion
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                case.subdomain = subdomain
                
            elif not case.subdomain:
                base_subdomain = f"{case.first_name}-{case.last_name}".lower()
                base_subdomain = re.sub(r'[^a-z0-9-]', '', base_subdomain)
                base_subdomain = re.sub(r'-+', '-', base_subdomain)
                base_subdomain = base_subdomain[:40].strip('-')
                
                if not base_subdomain or len(base_subdomain) < 3:
                    return Response(
                        {
                            'error': 'Cannot auto-generate subdomain from name',
                            'details': 'Please provide a subdomain manually'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if base_subdomain in RESERVED_SUBDOMAINS:
                    base_subdomain = f"{base_subdomain}-case"
                
                subdomain = base_subdomain
                counter = 1
                
                while Case.objects.filter(subdomain=subdomain).exclude(id=case.id).exists():
                    subdomain = f"{base_subdomain}-{counter}"
                    counter += 1
                    if counter > 1000:
                        return Response(
                            {'error': 'Could not generate unique subdomain. Please provide one manually.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                
                case.subdomain = subdomain
            
            with transaction.atomic():
                case.save(update_fields=['subdomain'])
                
                case.deployment_status = 'deploying'
                case.save(update_fields=['deployment_status'])
                
                try:
                    deployment_service = get_deployment_service()
                    result = deployment_service.deploy_case(case)
                    
                    if not result.get('success'):
                        raise Exception(result.get('error', 'Deployment service returned failure'))
                    
                    logger.info(f"Successfully deployed case {id} to {case.subdomain}.caseclosure.org")
                    
                    return Response({
                        'success': True,
                        'message': f'Your website is now live at {case.subdomain}.caseclosure.org!',
                        'subdomain': case.subdomain,
                        'url': case.deployment_url,
                        'status': 'deployed',
                        'deployed_at': case.last_deployed_at.isoformat() if case.last_deployed_at else None
                    })
                    
                except Exception as deploy_error:
                    logger.error(f"Deployment failed for case {id}: {str(deploy_error)}")
                    
                    case.deployment_status = 'failed'
                    case.deployment_error = str(deploy_error)
                    case.is_public = False
                    case.save(update_fields=['deployment_status', 'deployment_error', 'is_public'])
                    
                    error_message = str(deploy_error)
                    if 'timeout' in error_message.lower():
                        error_message = 'Deployment timed out. Please try again in a few minutes.'
                    elif 'connection' in error_message.lower():
                        error_message = 'Network error during deployment. Please try again.'
                    
                    return Response(
                        {
                            'success': False,
                            'error': error_message,
                            'status': 'failed',
                            'details': str(deploy_error) if settings.DEBUG else None
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected deployment error for case {id}: {str(e)}", exc_info=True)
            
            try:
                case.deployment_status = 'failed'
                case.deployment_error = str(e)
                case.save(update_fields=['deployment_status', 'deployment_error'])
            except:
                pass
            
            return Response(
                {
                    'error': 'An unexpected error occurred during deployment',
                    'details': str(e) if settings.DEBUG else 'Please contact support if this persists'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        finally:
            # ✅ SAFE CACHE DELETE
            try:
                cache.delete(lock_key)
            except Exception as cache_error:
                logger.warning(f"Cache unavailable during lock cleanup: {cache_error}")
                # Ignore cache errors during cleanup

    @action(detail=True, methods=['get'])
    def deployment_status(self, request, id=None):
        """Get detailed deployment status with enhanced information."""
        case = self.get_object()
        
        latest_log = case.deployment_logs.first()
        
        # ✅ SAFE CACHE CHECK
        lock_key = f'deploying_case_{case.id}'
        is_deploying = False
        try:
            is_deploying = cache.get(lock_key) is not None
        except Exception as cache_error:
            logger.warning(f"Cache unavailable during status check: {cache_error}")
            # Fall back to checking deployment_status from database
            is_deploying = case.deployment_status == 'deploying'
        
        response_data = {
            'deployment_status': case.deployment_status,
            'subdomain': case.subdomain,
            'deployment_url': case.get_full_url(),
            'is_public': case.is_public,
            'is_disabled': case.is_disabled,
            'last_deployed_at': case.last_deployed_at.isoformat() if case.last_deployed_at else None,
            'deployment_error': case.deployment_error if case.deployment_error else None,
            'is_deploying': is_deploying
        }
        
        if latest_log:
            response_data['latest_deployment'] = {
                'id': str(latest_log.id),
                'action': latest_log.action,
                'status': latest_log.status,
                'started_at': latest_log.started_at.isoformat(),
                'completed_at': latest_log.completed_at.isoformat() if latest_log.completed_at else None,
                'duration_seconds': latest_log.duration_seconds,
                'error': latest_log.error_message
            }
        
        response_data['total_deployments'] = case.deployment_logs.count()
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def undeploy(self, request, id=None):
        """Take the case website offline."""
        case = self.get_object()
        
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only manage your own cases.")
        
        if case.deployment_status == 'not_deployed' and not case.is_public:
            return Response({
                'success': True,
                'message': 'Website is already offline',
                'status': 'not_deployed'
            })
        
        try:
            with transaction.atomic():
                deployment_service = get_deployment_service()
                result = deployment_service.undeploy_case(case)
                
                if result.get('success'):
                    logger.info(f"Successfully undeployed case {id}")
                    
                    return Response({
                        'success': True,
                        'message': 'Website has been taken offline',
                        'status': 'not_deployed'
                    })
                else:
                    raise Exception(result.get('error', 'Undeploy failed'))
        
        except Exception as e:
            logger.error(f"Undeploy failed for case {id}: {str(e)}")
            
            return Response(
                {'success': False, 'error': f'Failed to take website offline: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
    @action(detail=False, methods=['get'])
    def my_cases(self, request):
        """Get only the current user's cases."""
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
        """Get statistics about user's cases including deployment stats."""
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
            
            for template in TemplateRegistry.objects.filter(is_active=True):
                count = queryset.filter(template_id=template.template_id).count()
                if count > 0:
                    stats['cases_by_template'][template.template_id] = count
            
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
    
    @action(detail=False, methods=['get'], url_path='by-subdomain/(?P<subdomain>[^/.]+)', 
            permission_classes=[AllowAny])
    def by_subdomain(self, request, subdomain=None):
        """Get case by subdomain for public website rendering."""
        try:
            case = Case.objects.get(
                subdomain=subdomain,
                is_public=True,
                is_disabled=False
            )
            
            if case.deployment_status != 'deployed':
                return Response(
                    {'error': 'This website is not yet deployed'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(case)
            
            spotlight_posts = []
            try:
                posts = SpotlightPost.objects.filter(
                    case=case,
                    status='published'
                ).order_by('-published_at')[:10]
                
                spotlight_posts = SpotlightPostSerializer(posts, many=True, context={'request': request}).data
            except:
                pass
            
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
    
    def perform_destroy(self, instance):
        """When deleting a case, cleanup related data."""
        try:
            if hasattr(instance.user, 'profile'):
                instance.user.profile.decrement_case_count()
        except Exception as e:
            logger.warning(f"Error during case deletion cleanup: {str(e)}")
        
        super().perform_destroy(instance)


class SpotlightPostViewSet(viewsets.ModelViewSet):
    """ViewSet for Spotlight blog posts."""
    serializer_class = SpotlightPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter posts based on case ownership."""
        user = self.request.user
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            return SpotlightPost.objects.filter(
                case__id=case_id,
                case__user=user
            ).order_by('-created_at')
        
        return SpotlightPost.objects.filter(
            case__user=user
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create a new spotlight post."""
        case_id = self.request.data.get('case_id')
        
        try:
            case = Case.objects.get(id=case_id, user=self.request.user)
        except Case.DoesNotExist:
            raise ValidationError("Case not found or you don't have permission.")
        
        serializer.save(case=case)


class TemplateRegistryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for available templates (read-only)."""
    serializer_class = TemplateRegistrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only active templates."""
        queryset = TemplateRegistry.objects.filter(is_active=True)
        
        user = self.request.user
        if hasattr(user, 'profile'):
            if user.profile.account_type not in ['pro', 'enterprise', 'admin']:
                queryset = queryset.filter(is_premium=False)
        
        return queryset.order_by('name')


class CasePhotoViewSet(viewsets.ModelViewSet):
    """ViewSet for managing case photos."""
    serializer_class = CasePhotoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter photos by case ownership."""
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
        """Upload a new photo for a case."""
        case_id = self.request.data.get('case_id')
        
        try:
            case = Case.objects.get(id=case_id, user=self.request.user)
        except Case.DoesNotExist:
            raise ValidationError("Case not found or you don't have permission.")
        
        is_primary = self.request.data.get('is_primary', False)
        
        if is_primary:
            CasePhoto.objects.filter(case=case, is_primary=True).update(is_primary=False)
        
        serializer.save(case=case)


class DeploymentLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing deployment logs (read-only)."""
    serializer_class = DeploymentLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter logs by case ownership."""
        case_id = self.request.query_params.get('case_id')
        
        if case_id:
            return DeploymentLog.objects.filter(
                case__id=case_id,
                case__user=self.request.user
            ).order_by('-started_at')
        
        return DeploymentLog.objects.filter(
            case__user=self.request.user
        ).order_by('-started_at')