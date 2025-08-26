# cases/services/deployment.py - Render.com deployment service

import os
import json
import requests
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
import hashlib
from typing import Dict, Any

from ..models import Case, DeploymentLog, TemplateRegistry


class RenderDeploymentService:
    """
    Service to deploy Case websites to Render.com
    Much simpler than AWS!
    """
    
    def __init__(self):
        self.api_key = settings.RENDER_API_KEY
        self.owner_id = settings.RENDER_OWNER_ID
        self.base_url = "https://api.render.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def deploy_case(self, case: Case) -> Dict[str, Any]:
        """
        Main deployment method
        """
        deployment_log = DeploymentLog.objects.create(
            case=case,
            action='deploy' if not case.render_service_id else 'update',
            status='started',
            details={'subdomain': case.subdomain, 'template': case.template_id}
        )
        
        try:
            # Step 1: Generate the static site
            site_files = self.generate_site_files(case)
            
            # Step 2: Create or update Render static site
            if not case.render_service_id:
                service = self.create_render_service(case)
                case.render_service_id = service['service']['id']
                case.save()
            
            # Step 3: Deploy the files
            deploy_result = self.deploy_to_render(case, site_files)
            
            # Step 4: Configure custom domain if needed
            if case.custom_domain:
                self.configure_custom_domain(case)
            
            # Update case status
            case.deployment_status = 'deployed'
            case.last_deployed_at = timezone.now()
            case.deployment_url = self.get_service_url(case)
            case.save()
            
            # Update log
            deployment_log.status = 'success'
            deployment_log.completed_at = timezone.now()
            deployment_log.render_deploy_id = deploy_result.get('deployId')
            deployment_log.save()
            
            return {
                'success': True,
                'url': case.deployment_url,
                'service_id': case.render_service_id
            }
            
        except Exception as e:
            # Handle failure
            case.deployment_status = 'failed'
            case.deployment_error = str(e)
            case.save()
            
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.save()
            
            raise
    
    def generate_site_files(self, case: Case) -> Dict[str, str]:
        """
        Generate static HTML files from template and customizations
        """
        # Get the template
        template = TemplateRegistry.objects.get(template_id=case.template_id)
        
        # Prepare context with case data and customizations
        context = {
            'case': case,
            'customizations': case.template_data.get('customizations', {}),
            'global_settings': case.template_data.get('customizations', {}).get('global', {}),
            'sections': case.template_data.get('customizations', {}).get('sections', {}),
            'spotlight_posts': case.spotlight_posts.filter(status='published'),
            'template_id': case.template_id,
        }
        
        # Generate HTML for each page
        # Templates would be in templates/sites/{template_id}/
        template_base = f"sites/{case.template_id}"
        
        files = {
            'index.html': render_to_string(f"{template_base}/home.html", context),
            'about.html': render_to_string(f"{template_base}/about.html", context),
            'contact.html': render_to_string(f"{template_base}/contact.html", context),
            'spotlight.html': render_to_string(f"{template_base}/spotlight.html", context),
        }
        
        # Add CSS with customizations
        css_context = {
            'primary_color': context['global_settings'].get('primaryColor', '#3B82F6'),
            'font_family': context['global_settings'].get('fontFamily', 'Inter'),
            # Add more style variables as needed
        }
        files['styles.css'] = render_to_string(f"{template_base}/styles.css", css_context)
        
        # Add a simple _redirects file for Render
        files['_redirects'] = "/* /index.html 200"
        
        return files
    
    def create_render_service(self, case: Case) -> Dict:
        """
        Create a new Render static site service
        """
        service_name = f"case-{case.id}-{case.subdomain}"
        
        payload = {
            "type": "static_site",
            "name": service_name,
            "ownerId": self.owner_id,
            "envVars": [],
            "buildCommand": "",  # No build needed for static files
            "staticPublishPath": "./",
            "customDomains": []
        }
        
        # Add custom domain if specified
        if case.subdomain:
            payload["customDomains"].append({
                "name": f"{case.subdomain}.caseclosure.org"
            })
        
        if case.custom_domain:
            payload["customDomains"].append({
                "name": case.custom_domain
            })
        
        response = requests.post(
            f"{self.base_url}/services",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        
        return response.json()
    
    def deploy_to_render(self, case: Case, files: Dict[str, str]) -> Dict:
        """
        Deploy files to Render using their API
        
        Note: Render doesn't have a direct file upload API for static sites.
        You'll need to either:
        1. Use GitHub integration (recommended)
        2. Use their CLI tool
        3. Create a simple Git repo for each site
        
        For simplicity, we'll use GitHub integration
        """
        # This is a simplified version - you'd need to:
        # 1. Create/update a GitHub repo for this case
        # 2. Commit the files
        # 3. Trigger Render deploy
        
        # For now, return mock success
        return {'deployId': f"dep-{case.id}"}
    
    def configure_custom_domain(self, case: Case) -> None:
        """
        Configure custom domain on Render
        """
        if not case.render_service_id:
            return
        
        # Add custom domain to service
        payload = {
            "name": case.custom_domain
        }
        
        response = requests.post(
            f"{self.base_url}/services/{case.render_service_id}/custom-domains",
            headers=self.headers,
            json=payload
        )
        
        if response.status_code == 201:
            case.ssl_status = 'pending'  # Render handles SSL automatically
            case.save()
    
    def get_service_url(self, case: Case) -> str:
        """
        Get the URL for the deployed service
        """
        if case.custom_domain:
            return f"https://{case.custom_domain}"
        elif case.subdomain:
            return f"https://{case.subdomain}.caseclosure.org"
        elif case.render_service_id:
            # Render provides a default URL
            return f"https://{case.render_service_id}.onrender.com"
        return ""
    
    def check_deployment_status(self, case: Case) -> Dict:
        """
        Check the status of a deployment
        """
        if not case.render_service_id:
            return {'status': 'not_deployed'}
        
        response = requests.get(
            f"{self.base_url}/services/{case.render_service_id}/deploys",
            headers=self.headers,
            params={"limit": 1}
        )
        
        if response.status_code == 200:
            deploys = response.json()
            if deploys:
                latest = deploys[0]
                return {
                    'status': latest['status'],
                    'created_at': latest['createdAt'],
                    'url': self.get_service_url(case)
                }
        
        return {'status': 'unknown'}


# Alternative: Using Render Blueprint for easier deployment
RENDER_BLUEPRINT_TEMPLATE = """
services:
  - type: web
    name: {service_name}
    env: static
    buildCommand: ""
    staticPublishPath: ./public
    customDomains:
      - domain: {domain}
    envVars:
      - key: CASE_ID
        value: {case_id}
"""


class SimpleStaticDeployment:
    """
    Simpler approach: Deploy as static files to a CDN or object storage
    This is much easier than managing individual Render services
    """
    
    def __init__(self):
        # You could use Cloudflare R2, Backblaze B2, or any S3-compatible storage
        # These are much simpler than AWS S3
        pass
    
    def deploy_case(self, case: Case) -> Dict[str, Any]:
        """
        Deploy case as static files to CDN
        """
        # 1. Generate static files
        files = self.generate_static_site(case)
        
        # 2. Upload to CDN/Storage with path: /sites/{subdomain}/
        base_path = f"sites/{case.subdomain or case.id}"
        
        # 3. Configure CDN rules for custom domain
        if case.custom_domain:
            # Add CDN rule: case.custom_domain -> base_path
            pass
        
        # 4. Return URL
        return {
            'success': True,
            'url': case.get_full_url()
        }
    
    def generate_static_site(self, case: Case) -> Dict[str, bytes]:
        """
        Generate a complete static site
        """
        # This would use your React templates compiled to static HTML
        # Each template has its own unique structure!
        
        template_registry = TemplateRegistry.objects.get(template_id=case.template_id)
        
        # The beauty: Each template can have completely different sections
        # The template_data JSON stores whatever that template needs!
        
        files = {}
        
        # Generate based on the template's unique schema
        if case.template_id == 'beacon':
            files = self._generate_beacon_site(case)
        elif case.template_id == 'justice':
            files = self._generate_justice_site(case)
        elif case.template_id == 'legacy':
            files = self._generate_legacy_site(case)
        
        return files
    
    def _generate_beacon_site(self, case: Case) -> Dict[str, bytes]:
        """Generate Beacon template with its unique sections"""
        customizations = case.template_data.get('customizations', {})
        sections = customizations.get('sections', {})
        
        # Beacon has: hero, timeline, photoGallery
        hero_data = sections.get('hero', {})
        timeline_data = sections.get('timeline', {})
        gallery_data = sections.get('photoGallery', {})
        
        # Generate HTML with these unique sections
        # ... 
        
        return {}
    
    def _generate_justice_site(self, case: Case) -> Dict[str, bytes]:
        """Generate Justice template with completely different sections"""
        customizations = case.template_data.get('customizations', {})
        sections = customizations.get('sections', {})
        
        # Justice has: caseFacts, evidence, lawEnforcement
        case_facts = sections.get('caseFacts', {})
        evidence = sections.get('evidence', {})
        law_enforcement = sections.get('lawEnforcement', {})
        
        # Generate HTML with these unique sections
        # ...
        
        return {}