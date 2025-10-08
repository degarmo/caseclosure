# cases/services/deployment.py - Simplified deployment service

import logging
from typing import Dict, Any
from django.conf import settings
from django.utils import timezone
from ..models import Case, DeploymentLog

logger = logging.getLogger(__name__)


class SimpleDeploymentService:
    """
    Simple deployment service for subdomain-based case websites.
    No external services - just marks cases as public and sets URLs.
    """
    
    def deploy_case(self, case: Case) -> Dict[str, Any]:
        """
        Deploy a case to its subdomain.
        
        Args:
            case: The Case instance to deploy
            
        Returns:
            Dict with success status, url, and any errors
        """
        deployment_log = DeploymentLog.objects.create(
            case=case,
            action='deploy' if case.deployment_status == 'not_deployed' else 'update',
            status='started',
            details={
                'subdomain': case.subdomain,
                'template': case.template_id
            }
        )
        
        try:
            logger.info(f"Starting deployment for case {case.id} ({case.subdomain})")
            
            # Validate subdomain exists
            if not case.subdomain:
                raise ValueError("Case must have a subdomain before deployment")
            
            # Set deployment URL based on environment
            if settings.DEBUG:
                case.deployment_url = f'http://{case.subdomain}.caseclosure.org:8000'
            else:
                case.deployment_url = f'https://{case.subdomain}.caseclosure.org'
            
            # Mark as deployed
            case.deployment_status = 'deployed'
            case.is_public = True
            case.last_deployed_at = timezone.now()
            case.deployment_error = ''
            case.save()
            
            # Update deployment log
            deployment_log.status = 'success'
            deployment_log.completed_at = timezone.now()
            deployment_log.details.update({
                'url': case.deployment_url,
                'deployment_type': 'simple_subdomain'
            })
            deployment_log.save()
            
            logger.info(f"Successfully deployed case {case.id} to {case.deployment_url}")
            
            return {
                'success': True,
                'url': case.deployment_url,
                'subdomain': case.subdomain,
                'message': f'Successfully deployed to {case.subdomain}.caseclosure.org'
            }
            
        except Exception as e:
            logger.error(f"Deployment failed for case {case.id}: {str(e)}")
            
            # Update case status
            case.deployment_status = 'failed'
            case.deployment_error = str(e)
            case.save()
            
            # Update deployment log
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.save()
            
            return {
                'success': False,
                'error': str(e),
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
            details={'subdomain': case.subdomain}
        )
        
        try:
            logger.info(f"Undeploying case {case.id}")
            
            # Mark as not public
            case.is_public = False
            case.deployment_status = 'not_deployed'
            case.save()
            
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
            logger.error(f"Undeploy failed for case {case.id}: {str(e)}")
            
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
        return self.deploy_case(case)
    
    def get_deployment_status(self, case: Case) -> Dict[str, Any]:
        """
        Get the current deployment status for a case.
        
        Args:
            case: The Case instance
            
        Returns:
            Dict with deployment status information
        """
        return {
            'deployment_status': case.deployment_status,
            'subdomain': case.subdomain,
            'url': case.deployment_url if case.deployment_url else None,
            'is_public': case.is_public,
            'last_deployed_at': case.last_deployed_at.isoformat() if case.last_deployed_at else None,
            'deployment_error': case.deployment_error if case.deployment_error else None
        }


def get_deployment_service():
    """
    Factory function to get the deployment service.
    
    Returns:
        SimpleDeploymentService instance
    """
    # In the future, you could check settings here to return different services
    # For example, if you add premium features like custom domains later
    
    logger.debug("Using SimpleDeploymentService")
    return SimpleDeploymentService()


# For backward compatibility, keep the same interface
RenderDeploymentService = SimpleDeploymentService