# cases/views.py - Updated views with template customization and deployment

from rest_framework import viewsets, status
from rest_framework.views import APIView  
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.throttling import UserRateThrottle
from django.db.models import Q, F
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.template.loader import render_to_string  # ADD THIS
from django.contrib.auth.models import User  # ADD THIS
from datetime import timedelta 
from django.core.cache import cache
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
import cloudinary
from cloudinary.uploader import upload
import json
import logging
import os
import re
import time
import uuid

from .models import (Case, SpotlightPost, TemplateRegistry, DeploymentLog, CasePhoto, CaseAccess, CaseInvitation)
from .serializers import (
    CaseSerializer, 
    SpotlightPostSerializer, 
    TemplateRegistrySerializer,
    DeploymentLogSerializer,
    CasePhotoSerializer,
    CaseInvitationSerializer,
    CreateCaseInvitationSerializer
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
        Includes:
        1. Cases owned by user
        2. Cases where user is detective/LEO/assigned
        3. Cases where user has CaseAccess permission (ANY user)
        """
        try:
            user = self.request.user
            
            if user.is_superuser or user.is_staff:
                return Case.objects.all().order_by('-created_at')
            
            # Get case IDs where user has CaseAccess permission (for ALL users)
            from cases.models import CaseAccess
            accessible_case_ids = CaseAccess.objects.filter(
                user=user,
                accepted=True
            ).values_list('case_id', flat=True)
            
            try:
                profile = user.profile
                
                if profile.account_type == 'admin':
                    return Case.objects.all().order_by('-created_at')
                
                # LEO and detective users get the same access
                if profile.account_type in ['detective', 'leo']:
                    # Police/Detectives/LEO can see:
                    # 1. Cases assigned to them directly
                    # 2. Cases where they have CaseAccess permission
                    # 3. Cases they own
                    return Case.objects.filter(
                        Q(user=user) | 
                        Q(detective_email=user.email) |
                        Q(id__in=accessible_case_ids)
                    ).distinct().order_by('-created_at')
                
                if profile.account_type == 'advocate':
                    # Advocates can see their own cases + cases with CaseAccess
                    return Case.objects.filter(
                        Q(user=user) |
                        Q(id__in=accessible_case_ids)
                    ).distinct().order_by('-created_at')
                
                if profile.account_type == 'verified':
                    # Verified users can see their own cases + cases with CaseAccess
                    return Case.objects.filter(
                        Q(user=user) |
                        Q(id__in=accessible_case_ids)
                    ).distinct().order_by('-created_at')
                
            except Exception as e:
                logger.debug(f"Error accessing profile for user {user.id}: {str(e)}")
            
            # Default fallback: owned cases + cases with CaseAccess
            return Case.objects.filter(
                Q(user=user) |
                Q(id__in=accessible_case_ids)
            ).distinct().order_by('-created_at')
            
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
    # Add these methods to your CaseViewSet class in cases/views.py

    @action(detail=True, methods=['get'])
    def access_list(self, request, id=None):
        """Get all users with access to this case"""
        case = self.get_object()
        
        # Check permissions - only case owner or admin can see this
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only manage access for your own cases")
        
        try:
            # Get all CaseAccess records for this case
            accesses = CaseAccess.objects.filter(case=case).select_related('user')
            
            access_list = []
            for access in accesses:
                access_list.append({
                    'id': access.id,
                    'user_id': access.user.id,
                    'email': access.user.email,
                    'first_name': access.user.first_name,
                    'last_name': access.user.last_name,
                    'account_type': access.user.account_type,
                    'access_level': access.access_level,
                    'can_view_tips': access.can_view_tips,
                    'can_view_tracking': access.can_view_tracking,
                    'can_view_personal_info': access.can_view_personal_info,
                    'can_export_data': access.can_export_data,
                    'invited_at': access.invited_at.isoformat() if access.invited_at else None,
                    'invited_by_email': access.invited_by.email if access.invited_by else None,
                    'accepted': access.accepted,
                    'accepted_at': access.accepted_at.isoformat() if access.accepted_at else None,
                    'last_accessed': access.last_accessed.isoformat() if access.last_accessed else None,
                    'access_count': access.access_count,
                })
            
            return Response({
                'case_id': str(case.id),
                'case_title': case.case_title,
                'total_access_count': len(access_list),
                'access_list': access_list
            })
            
        except Exception as e:
            logger.error(f"Error fetching case access list: {str(e)}")
            return Response(
                {'error': 'Failed to fetch access list'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def revoke_access(self, request, id=None):
        """Revoke access for a user from this case"""
        case = self.get_object()
        
        # Check permissions - only case owner or admin can revoke access
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only manage access for your own cases")
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # Find and delete the CaseAccess record
            access = CaseAccess.objects.filter(case=case, user=user).first()
            
            if not access:
                return Response(
                    {'error': 'User does not have access to this case'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Log the revocation
            user_email = user.email
            access.delete()
            
            logger.info(f"Access revoked for {user_email} to case {case.id} by {request.user.email}")
            
            return Response({
                'success': True,
                'message': f'Access revoked for {user_email}',
                'revoked_user': user_email,
                'case_id': str(case.id)
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error revoking access: {str(e)}")
            return Response(
                {'error': 'Failed to revoke access'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_access_permissions(self, request, id=None):
        """Update permissions for a user's case access"""
        case = self.get_object()
        
        # Check permissions
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only manage access for your own cases")
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            access = CaseAccess.objects.filter(case=case, user=user).first()
            
            if not access:
                return Response(
                    {'error': 'User does not have access to this case'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update permissions
            if 'can_view_tips' in request.data:
                access.can_view_tips = request.data['can_view_tips']
            if 'can_view_tracking' in request.data:
                access.can_view_tracking = request.data['can_view_tracking']
            if 'can_view_personal_info' in request.data:
                access.can_view_personal_info = request.data['can_view_personal_info']
            if 'can_export_data' in request.data:
                access.can_export_data = request.data['can_export_data']
            if 'access_level' in request.data:
                access.access_level = request.data['access_level']
            
            access.save()
            
            logger.info(f"Permissions updated for {user.email} to case {case.id}")
            
            return Response({
                'success': True,
                'message': f'Permissions updated for {user.email}',
                'updated_user': user.email,
                'permissions': {
                    'can_view_tips': access.can_view_tips,
                    'can_view_tracking': access.can_view_tracking,
                    'can_view_personal_info': access.can_view_personal_info,
                    'can_export_data': access.can_export_data,
                }
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating permissions: {str(e)}")
            return Response(
                {'error': 'Failed to update permissions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# cases/views.py
# Find your existing SpotlightPostViewSet class and REPLACE it with this entire class

class SpotlightPostViewSet(viewsets.ModelViewSet):
    """ViewSet for case-specific Spotlight blog posts with permissions."""
    serializer_class = SpotlightPostSerializer
    
    def get_permissions(self):
        """Public can view, authenticated can create/edit their own posts."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter posts based on permissions and filters."""
        queryset = SpotlightPost.objects.select_related('case').all()
        
        # Filter by case_id if provided
        case_id = self.request.query_params.get('case_id')
        if case_id:
            queryset = queryset.filter(case__id=case_id)
        
        # Filter by case subdomain (for public template pages)
        subdomain = self.request.query_params.get('subdomain')
        if subdomain:
            queryset = queryset.filter(case__subdomain=subdomain)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        
        # Handle permissions
        if self.request.user.is_authenticated:
            if self.request.user.is_staff or self.request.user.is_superuser:
                # Admin can see all posts
                if status_filter:
                    queryset = queryset.filter(status=status_filter)
            else:
                # Users can see their own posts (any status) or published posts from others
                queryset = queryset.filter(
                    Q(case__user=self.request.user) |
                    Q(status='published', published_at__lte=timezone.now())
                )
                if status_filter:
                    queryset = queryset.filter(
                        case__user=self.request.user,
                        status=status_filter
                    )
        else:
            # Public can only see published posts
            queryset = queryset.filter(
                status='published',
                published_at__lte=timezone.now()
            )
        
        return queryset.order_by('-is_pinned', '-published_at', '-created_at')
    
    def perform_create(self, serializer):
        """Create a new spotlight post with validation."""
        case_id = self.request.data.get('case')
        
        if not case_id:
            raise ValidationError("case is required")
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            raise ValidationError("Case not found")
        
        # Permission check: User must own the case OR be admin
        if not (case.user == self.request.user or 
                self.request.user.is_staff or 
                self.request.user.is_superuser):
            raise PermissionDenied("You can only create posts for your own cases")
        
        # Set published_at if status is published
        if serializer.validated_data.get('status') == 'published':
            if not serializer.validated_data.get('published_at'):
                serializer.validated_data['published_at'] = timezone.now()
        
        serializer.save(case=case)
    
    def perform_update(self, serializer):
        """Update existing post with permission check."""
        instance = self.get_object()
        
        # Permission check
        if not (instance.case.user == self.request.user or 
                self.request.user.is_staff or 
                self.request.user.is_superuser):
            raise PermissionDenied("You can only edit posts for your own cases")
        
        # Handle status changes
        if serializer.validated_data.get('status') == 'published' and not instance.published_at:
            serializer.validated_data['published_at'] = timezone.now()
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete post with permission check."""
        if not (instance.case.user == self.request.user or 
                self.request.user.is_staff or 
                self.request.user.is_superuser):
            raise PermissionDenied("You can only delete posts for your own cases")
        
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def increment_view(self, request, pk=None):
        """Increment view count for a post."""
        post = self.get_object()
        post.view_count = F('view_count') + 1
        post.save(update_fields=['view_count'])
        post.refresh_from_db()
        return Response({'view_count': post.view_count})


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
    

# ============================================================================
# CASE INVITATION VIEWSET
# ============================================================================

# cases/views.py - CaseInvitationViewSet COMPLETE

class CaseInvitationViewSet(viewsets.ModelViewSet):
    """Handle case access invitations for LEO, investigators, advocates"""
    queryset = CaseInvitation.objects.all()
    serializer_class = CaseInvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateCaseInvitationSerializer
        return CaseInvitationSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new invitation for a case.
        Two scenarios:
        1. User doesn't exist: Create invitation, send email with signup link
        2. User exists: Grant access immediately, send notification
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        case = Case.objects.get(id=data['case_id'])
        invitee_email = data['invitee_email']
        
        # Map invitation_type to access_level for CaseAccess
        access_level_mapping = {
            'police': 'leo',
            'investigator': 'private_investigator',
            'advocate': 'advocate',
            'family': 'collaborator',
            'other': 'viewer',
        }
        access_level = access_level_mapping.get(data['user_type'], 'viewer')
        
        # Check if user exists
        try:
            User = get_user_model()
            user = User.objects.get(email=invitee_email)
            logger.info(f"[INVITATION] User EXISTS: {user.email}")
            
            # User exists - grant access immediately
            access, created = CaseAccess.objects.get_or_create(
                case=case,
                user=user,
                defaults={
                    'access_level': access_level,
                    'invited_by': request.user,
                    'accepted': True,
                    'accepted_at': timezone.now(),
                    'can_view_tips': True,
                    'can_view_tracking': False,
                    'can_view_personal_info': False,
                    'can_export_data': False,
                }
            )
            
            logger.info(f"[INVITATION] CaseAccess created: {created}, ID: {access.id}")
            
            # Send notification email to existing user
            try:
                logger.info(f"[INVITATION] Calling _send_existing_user_notification()")
                self._send_existing_user_notification(
                    user=user,
                    case=case,
                    inviter=request.user,
                    access_type=data['user_type'],
                    subject_line=data['subject_line'],
                    message_body=data['message_body']
                )
                logger.info(f"[INVITATION] ✓ Notification email method completed")
            except Exception as email_error:
                logger.error(f"[INVITATION] ✗ Notification email error: {str(email_error)}", exc_info=True)
            
            return Response(
                {
                    'status': 'success',
                    'message': f'Access granted to {user.get_full_name() or user.email}. Notification sent.',
                    'type': 'existing_user',
                    'case_access_id': str(access.id)
                },
                status=status.HTTP_201_CREATED
            )
        
        except User.DoesNotExist:
            logger.info(f"[INVITATION] User DOES NOT EXIST: {invitee_email}")
            
            # Generate unique invitation code
            invitation_code = str(uuid.uuid4())
            
            # User doesn't exist - create invitation
            invitation, created = CaseInvitation.objects.get_or_create(
                case=case,
                invitee_email=invitee_email,
                defaults={
                    'invitee_name': data['invitee_name'],
                    'invitation_type': data['user_type'],
                    'invitee_account_type': CaseInvitation.get_account_type_from_invitation_type(data['user_type']),
                    'invited_by': request.user,
                    'subject_line': data['subject_line'],
                    'message_body': data['message_body'],
                    'invitation_code': invitation_code,
                    'expires_at': timezone.now() + timedelta(days=30),
                    'status': 'pending'
                }
            )
            
            logger.info(f"[INVITATION] Invitation created: {created}, ID: {invitation.id}")
            
            if created:
                # Send invitation email to new user
                try:
                    logger.info(f"[INVITATION] Calling _send_invitation_email()")
                    self._send_invitation_email(
                        invitation=invitation,
                        inviter=request.user
                    )
                    logger.info(f"[INVITATION] ✓ Invitation email method completed")
                except Exception as email_error:
                    logger.error(f"[INVITATION] ✗ Invitation email error: {str(email_error)}", exc_info=True)
                
                return Response(
                    {
                        'status': 'success',
                        'message': f'Invitation sent to {invitee_email}',
                        'type': 'new_user',
                        'invitation_id': str(invitation.id),
                        'expires_in_days': 30
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {
                        'status': 'already_invited',
                        'message': f'{invitee_email} has already been invited to this case',
                        'type': 'duplicate',
                        'invitation_id': str(invitation.id)
                    },
                    status=status.HTTP_200_OK
                )
    
    @action(detail=False, methods=['get'])
    def my_pending_invitations(self, request):
        """Get pending invitations for current user's email"""
        invitations = CaseInvitation.objects.filter(
            invitee_email=request.user.email,
            status='pending',
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept an invitation and grant case access"""
        invitation = self.get_object()
        
        # Verify email matches current user
        if invitation.invitee_email != request.user.email:
            return Response(
                {'error': 'This invitation is not for your account'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if not already accepted or expired
        if invitation.status != 'pending':
            return Response(
                {'error': f'Invitation has already been {invitation.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save()
            return Response(
                {'error': 'Invitation has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create case access
        access, created = CaseAccess.objects.get_or_create(
            case=invitation.case,
            user=request.user,
            defaults={
                'access_type': invitation.access_type,
                'granted_by': invitation.invited_by,
                'accepted': True,
                'accepted_at': timezone.now()
            }
        )
        
        # Update invitation status
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.accepted_by = request.user
        invitation.save()
        
        return Response(
            {
                'status': 'success',
                'message': f'You now have access to {invitation.case.case_title}',
                'case_id': str(invitation.case.id),
                'access_type': invitation.access_type
            },
            status=status.HTTP_200_OK
        )
    
    def _send_invitation_email(self, invitation, inviter):
        """Send invitation email to new user (doesn't have account yet)"""
        print(f"\n[EMAIL DEBUG] _send_invitation_email() called")
        print(f"[EMAIL DEBUG] EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        print(f"[EMAIL DEBUG] EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"[EMAIL DEBUG] EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"[EMAIL DEBUG] DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        print(f"[EMAIL DEBUG] FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'NOT SET')}")
        
        context = {
            'invitee_name': invitation.invitee_name,
            'case_title': invitation.case.case_title,
            'inviter_name': inviter.get_full_name() or inviter.email,
            'message_body': invitation.message_body,
            'invitation_code': invitation.invitation_code,
            'signup_url': f"{getattr(settings, 'FRONTEND_URL', 'caseclosure.org')}/signup?invitation_code={invitation.invitation_code}",
            'case_id': str(invitation.case.id),
        }
        
        subject = invitation.subject_line
        
        try:
            html_message = render_to_string('emails/case_invitation.html', context)
            print(f"[EMAIL DEBUG] Template rendered successfully")
        except Exception as template_error:
            print(f"[EMAIL DEBUG] Template error (using fallback): {str(template_error)}")
            html_message = f"""
            <h2>{subject}</h2>
            <p>Hi {invitation.invitee_name},</p>
            <p>{invitation.message_body}</p>
            <p>To accept this invitation, create an account using this code: {invitation.invitation_code}</p>
            <p><a href="{context['signup_url']}">Sign Up Here</a></p>
            """
        
        print(f"[EMAIL DEBUG] Attempting send_mail to {invitation.invitee_email}")
        
        try:
            num_sent = send_mail(
                subject,
                '',
                settings.DEFAULT_FROM_EMAIL,
                [invitation.invitee_email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"[EMAIL DEBUG] ✓ send_mail returned: {num_sent}")
        except Exception as e:
            print(f"[EMAIL DEBUG] ✗ send_mail failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def _send_existing_user_notification(self, user, case, inviter, access_type, subject_line, message_body):
        """Send notification to existing user about new case access"""
        print(f"\n[EMAIL DEBUG] _send_existing_user_notification() called")
        
        context = {
            'user_name': user.get_full_name() or user.email,
            'case_title': case.case_title,
            'inviter_name': inviter.get_full_name() or inviter.email,
            'access_type': dict(CaseInvitation.ACCESS_TYPES).get(access_type, access_type),
            'message_body': message_body,
            'dashboard_url': f"{getattr(settings, 'FRONTEND_URL', 'https://caseclosure')}/dashboard",
            'case_id': str(case.id),
        }
        
        try:
            html_message = render_to_string('emails/case_access_notification.html', context)
            print(f"[EMAIL DEBUG] Template rendered successfully")
        except Exception as template_error:
            print(f"[EMAIL DEBUG] Template error (using fallback): {str(template_error)}")
            html_message = f"""
            <h2>{subject_line}</h2>
            <p>Hi {context['user_name']},</p>
            <p>{message_body}</p>
            <p>You now have {context['access_type']} access to: <strong>{case.case_title}</strong></p>
            <p><a href="{context['dashboard_url']}">View in Dashboard</a></p>
            """
        
        print(f"[EMAIL DEBUG] Attempting send_mail to {user.email}")
        
        try:
            num_sent = send_mail(
                subject_line,
                '',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            print(f"[EMAIL DEBUG] ✓ send_mail returned: {num_sent}")
        except Exception as e:
            print(f"[EMAIL DEBUG] ✗ send_mail failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise