# cases/services/deployment.py - Production-ready deployment service

import logging
from typing import Dict, Any
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from ..models import Case, DeploymentLog

logger = logging.getLogger(__name__)


class SimpleDeploymentService:
    """
    Production-ready deployment service for subdomain-based case websites.
    Handles deployment with proper error handling, validation, and logging.
    """
    
    def __init__(self):
        self.deployment_timeout = 30  # seconds
    
    def deploy_case(self, case: Case) -> Dict[str, Any]:
        """
        Deploy a case to its subdomain with full validation and error handling.
        
        Args:
            case: The Case instance to deploy
            
        Returns:
            Dict with success status, url, and any errors
            
        Raises:
            ValueError: If case data is invalid
            RuntimeError: If deployment fails
        """
        # Pre-deployment validation
        self._validate_case_for_deployment(case)
        
        # Create deployment log
        deployment_log = DeploymentLog.objects.create(
            case=case,
            action='deploy' if case.deployment_status == 'not_deployed' else 'update',
            status='started',
            details={
                'subdomain': case.subdomain,
                'template': case.template_id,
                'template_version': case.template_version,
                'has_customizations': bool(case.template_data.get('customizations')) if case.template_data else False
            }
        )
        
        try:
            logger.info(f"Starting deployment for case {case.id} ({case.subdomain})")
            
            # Validate subdomain exists and is valid
            if not case.subdomain:
                raise ValueError("Case must have a subdomain before deployment")
            
            if len(case.subdomain) < 3:
                raise ValueError("Subdomain must be at least 3 characters")
            
            # Generate deployment URL based on environment
            if settings.DEBUG:
                base_url = f'http://{case.subdomain}.caseclosure.org:8000'
            else:
                base_url = f'https://{case.subdomain}.caseclosure.org'
            
            # Update case with deployment info
            case.deployment_url = base_url
            case.deployment_status = 'deployed'
            case.is_public = True
            case.last_deployed_at = timezone.now()
            case.deployment_error = ''
            case.save(update_fields=[
                'deployment_url',
                'deployment_status',
                'is_public',
                'last_deployed_at',
                'deployment_error'
            ])
            
            # Update deployment log
            deployment_log.status = 'success'
            deployment_log.completed_at = timezone.now()
            deployment_log.details.update({
                'url': case.deployment_url,
                'deployment_type': 'simple_subdomain',
                'success_timestamp': timezone.now().isoformat()
            })
            deployment_log.save()
            
            logger.info(f"Successfully deployed case {case.id} to {case.deployment_url}")
            
            # ✅ SAFE: Clear any cached errors
            try:
                cache.delete(f'deployment_error_{case.id}')
            except Exception as cache_error:
                logger.warning(f"Cache unavailable during error cleanup: {cache_error}")
            
            return {
                'success': True,
                'url': case.deployment_url,
                'subdomain': case.subdomain,
                'message': f'Successfully deployed to {case.subdomain}.caseclosure.org',
                'deployed_at': case.last_deployed_at.isoformat()
            }
            
        except ValueError as e:
            # Validation error - case data is invalid
            logger.warning(f"Validation failed for case {case.id}: {str(e)}")
            
            case.deployment_status = 'failed'
            case.deployment_error = f'Validation error: {str(e)}'
            case.is_public = False
            case.save(update_fields=['deployment_status', 'deployment_error', 'is_public'])
            
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.details['error_type'] = 'validation_error'
            deployment_log.save()
            
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation',
                'message': f'Deployment failed: {str(e)}'
            }
            
        except Exception as e:
            # Unexpected error during deployment
            logger.error(f"Deployment failed for case {case.id}: {str(e)}", exc_info=True)
            
            case.deployment_status = 'failed'
            case.deployment_error = str(e)
            case.is_public = False
            case.save(update_fields=['deployment_status', 'deployment_error', 'is_public'])
            
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.details['error_type'] = 'runtime_error'
            deployment_log.save()
            
            # ✅ SAFE: Cache error for monitoring
            try:
                cache.set(f'deployment_error_{case.id}', str(e), 3600)
            except Exception as cache_error:
                logger.warning(f"Cache unavailable during error logging: {cache_error}")
            
            return {
                'success': False,
                'error': str(e),
                'error_type': 'runtime',
                'message': f'Deployment failed: {str(e)}'
            }
    
    def undeploy_case(self, case: Case) -> Dict[str, Any]:
        """
        Take a case website offline.
        
        Args:
            case: The Case instance to undeploy
            
        Returns:
            Dict with success status
        """
        deployment_log = DeploymentLog.objects.create(
            case=case,
            action='undeploy',
            status='started',
            details={
                'subdomain': case.subdomain,
                'previous_status': case.deployment_status
            }
        )
        
        try:
            logger.info(f"Undeploying case {case.id}")
            
            # Mark as not public and not deployed
            case.is_public = False
            case.deployment_status = 'not_deployed'
            case.deployment_error = ''
            case.save(update_fields=['is_public', 'deployment_status', 'deployment_error'])
            
            # Update deployment log
            deployment_log.status = 'success'
            deployment_log.completed_at = timezone.now()
            deployment_log.save()
            
            logger.info(f"Successfully undeployed case {case.id}")
            
            return {
                'success': True,
                'message': 'Website taken offline successfully'
            }
            
        except Exception as e:
            logger.error(f"Undeploy failed for case {case.id}: {str(e)}", exc_info=True)
            
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.save()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_deployment(self, case: Case) -> Dict[str, Any]:
        """
        Update an already deployed case (same as deploy for this simple service).
        
        Args:
            case: The Case instance to update
            
        Returns:
            Dict with success status
        """
        # For simple deployment, update is the same as deploy
        return self.deploy_case(case)
    
    def get_deployment_status(self, case: Case) -> Dict[str, Any]:
        """
        Get the current deployment status for a case.
        
        Args:
            case: The Case instance
            
        Returns:
            Dict with deployment status information
        """
        # ✅ SAFE: Check if there's a recent deployment error cached
        cached_error = None
        try:
            cached_error = cache.get(f'deployment_error_{case.id}')
        except Exception as cache_error:
            logger.warning(f"Cache unavailable during status check: {cache_error}")
        
        return {
            'deployment_status': case.deployment_status,
            'subdomain': case.subdomain,
            'url': case.deployment_url if case.deployment_url else None,
            'is_public': case.is_public,
            'is_disabled': case.is_disabled,
            'last_deployed_at': case.last_deployed_at.isoformat() if case.last_deployed_at else None,
            'deployment_error': case.deployment_error if case.deployment_error else cached_error,
            'has_recent_error': bool(cached_error)
        }
    
    def _validate_case_for_deployment(self, case: Case) -> None:
        """
        Validate that case has all required data for deployment.
        
        Args:
            case: The Case instance to validate
            
        Raises:
            ValueError: If case data is invalid or incomplete
        """
        errors = []
        
        # Check required case fields
        if not case.first_name:
            errors.append("First name is required")
        
        if not case.last_name:
            errors.append("Last name is required")
        
        if not case.case_title:
            errors.append("Case title is required")
        
        if not case.case_type:
            errors.append("Case type is required")
        
        if not case.template_id:
            errors.append("Template must be selected")
        
        if not case.subdomain:
            errors.append("Subdomain is required")
        
        # Check template data exists
        if not isinstance(case.template_data, dict):
            errors.append("Template data is invalid")
        
        if errors:
            raise ValueError("; ".join(errors))
        
        logger.debug(f"Case {case.id} passed validation for deployment")


def get_deployment_service():
    """
    Factory function to get the deployment service.
    
    In the future, this could check settings to return different service types
    (e.g., premium features, different hosting providers, etc.)
    
    Returns:
        SimpleDeploymentService instance
    """
    logger.debug("Initializing SimpleDeploymentService")
    return SimpleDeploymentService()


# For backward compatibility with any existing code
RenderDeploymentService = SimpleDeploymentService