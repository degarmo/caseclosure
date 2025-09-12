# cases/views.py - Updated views with template customization and deployment

from rest_framework import viewsets, status
from rest_framework.views import APIView  
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import cloudinary  # Add this import
from cloudinary.uploader import upload
import json
import logging
import os
import re  # Add this for subdomain validation

from rest_framework.permissions import AllowAny
from .models import Case, SpotlightPost, TemplateRegistry, DeploymentLog, CasePhoto
from .serializers import (
    CaseSerializer, 
    SpotlightPostSerializer, 
    TemplateRegistrySerializer,
    DeploymentLogSerializer,
    CasePhotoSerializer
)
from .services.deployment import get_deployment_service

logger = logging.getLogger(__name__)


class ImageUploadView(APIView):
    """
    Generic image upload endpoint for customizations.
    Uploads to Cloudinary and returns the URL.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"[DEBUG] Upload request from user: {request.user}")  # Debug line
        
        image = request.FILES.get('image')
        if not image:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            print(f"[DEBUG] Uploading image: {image.name}, size: {image.size}")  # Debug line
            
            # Upload to Cloudinary
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
            
            print(f"[DEBUG] Cloudinary upload successful: {result['secure_url']}")  # Debug line
            
            return Response({
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'width': result.get('width'),
                'height': result.get('height')
            })
            
        except Exception as e:
            print(f"[ERROR] Cloudinary upload failed: {str(e)}")  # Debug line
            import traceback
            traceback.print_exc()  # This will print the full error
            
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
    
    def create(self, request, *args, **kwargs):
        """
        Override create to handle photo upload separately.
        """
        # Create the case first without the image
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Get the created case
        case = serializer.instance
        
        # Handle victim photo if provided in request.FILES
        if 'victim_photo' in request.FILES:
            victim_photo = request.FILES['victim_photo']
            self._handle_victim_photo_upload(case, victim_photo)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """
        Override update to handle photo upload separately.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Update case data
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Handle victim photo if provided
        if 'victim_photo' in request.FILES:
            victim_photo = request.FILES['victim_photo']
            self._handle_victim_photo_upload(instance, victim_photo)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)
    
    def _handle_victim_photo_upload(self, case, photo_file):
        """
        Helper method to handle victim photo upload.
        Creates a CasePhoto entry for the uploaded file.
        """
        try:
            # Check if a primary photo already exists
            existing_primary = CasePhoto.objects.filter(
                case=case,
                is_primary=True
            ).first()
            
            # If exists, delete the old one
            if existing_primary:
                # Delete the actual file
                if existing_primary.image:
                    default_storage.delete(existing_primary.image.name)
                existing_primary.delete()
            
            # Create new CasePhoto entry
            case_photo = CasePhoto.objects.create(
                case=case,
                image=photo_file,
                caption='Primary victim photo',
                is_primary=True,
                is_public=True,
                order=0
            )
            
            logger.info(f"Victim photo uploaded for case {case.id}: {case_photo.image.url}")
            
            # Update the case's victim_photo field if it exists
            if hasattr(case, 'victim_photo'):
                case.victim_photo = case_photo.image
                case.save(update_fields=['victim_photo'])
            
            return case_photo
            
        except Exception as e:
            logger.error(f"Error uploading victim photo for case {case.id}: {str(e)}")
            raise ValidationError(f"Failed to upload photo: {str(e)}")
    
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
    def upload_victim_photo(self, request, id=None):
        """
        Dedicated endpoint for uploading victim photo.
        """
        case = self.get_object()
        
        # Check ownership
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
    def save_customizations(self, request, id=None):  # Changed pk to id
        """
        Save customizations with improved error handling and logging
        """
        try:
            case = self.get_object()
            
            # Check ownership
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only edit your own cases.")
            
            # Get customizations from request
            customizations = request.data.get('customizations', {})
            
            # Validate that customizations is a dict
            if not isinstance(customizations, dict):
                return Response(
                    {'error': 'Customizations must be an object/dictionary'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Clean the customizations - remove None/null values but keep empty strings
            cleaned_customizations = {}
            for key, value in customizations.items():
                # Only exclude None/null, but keep empty strings and other falsy values
                if value is not None:
                    cleaned_customizations[key] = value
            
            # Log what's being saved
            logger.info(f"Saving {len(cleaned_customizations)} customization fields for case {id}")  # Changed pk to id
            
            # Count different types of customizations for logging
            gallery_count = sum(1 for key in cleaned_customizations.keys() if key.startswith('gallery_image_'))
            home_count = sum(1 for key in cleaned_customizations.keys() if key.startswith('hero_') or key.startswith('quick_facts_') or key.startswith('cta_'))
            about_count = sum(1 for key in cleaned_customizations.keys() if key.startswith('about_'))
            
            logger.info(f"Customization breakdown - Gallery: {gallery_count}, Home: {home_count}, About: {about_count}")
            
            # Ensure template_data exists and has proper structure
            if not case.template_data:
                case.template_data = {}
            
            if not isinstance(case.template_data, dict):
                case.template_data = {}
            
            # Update customizations
            case.template_data['customizations'] = cleaned_customizations
            
            # Add metadata about the save
            case.template_data['last_saved'] = timezone.now().isoformat()
            case.template_data['customization_stats'] = {
                'total': len(cleaned_customizations),
                'gallery_images': gallery_count,
                'home_fields': home_count,
                'about_fields': about_count
            }
            
            # Save the case with error handling
            try:
                case.save(update_fields=['template_data'])
                logger.info(f"Successfully saved customizations for case {id}")  # Changed pk to id
            except Exception as save_error:
                logger.error(f"Database save error for case {id}: {str(save_error)}")  # Changed pk to id
                return Response(
                    {'error': f'Failed to save to database: {str(save_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Return success response
            serializer = self.get_serializer(case)
            return Response({
                'success': True,
                'message': 'Customizations saved successfully',
                'template_data': case.template_data,
                'customization_count': len(cleaned_customizations),
                'stats': case.template_data.get('customization_stats', {})
            })
            
        except PermissionDenied as e:
            logger.warning(f"Permission denied for case {id}: {str(e)}")  # Changed pk to id
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Case.DoesNotExist:
            logger.error(f"Case {id} not found")  # Changed pk to id
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except json.JSONDecodeError as e:
            logger.error(f"JSON encoding error for case {id}: {str(e)}")  # Changed pk to id
            return Response(
                {'error': f'Invalid JSON data: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error saving customizations for case {id}: {str(e)}")  # Changed pk to id
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Request data keys: {list(request.data.keys()) if hasattr(request, 'data') else 'No data'}")
            
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def check_subdomain(self, request):
        """
        Check if a subdomain is available for use.
        """
        subdomain = request.data.get('subdomain', '').lower().strip()
        case_id = request.data.get('case_id') 
        # Validate subdomain format
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
        
        # Check reserved subdomains
        reserved_subdomains = [
            'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog',
            'dashboard', 'support', 'help', 'docs', 'status',
            'cdn', 'assets', 'static', 'media', 'files'
        ]
        
        if subdomain in reserved_subdomains:
            return Response({
                'available': False,
                'message': 'This subdomain is reserved'
            })
        
        # Check if subdomain exists in database
        exists = Case.objects.filter(subdomain=subdomain).exists()
        
        return Response({
            'available': not exists,
            'message': 'Available!' if not exists else 'This subdomain is already taken',
            'subdomain': subdomain
        })

    @action(detail=True, methods=['post'])
    def deploy(self, request, id=None):
        """
        Deploy the case website with proper error handling.
        """
        case = self.get_object()
        
        # Check ownership
        if case.user != request.user and not request.user.is_staff:
            raise PermissionDenied("You can only deploy your own cases.")
        
        try:
            # Get domain configuration
            subdomain = request.data.get('subdomain', '').lower().strip()
            custom_domain = request.data.get('custom_domain', '').lower().strip()
            
            # Validate and set subdomain
            if subdomain:
                if not re.match(r'^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$', subdomain):
                    return Response(
                        {'error': 'Invalid subdomain format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if Case.objects.filter(subdomain=subdomain).exclude(id=case.id).exists():
                    return Response(
                        {'error': 'This subdomain is already taken'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                case.subdomain = subdomain
            elif not case.subdomain:
                # Auto-generate subdomain
                base_subdomain = f"{case.first_name}-{case.last_name}".lower()
                base_subdomain = re.sub(r'[^a-z0-9-]', '', base_subdomain)[:40]
                subdomain = base_subdomain
                counter = 1
                
                while Case.objects.filter(subdomain=subdomain).exclude(id=case.id).exists():
                    subdomain = f"{base_subdomain}-{counter}"
                    counter += 1
                
                case.subdomain = subdomain
            
            # Handle custom domain if provided
            if custom_domain:
                if not re.match(r'^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$', custom_domain):
                    return Response(
                        {'error': 'Invalid domain format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if Case.objects.filter(custom_domain=custom_domain).exclude(id=case.id).exists():
                    return Response(
                        {'error': 'This domain is already in use'},
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
                    'subdomain': case.subdomain,
                    'custom_domain': case.custom_domain,
                    'template': case.template_id,
                    'initiated_by': request.user.email
                }
            )
            
            # Synchronous deployment
            try:
                # Try the deployment
                deployment_service = get_deployment_service()
                result = deployment_service.deploy_case(case)
                
                if result.get('success'):
                    # Success - already updated by service
                    deployment_log.status = 'success'
                    deployment_log.completed_at = timezone.now()
                    deployment_log.save()
                    
                    return Response({
                        'success': True,
                        'message': 'Deployment successful',
                        'deployment_id': str(deployment_log.id),
                        'subdomain': case.subdomain,
                        'url': case.get_full_url(),
                        'status': 'deployed'
                    })
                else:
                    # Deployment returned but indicated failure
                    raise Exception(result.get('error', 'Deployment failed'))
                    
            except Exception as deploy_error:
                # CRITICAL: Reset status on ANY deployment error
                case.deployment_status = 'failed'
                case.deployment_error = str(deploy_error)
                case.save()
                
                deployment_log.status = 'failed'
                deployment_log.error_message = str(deploy_error)
                deployment_log.completed_at = timezone.now()
                deployment_log.save()
                
                logger.error(f"Deployment failed for case {id}: {str(deploy_error)}")
                
                return Response({
                    'success': False,
                    'error': str(deploy_error),
                    'deployment_id': str(deployment_log.id),
                    'status': 'failed'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            # Ensure status is reset on any outer exception
            if case.deployment_status == 'deploying':
                case.deployment_status = 'failed'
                case.deployment_error = str(e)
                case.save()
            
            logger.error(f"Error in deploy endpoint: {str(e)}")
            return Response(
                {'error': str(e), 'status': 'failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def deployment_status(self, request, id=None):
        """
        Check deployment status for a case with enhanced details.
        """
        try:
            case = self.get_object()
            
            # Get latest deployment log
            latest_log = case.deployment_logs.first()
            
            response_data = {
                'deployment_status': case.deployment_status,
                'subdomain': case.subdomain,
                'custom_domain': case.custom_domain,
                'deployment_url': case.get_full_url(),
                'ssl_status': case.ssl_status,
                'last_deployed_at': case.last_deployed_at.isoformat() if case.last_deployed_at else None,
                'is_public': case.is_public,
                'is_disabled': case.is_disabled,
                'deployment_error': case.deployment_error
            }
            
            if latest_log:
                response_data['latest_deployment'] = {
                    'id': str(latest_log.id),
                    'action': latest_log.action,
                    'status': latest_log.status,
                    'started_at': latest_log.started_at.isoformat(),
                    'completed_at': latest_log.completed_at.isoformat() if latest_log.completed_at else None,
                    'duration_seconds': latest_log.duration_seconds,
                    'error': latest_log.error_message,
                    'details': latest_log.details
                }
                
                # Add progress steps if available
                if latest_log.details and 'steps' in latest_log.details:
                    response_data['deployment_steps'] = latest_log.details['steps']
            
            # Add deployment history count
            response_data['total_deployments'] = case.deployment_logs.count()
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error checking deployment status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def add_custom_domain(self, request, id=None):
        """
        Add or update a custom domain for the deployed case.
        """
        try:
            case = self.get_object()
            
            # Check ownership
            if case.user != request.user and not request.user.is_staff:
                raise PermissionDenied("You can only manage domains for your own cases.")
            
            # Check if case is deployed
            if case.deployment_status != 'deployed':
                return Response(
                    {'error': 'Please deploy your site first before adding a custom domain'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            custom_domain = request.data.get('domain', '').lower().strip()
            
            if not custom_domain:
                return Response(
                    {'error': 'Domain is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Basic domain validation
            if not re.match(r'^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$', custom_domain):
                return Response(
                    {'error': 'Invalid domain format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if domain is already in use
            if Case.objects.filter(custom_domain=custom_domain).exclude(id=case.id).exists():
                return Response(
                    {'error': 'This domain is already in use by another case'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the custom domain
            old_domain = case.custom_domain
            case.custom_domain = custom_domain
            case.ssl_status = 'pending'  # SSL needs to be provisioned for custom domain
            case.save()
            
            # Create deployment log for DNS update
            deployment_log = DeploymentLog.objects.create(
                case=case,
                action='dns_update',
                status='started',
                details={
                    'old_domain': old_domain,
                    'new_domain': custom_domain,
                    'subdomain': case.subdomain
                }
            )
            
            # Update Render service with new domain (if using Render)
            if case.render_service_id:
                try:
                    deployment_service = get_deployment_service()
                    result = deployment_service.add_custom_domain(case, custom_domain)
                    
                    if result.get('success'):
                        deployment_log.status = 'success'
                        deployment_log.completed_at = timezone.now()
                        deployment_log.save()
                        
                        return Response({
                            'success': True,
                            'message': 'Custom domain added successfully',
                            'domain': custom_domain,
                            'dns_instructions': {
                                'type': 'CNAME',
                                'name': custom_domain,
                                'value': f'{case.subdomain}.caseclosure.org',
                                'ttl': '3600'
                            },
                            'ssl_status': case.ssl_status
                        })
                    else:
                        raise Exception(result.get('error', 'Failed to add custom domain'))
                        
                except Exception as e:
                    deployment_log.status = 'failed'
                    deployment_log.error_message = str(e)
                    deployment_log.completed_at = timezone.now()
                    deployment_log.save()
                    
                    # Revert domain change
                    case.custom_domain = old_domain
                    case.save()
                    
                    return Response(
                        {'error': f'Failed to configure domain: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                # For non-Render deployments, just return DNS instructions
                deployment_log.status = 'success'
                deployment_log.completed_at = timezone.now()
                deployment_log.save()
                
                return Response({
                    'success': True,
                    'message': 'Custom domain saved. Please configure your DNS settings.',
                    'domain': custom_domain,
                    'dns_instructions': {
                        'type': 'CNAME',
                        'name': custom_domain,
                        'value': f'{case.subdomain}.caseclosure.org',
                        'ttl': '3600'
                    }
                })
            
        except Exception as e:
            logger.error(f"Error adding custom domain: {str(e)}")
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
    
    @action(detail=False, methods=['get'], url_path='by-subdomain/(?P<subdomain>[^/.]+)', 
            permission_classes=[AllowAny])  # ADD THIS LINE
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
    def publish(self, request, id=None):
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
    def schedule(self, request, id=None):
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
    def schema(self, request, id=None):
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
        
        # Check if this should be a primary photo
        is_primary = self.request.data.get('is_primary', False)
        
        # If this is being set as primary, remove primary status from others
        if is_primary:
            CasePhoto.objects.filter(case=case, is_primary=True).update(is_primary=False)
        
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