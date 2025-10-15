# cases/urls.py - Updated URL configuration with case-specific spotlight

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views  
from .views import (
    CaseViewSet,
    SpotlightPostViewSet,
    TemplateRegistryViewSet,
    CasePhotoViewSet,
    DeploymentLogViewSet,
    ImageUploadView
)

# Create router and register all viewsets
router = DefaultRouter()

# Register all viewsets
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'case-spotlight', SpotlightPostViewSet, basename='case-spotlight')  # ✅ CHANGED: spotlight-posts → case-spotlight
router.register(r'templates', TemplateRegistryViewSet, basename='template')
router.register(r'case-photos', CasePhotoViewSet, basename='case-photo')
router.register(r'deployment-logs', DeploymentLogViewSet, basename='deployment-log')

# Combine router URLs with custom paths
urlpatterns = [
    path('images/upload/', ImageUploadView.as_view(), name='image-upload'),
    path('', include(router.urls)),
    
    # LEO invitation endpoints
    path('cases/<uuid:case_id>/invite-leo/', api_views.invite_leo, name='invite_leo'),
    path('accept-invite/', api_views.accept_leo_invite, name='accept_leo_invite'),
    path('cases/<uuid:case_id>/active-leos/', api_views.get_active_leos, name='active_leos'),
    path('cases/<uuid:case_id>/revoke-access/<uuid:access_id>/', api_views.revoke_access, name='revoke_access'),
]

# ================================================================
# AVAILABLE ENDPOINTS
# ================================================================
"""
CUSTOM ENDPOINTS:
------------------------------------
POST   /api/images/upload/                  - Upload image to Cloudinary

CASES:
------------------------------------
GET    /api/cases/                          - List cases
POST   /api/cases/                          - Create case
GET    /api/cases/{id}/                     - Get case detail
PUT    /api/cases/{id}/                     - Update case
PATCH  /api/cases/{id}/                     - Partial update
DELETE /api/cases/{id}/                     - Delete case

Custom Case Actions:
POST   /api/cases/{id}/upload_victim_photo/     - Upload victim photo
POST   /api/cases/{id}/save_customizations/     - Save template customizations
POST   /api/cases/{id}/deploy/                  - Deploy website
GET    /api/cases/{id}/deployment_status/       - Check deployment status  
POST   /api/cases/check_subdomain/              - Check subdomain availability
GET    /api/cases/my_cases/                     - Get only current user's cases
GET    /api/cases/stats/                        - Get case statistics
GET    /api/cases/by-subdomain/{subdomain}/     - Get case by subdomain (public)

CASE-SPECIFIC SPOTLIGHT POSTS:  ✅ UPDATED
------------------------------------
GET    /api/case-spotlight/                 - List posts (?case_id=xxx to filter)
POST   /api/case-spotlight/                 - Create post (requires case_id)
GET    /api/case-spotlight/{id}/            - Get post detail
PUT    /api/case-spotlight/{id}/            - Update post
PATCH  /api/case-spotlight/{id}/            - Partial update
DELETE /api/case-spotlight/{id}/            - Delete post
POST   /api/case-spotlight/{id}/increment_view/  - Increment view count

TEMPLATES:
------------------------------------
GET    /api/templates/                      - List available templates
GET    /api/templates/{id}/                 - Get template detail

CASE PHOTOS:
------------------------------------
GET    /api/case-photos/                    - List photos (?case_id=xxx to filter)
POST   /api/case-photos/                    - Upload photo
GET    /api/case-photos/{id}/               - Get photo detail
PUT    /api/case-photos/{id}/               - Update photo
PATCH  /api/case-photos/{id}/               - Partial update
DELETE /api/case-photos/{id}/               - Delete photo

DEPLOYMENT LOGS:
------------------------------------
GET    /api/deployment-logs/                - List logs (?case_id=xxx to filter)
GET    /api/deployment-logs/{id}/           - Get log detail

LEO INVITATION ENDPOINTS:
------------------------------------
POST   /api/cases/{case_id}/invite-leo/     - Invite LEO to case
POST   /api/accept-invite/                  - Accept LEO invitation
GET    /api/cases/{case_id}/active-leos/    - Get active LEOs for case
DELETE /api/cases/{case_id}/revoke-access/{access_id}/  - Revoke LEO access
"""