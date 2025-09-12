# cases/services/deployment.py - Updated to deploy actual React build

import os
import json
import requests
import zipfile
import io
import base64
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.files.base import ContentFile
import hashlib
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
import logging

from ..models import Case, DeploymentLog, TemplateRegistry

logger = logging.getLogger(__name__)


class NetlifyDeploymentService:
    """
    Deploy to Netlify - Deploys actual React build files
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'NETLIFY_API_KEY', None)
        self.base_url = "https://api.netlify.com/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.timeout = 30
    
    def deploy_case(self, case: Case) -> Dict[str, Any]:
        """Deploy case website to Netlify"""
        deployment_log = DeploymentLog.objects.create(
            case=case,
            action='deploy' if not case.render_service_id else 'update',
            status='started',
            details={'subdomain': case.subdomain, 'template': case.template_id}
        )
        
        try:
            if not self.api_key:
                raise Exception("Netlify API key not configured")
            
            logger.info(f"Starting deployment for case {case.id}")
            
            # Step 1: Generate or get site files
            try:
                site_files = self.get_site_files(case)
            except Exception as e:
                raise Exception(f"Failed to get site files: {str(e)}")
            
            # Step 2: Create ZIP file
            try:
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    for filepath, content in site_files.items():
                        # Handle both string and bytes content
                        if isinstance(content, str):
                            content = content.encode('utf-8')
                        zip_file.writestr(filepath, content)
                zip_buffer.seek(0)
            except Exception as e:
                raise Exception(f"Failed to create ZIP file: {str(e)}")
            
            # Step 3: Create or update Netlify site
            if not case.render_service_id:
                try:
                    site = self.create_netlify_site(case)
                    case.render_service_id = site['id']
                    case.save()
                except Exception as e:
                    raise Exception(f"Failed to create Netlify site: {str(e)}")
            
            # Step 4: Deploy ZIP
            try:
                deploy_result = self.deploy_zip_to_netlify(case, zip_buffer.getvalue())
            except Exception as e:
                raise Exception(f"Failed to deploy ZIP to Netlify: {str(e)}")
            
            # Step 5: Configure domain (optional)
            if case.subdomain:
                try:
                    self.configure_netlify_domain(case, f"{case.subdomain}.caseclosure.org")
                except Exception as e:
                    logger.warning(f"Domain config warning: {str(e)}")
            
            # Update case status
            case.deployment_status = 'deployed'
            case.last_deployed_at = timezone.now()
            case.deployment_url = deploy_result.get('url', self.get_site_url(case))
            case.deployment_error = ''
            case.save()
            
            # Update log
            deployment_log.status = 'success'
            deployment_log.completed_at = timezone.now()
            deployment_log.render_deploy_id = deploy_result.get('id')
            deployment_log.save()
            
            logger.info(f"Successfully deployed case {case.id} to {case.deployment_url}")
            
            return {
                'success': True,
                'url': case.deployment_url,
                'service_id': case.render_service_id,
                'deploy_id': deploy_result.get('id')
            }
            
        except Exception as e:
            logger.error(f"Deployment failed for case {case.id}: {str(e)}")
            
            case.deployment_status = 'failed'
            case.deployment_error = str(e) or ''
            case.save()
            
            deployment_log.status = 'failed'
            deployment_log.error_message = str(e)
            deployment_log.completed_at = timezone.now()
            deployment_log.save()
            
            raise Exception(f"Deployment failed: {str(e)}")
    
    def get_site_files(self, case: Case) -> Dict[str, Any]:
        # Update this path to point to your actual dist folder
        frontend_build_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'dist')
        
        # Add debug logging to see what's happening
        logger.info(f"Looking for React build at: {frontend_build_path}")
        logger.info(f"Absolute path: {os.path.abspath(frontend_build_path)}")
        logger.info(f"Path exists: {os.path.exists(frontend_build_path)}")
        
        if os.path.exists(frontend_build_path) and os.path.isdir(frontend_build_path):
            logger.info("Using React build files for deployment")
            files = os.listdir(frontend_build_path)
            logger.info(f"Found {len(files)} files: {files[:5]}")  # Log first 5 files
            return self.get_react_build_files(case, frontend_build_path)
        else:
            logger.warning(f"React build not found at {frontend_build_path}")
            return self.generate_static_site(case)
    
    def get_react_build_files(self, case: Case, build_path: str) -> Dict[str, Any]:
        """
        Get files from React build directory and inject case configuration
        """
        files = {}
        
        # Read all build files
        for root, dirs, filenames in os.walk(build_path):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, build_path)
                
                # Skip source maps in production
                if filename.endswith('.map'):
                    continue
                
                with open(file_path, 'rb') as f:
                    content = f.read()
                    
                    # Inject case config into index.html
                    if filename == 'index.html':
                        content = self.inject_case_config(content.decode('utf-8'), case)
                        files[relative_path] = content
                    else:
                        files[relative_path] = content
        
        # Add case configuration file
        files['config.json'] = json.dumps({
            'caseId': case.id,
            'subdomain': case.subdomain,
            'apiUrl': f"{getattr(settings, 'API_URL', 'https://api.caseclosure.org')}/api",
            'templateId': case.template_id,
            'customizations': case.template_data.get('customizations', {}) if case.template_data else {},
            'caseData': {
                'first_name': case.first_name,
                'last_name': case.last_name,
                'case_title': case.case_title,
                'description': case.description,
                'case_type': case.case_type,
                'detective_name': case.detective_name,
                'detective_phone': case.detective_phone,
                'detective_email': case.detective_email,
            }
        })
        
        return files
    
    def inject_case_config(self, html_content: str, case: Case) -> str:
        """
        Inject case configuration into index.html
        """
        config_script = f"""
        <script>
            window.CASE_CONFIG = {{
                caseId: {case.id},
                subdomain: '{case.subdomain}',
                apiUrl: '{getattr(settings, 'API_URL', 'https://api.caseclosure.org')}/api',
                templateId: '{case.template_id}',
                isDeployed: true
            }};
        </script>
        """
        
        # Inject before closing head tag
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f'{config_script}</head>')
        else:
            # Fallback: inject at the beginning of body
            html_content = html_content.replace('<body>', f'<body>{config_script}')
        
        return html_content
    
    def generate_static_site(self, case: Case) -> Dict[str, str]:
        """
        Generate a better static site with actual content and styling
        """
        files = {}
        customizations = case.template_data.get('customizations', {}) if case.template_data else {}
        
        # Generate enhanced HTML
        files['index.html'] = self.generate_enhanced_html(case, customizations)
        files['styles.css'] = self.generate_enhanced_styles(case, customizations)
        files['app.js'] = self.generate_enhanced_javascript(case, customizations)
        
        # Add data file
        files['data.json'] = json.dumps({
            'case': {
                'id': case.id,
                'first_name': case.first_name,
                'last_name': case.last_name,
                'case_title': case.case_title or f"Case {case.id}",
                'description': case.description or '',
                'case_type': case.case_type,
                'incident_date': str(case.incident_date) if case.incident_date else None,
                'last_seen_date': str(case.last_seen_date) if case.last_seen_date else None,
                'reward_amount': str(case.reward_amount) if case.reward_amount else None,
                'detective_name': case.detective_name,
                'detective_phone': case.detective_phone,
                'detective_email': case.detective_email,
                'primary_photo': case.primary_photo.url if case.primary_photo else None,
            },
            'customizations': customizations,
            'template_id': case.template_id
        })
        
        return files
    
    def generate_enhanced_html(self, case: Case, customizations: Dict) -> str:
        """Generate enhanced HTML with better structure"""
        name = f"{case.first_name} {case.last_name}"
        title = case.case_title or f"Help Find {name}"
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="root">
        <header class="header">
            <div class="container">
                <h1>{title}</h1>
                <p class="subtitle">{name}</p>
            </div>
        </header>
        
        <main class="main-content">
            <div class="container">
                <section class="hero-section">
                    <div class="case-info">
                        <h2>Case Information</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Name:</strong> {name}
                            </div>
                            <div class="info-item">
                                <strong>Case Type:</strong> {case.case_type}
                            </div>
                            {f'<div class="info-item"><strong>Last Seen:</strong> {case.last_seen_date}</div>' if case.last_seen_date else ''}
                            {f'<div class="info-item"><strong>Reward:</strong> ${case.reward_amount}</div>' if case.reward_amount else ''}
                        </div>
                    </div>
                    
                    <div class="description">
                        <h3>Description</h3>
                        <p>{case.description or 'No description available.'}</p>
                    </div>
                    
                    <div class="contact-section">
                        <h3>Contact Information</h3>
                        <div class="contact-info">
                            <p><strong>Detective:</strong> {case.detective_name or 'Not specified'}</p>
                            <p><strong>Phone:</strong> {case.detective_phone or 'Not specified'}</p>
                            <p><strong>Email:</strong> {case.detective_email or 'Not specified'}</p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
        
        <footer class="footer">
            <div class="container">
                <p>If you have any information, please contact the authorities immediately.</p>
            </div>
        </footer>
    </div>
    <script src="/app.js"></script>
</body>
</html>"""
    
    def generate_enhanced_styles(self, case: Case, customizations: Dict) -> str:
        """Generate enhanced CSS"""
        primary_color = customizations.get('hero_backgroundColor', '#2563eb')
        
        return f"""
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background: #f9fafb;
}}

.container {{
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}}

.header {{
    background: linear-gradient(135deg, {primary_color} 0%, #1e40af 100%);
    color: white;
    padding: 3rem 0;
    text-align: center;
}}

.header h1 {{
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}}

.subtitle {{
    font-size: 1.25rem;
    opacity: 0.9;
}}

.main-content {{
    padding: 3rem 0;
}}

.hero-section {{
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}}

.case-info {{
    margin-bottom: 2rem;
}}

.info-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}}

.info-item {{
    padding: 0.75rem;
    background: #f3f4f6;
    border-radius: 6px;
}}

.description {{
    margin: 2rem 0;
    padding: 1.5rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
}}

.contact-section {{
    margin-top: 2rem;
    padding: 1.5rem;
    background: #dbeafe;
    border-radius: 8px;
}}

.footer {{
    background: #1f2937;
    color: white;
    padding: 2rem 0;
    text-align: center;
    margin-top: 3rem;
}}
"""
    
    def generate_enhanced_javascript(self, case: Case, customizations: Dict) -> str:
        """Generate enhanced JavaScript"""
        return """
// Enhanced memorial site functionality
(function() {
    console.log('Memorial site loaded');
    
    // Load additional data if needed
    fetch('/data.json')
        .then(response => response.json())
        .then(data => {
            console.log('Case data loaded:', data);
            // Add any dynamic functionality here
        })
        .catch(error => console.error('Error loading case data:', error));
})();
"""
    
    def create_netlify_site(self, case: Case) -> Dict:
        """Create a new Netlify site"""
        site_name = f"caseclosure-{case.subdomain or f'case-{case.id}'}"
        
        payload = {
            "name": site_name,
            "custom_domain": case.custom_domain if case.custom_domain else None
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/sites",
                headers=self.headers,
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Netlify API error: {str(e)}")
    
    def deploy_zip_to_netlify(self, case: Case, zip_content: bytes) -> Dict:
        """Deploy ZIP file to Netlify site"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/zip"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/sites/{case.render_service_id}/deploys",
                headers=headers,
                data=zip_content,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Netlify deploy error: {str(e)}")
    
    def configure_netlify_domain(self, case: Case, domain: str) -> None:
        """Add custom domain to Netlify site"""
        payload = {"domain": domain}
        
        try:
            response = requests.post(
                f"{self.base_url}/sites/{case.render_service_id}/domains",
                headers=self.headers,
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code in [200, 201]:
                case.ssl_status = 'active'
                case.save()
            elif response.status_code == 409:
                logger.info(f"Domain {domain} already configured")
            else:
                logger.warning(f"Domain configuration returned status {response.status_code}")
        except Exception as e:
            logger.warning(f"Domain configuration error: {str(e)}")
    
    def get_site_url(self, case: Case) -> str:
        """Get the site URL"""
        if case.custom_domain:
            return f"https://{case.custom_domain}"
        elif case.subdomain:
            return f"https://{case.subdomain}.caseclosure.org"
        elif case.render_service_id:
            return f"https://{case.render_service_id}.netlify.app"
        return ""


# Keep the rest of your classes (RenderDeploymentService, SimpleStaticDeployment) as they are

def get_deployment_service():
    """Factory function to get the appropriate deployment service"""
    deployment_provider = getattr(settings, 'DEPLOYMENT_PROVIDER', 'netlify')
    
    logger.info(f"Using deployment provider: {deployment_provider}")
    
    if deployment_provider == 'netlify' and hasattr(settings, 'NETLIFY_API_KEY'):
        return NetlifyDeploymentService()
    elif deployment_provider == 'render' and hasattr(settings, 'RENDER_API_KEY'):
        return RenderDeploymentService()
    elif deployment_provider == 's3' or deployment_provider == 'r2':
        return SimpleStaticDeployment()
    else:
        return NetlifyDeploymentService()