# caseboard/urls.py - V2 with Workspace Architecture
"""
URL Configuration for CaseBoard API V2
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CaseViewSet,
    UserWorkspaceViewSet,
    OfficialEvidenceViewSet,
    WorkspaceEvidenceViewSet,
    WorkspaceSuspectViewSet,
    WorkspaceTimelineEventViewSet,
    WorkspaceNoteViewSet,
    TipViewSet,
)

app_name = 'caseboard'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'workspaces', UserWorkspaceViewSet, basename='workspace')
router.register(r'official-evidence', OfficialEvidenceViewSet, basename='official-evidence')
router.register(r'workspace-evidence', WorkspaceEvidenceViewSet, basename='workspace-evidence')
router.register(r'workspace-suspects', WorkspaceSuspectViewSet, basename='workspace-suspect')
router.register(r'workspace-timeline', WorkspaceTimelineEventViewSet, basename='workspace-timeline')
router.register(r'workspace-notes', WorkspaceNoteViewSet, basename='workspace-note')
router.register(r'tips', TipViewSet, basename='tip')

urlpatterns = [
    path('', include(router.urls)),
]

"""
========================================
API ENDPOINTS - CASEBOARD V2
========================================

CASES (Master Cases - Official FOIA or User-Created)
========================================
GET     /api/caseboard/cases/                              - List all cases
POST    /api/caseboard/cases/                              - Create new case
GET     /api/caseboard/cases/{slug}/                       - Get case detail
PUT     /api/caseboard/cases/{slug}/                       - Update case
PATCH   /api/caseboard/cases/{slug}/                       - Partial update
DELETE  /api/caseboard/cases/{slug}/                       - Delete case
POST    /api/caseboard/cases/{slug}/start_investigation/   - Start investigating (creates workspace)
GET     /api/caseboard/cases/{slug}/statistics/            - Get case statistics

Query params:
- ?case_type=homicide
- ?status=cold
- ?is_official=true
- ?is_community=false
- ?requires_subscription=true
- ?search=john

========================================
USER WORKSPACES
========================================
GET     /api/caseboard/workspaces/                         - List your workspaces
POST    /api/caseboard/workspaces/                         - Create workspace
GET     /api/caseboard/workspaces/{id}/                    - Get workspace detail
PUT     /api/caseboard/workspaces/{id}/                    - Update workspace
PATCH   /api/caseboard/workspaces/{id}/                    - Partial update
DELETE  /api/caseboard/workspaces/{id}/                    - Delete workspace

Query params:
- ?case={case_id}
- ?is_shared=true
- ?share_with_community=true

========================================
OFFICIAL EVIDENCE (Part of Master Case)
========================================
GET     /api/caseboard/official-evidence/                  - List official evidence
POST    /api/caseboard/official-evidence/                  - Upload official evidence (staff only)
GET     /api/caseboard/official-evidence/{id}/             - Get evidence detail
PUT     /api/caseboard/official-evidence/{id}/             - Update evidence (staff only)
DELETE  /api/caseboard/official-evidence/{id}/             - Delete evidence (staff only)

Query params:
- ?case={case_id}
- ?evidence_type=photo

========================================
WORKSPACE EVIDENCE (User Uploads)
========================================
GET     /api/caseboard/workspace-evidence/                 - List your evidence
POST    /api/caseboard/workspace-evidence/                 - Upload evidence to workspace
GET     /api/caseboard/workspace-evidence/{id}/            - Get evidence detail
PUT     /api/caseboard/workspace-evidence/{id}/            - Update evidence
DELETE  /api/caseboard/workspace-evidence/{id}/            - Delete evidence

Query params:
- ?workspace={workspace_id}
- ?evidence_type=photo

========================================
WORKSPACE SUSPECTS (User Theories)
========================================
GET     /api/caseboard/workspace-suspects/                 - List your suspects
POST    /api/caseboard/workspace-suspects/                 - Add suspect to workspace
GET     /api/caseboard/workspace-suspects/{id}/            - Get suspect detail
PUT     /api/caseboard/workspace-suspects/{id}/            - Update suspect
DELETE  /api/caseboard/workspace-suspects/{id}/            - Delete suspect

Query params:
- ?workspace={workspace_id}
- ?status=suspect
- ?my_confidence=8

========================================
WORKSPACE TIMELINE (User Timeline)
========================================
GET     /api/caseboard/workspace-timeline/                 - List your timeline events
POST    /api/caseboard/workspace-timeline/                 - Add timeline event
GET     /api/caseboard/workspace-timeline/{id}/            - Get event detail
PUT     /api/caseboard/workspace-timeline/{id}/            - Update event
DELETE  /api/caseboard/workspace-timeline/{id}/            - Delete event
GET     /api/caseboard/workspace-timeline/timeline_data/   - Get timeline for D3.js

Query params:
- ?workspace={workspace_id}
- ?event_type=incident
- ?is_key_event=true

========================================
WORKSPACE NOTES (User Notes)
========================================
GET     /api/caseboard/workspace-notes/                    - List your notes
POST    /api/caseboard/workspace-notes/                    - Create note
GET     /api/caseboard/workspace-notes/{id}/               - Get note detail
PUT     /api/caseboard/workspace-notes/{id}/               - Update note
DELETE  /api/caseboard/workspace-notes/{id}/               - Delete note

Query params:
- ?workspace={workspace_id}
- ?is_important=true

========================================
TIPS (Public Submissions)
========================================
GET     /api/caseboard/tips/                               - List tips
POST    /api/caseboard/tips/                               - Submit tip (public allowed)
GET     /api/caseboard/tips/{id}/                          - Get tip detail
PUT     /api/caseboard/tips/{id}/                          - Update tip
DELETE  /api/caseboard/tips/{id}/                          - Delete tip

Query params:
- ?case={case_id}
- ?status=new
- ?priority=5

========================================
EXAMPLE WORKFLOW
========================================

# 1. User browses cases
GET /api/caseboard/cases/?is_official=true

# 2. User starts investigating a case
POST /api/caseboard/cases/john-doe-2019/start_investigation/
Response: { "workspace_id": "uuid-here" }

# 3. User adds suspect to their workspace
POST /api/caseboard/workspace-suspects/
{
  "workspace": "workspace-uuid",
  "name": "Jane Smith",
  "my_theory": "Suspicious behavior...",
  "my_confidence": 7
}

# 4. User uploads evidence to workspace
POST /api/caseboard/workspace-evidence/
{
  "workspace": "workspace-uuid",
  "title": "Screenshot of social media post",
  "evidence_type": "screenshot",
  "file": (binary),
  "my_analysis": "This shows..."
}

# 5. User adds timeline event
POST /api/caseboard/workspace-timeline/
{
  "workspace": "workspace-uuid",
  "title": "Suspect seen at location",
  "event_date": "2019-03-15",
  "event_type": "suspect_activity",
  "my_confidence": 8
}

# 6. User shares workspace with community
PATCH /api/caseboard/workspaces/{workspace_id}/
{
  "is_shared": true,
  "share_with_community": true
}

# 7. Public submits tip
POST /api/caseboard/tips/
{
  "case": "case-uuid",
  "subject": "I saw something",
  "content": "I was there that night...",
  "is_anonymous": true
}
"""