# caseboard/views.py - V2 with Workspace Architecture
"""
Django REST Framework Views for CaseBoard V2
Supports: Master Cases + User Workspaces
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import (
    Case, UserWorkspace, OfficialEvidence, WorkspaceEvidence,
    WorkspaceSuspect, WorkspaceTimelineEvent, WorkspaceNote, Tip
)
from .serializers import (
    CaseListSerializer, CaseDetailSerializer, CaseCreateSerializer,
    UserWorkspaceListSerializer, UserWorkspaceDetailSerializer, UserWorkspaceCreateSerializer,
    OfficialEvidenceListSerializer, OfficialEvidenceDetailSerializer, OfficialEvidenceCreateSerializer,
    WorkspaceEvidenceListSerializer, WorkspaceEvidenceDetailSerializer, WorkspaceEvidenceCreateSerializer,
    WorkspaceSuspectListSerializer, WorkspaceSuspectDetailSerializer, WorkspaceSuspectCreateSerializer,
    WorkspaceTimelineEventListSerializer, WorkspaceTimelineEventDetailSerializer, WorkspaceTimelineEventCreateSerializer,
    WorkspaceNoteListSerializer, WorkspaceNoteDetailSerializer, WorkspaceNoteCreateSerializer,
    TipListSerializer, TipDetailSerializer, TipCreateSerializer,
)


# ============================================================================
# PERMISSIONS
# ============================================================================

class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission: Only staff can create/edit official cases
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsWorkspaceOwner(permissions.BasePermission):
    """
    Custom permission: Only workspace owner can edit their workspace
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions
        if request.method in permissions.SAFE_METHODS:
            # Check if workspace is shared
            if hasattr(obj, 'is_shared'):
                if obj.is_shared and obj.share_with_community:
                    return True
                if obj.is_shared and request.user in obj.shared_with_users.all():
                    return True
            # Check parent workspace for nested objects
            if hasattr(obj, 'workspace'):
                workspace = obj.workspace
                if workspace.is_shared and workspace.share_with_community:
                    return True
                if workspace.is_shared and request.user in workspace.shared_with_users.all():
                    return True
                return request.user == workspace.user
            return request.user == obj.user
        
        # Write permissions only for owner
        if hasattr(obj, 'workspace'):
            return request.user == obj.workspace.user
        return request.user == obj.user


# ============================================================================
# CASE VIEWSET (Master Cases)
# ============================================================================

class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Case CRUD operations
    Official FOIA cases + User-created cases (community or private)
    """
    
    queryset = Case.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['case_type', 'status', 'is_official', 'is_community', 'requires_subscription']
    search_fields = ['case_number', 'title', 'victim_name', 'jurisdiction']
    ordering_fields = ['created_at', 'last_activity', 'case_number']
    ordering = ['-last_activity']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CaseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CaseCreateSerializer
        return CaseDetailSerializer
    
    def get_queryset(self):
        """Filter based on user access"""
        queryset = Case.objects.all()
        user = self.request.user
        
        if user.is_authenticated:
            # Show community + owned private cases + team member cases
            queryset = queryset.filter(
                Q(is_community=True) |
                Q(owner=user) |
                Q(created_by=user) |
                Q(team_members=user)
            ).distinct()
        else:
            # Only show community cases to anonymous users
            queryset = queryset.filter(is_community=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set creator when creating case"""
        case = serializer.save(created_by=self.request.user)
        
        # If private case, set owner
        if not case.is_community:
            case.owner = self.request.user
            case.save()
    
    @action(detail=True, methods=['post'])
    def start_investigation(self, request, slug=None):
        """
        User starts investigating this case - creates their workspace
        """
        case = self.get_object()
        user = request.user
        
        # Check if requires subscription
        if case.requires_subscription:
            # TODO: Check if user has active subscription
            # if not user.has_active_subscription():
            #     return Response(
            #         {'error': 'This case requires an active subscription'},
            #         status=status.HTTP_402_PAYMENT_REQUIRED
            #     )
            pass
        
        # Check if workspace already exists
        workspace, created = UserWorkspace.objects.get_or_create(
            case=case,
            user=user,
            defaults={
                'workspace_name': f"Investigation of {case.title}",
                'is_shared': False
            }
        )
        
        if not created:
            return Response(
                {'message': 'Workspace already exists', 'workspace_id': str(workspace.id)},
                status=status.HTTP_200_OK
            )
        
        # Update case stats
        case.total_investigators = case.workspaces.count()
        case.save()
        
        return Response(
            {'message': 'Workspace created', 'workspace_id': str(workspace.id)},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, slug=None):
        """Get case statistics"""
        case = self.get_object()
        
        stats = {
            'total_investigators': case.workspaces.count(),
            'official_evidence_count': case.official_evidence.count(),
            'total_tips': case.tips.count(),
            'workspace_evidence_count': sum(ws.evidence_count for ws in case.workspaces.all()),
            'workspace_suspect_count': sum(ws.suspect_count for ws in case.workspaces.all()),
        }
        
        return Response(stats)


# ============================================================================
# WORKSPACE VIEWSET
# ============================================================================

class UserWorkspaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UserWorkspace CRUD operations
    Individual investigation workspaces
    """
    
    queryset = UserWorkspace.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['case', 'is_shared', 'share_with_community']
    search_fields = ['workspace_name', 'my_theory']
    ordering_fields = ['created_at', 'last_active', 'hours_invested']
    ordering = ['-last_active']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserWorkspaceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return UserWorkspaceCreateSerializer
        return UserWorkspaceDetailSerializer
    
    def get_queryset(self):
        """Filter workspaces user can access"""
        user = self.request.user
        
        # User's own workspaces + shared with them + community shared
        return UserWorkspace.objects.filter(
            Q(user=user) |
            Q(shared_with_users=user) |
            Q(is_shared=True, share_with_community=True)
        ).distinct()
    
    def perform_create(self, serializer):
        """Set user when creating workspace"""
        serializer.save(user=self.request.user)


# ============================================================================
# OFFICIAL EVIDENCE VIEWSET
# ============================================================================

class OfficialEvidenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Official Evidence (part of master case)
    Only staff can create/edit
    """
    
    queryset = OfficialEvidence.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['case', 'evidence_type']
    search_fields = ['evidence_number', 'title', 'description', 'tags']
    ordering_fields = ['created_at', 'collected_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OfficialEvidenceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OfficialEvidenceCreateSerializer
        return OfficialEvidenceDetailSerializer
    
    def perform_create(self, serializer):
        """Set uploader when creating evidence"""
        serializer.save(uploaded_by=self.request.user)


# ============================================================================
# WORKSPACE EVIDENCE VIEWSET
# ============================================================================

class WorkspaceEvidenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace Evidence (user's uploads)
    """
    
    queryset = WorkspaceEvidence.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workspace', 'evidence_type']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'date_obtained']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkspaceEvidenceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return WorkspaceEvidenceCreateSerializer
        return WorkspaceEvidenceDetailSerializer
    
    def get_queryset(self):
        """Filter evidence user can access"""
        user = self.request.user
        
        # User's own evidence + evidence from shared workspaces
        return WorkspaceEvidence.objects.filter(
            Q(workspace__user=user) |
            Q(workspace__shared_with_users=user) |
            Q(workspace__is_shared=True, workspace__share_with_community=True)
        ).distinct()


# ============================================================================
# WORKSPACE SUSPECT VIEWSET
# ============================================================================

class WorkspaceSuspectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace Suspects (user's theories)
    """
    
    queryset = WorkspaceSuspect.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workspace', 'status', 'my_confidence']
    search_fields = ['name', 'aliases', 'description']
    ordering_fields = ['my_confidence', 'name', 'created_at']
    ordering = ['-my_confidence', 'name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkspaceSuspectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return WorkspaceSuspectCreateSerializer
        return WorkspaceSuspectDetailSerializer
    
    def get_queryset(self):
        """Filter suspects user can access"""
        user = self.request.user
        
        return WorkspaceSuspect.objects.filter(
            Q(workspace__user=user) |
            Q(workspace__shared_with_users=user) |
            Q(workspace__is_shared=True, workspace__share_with_community=True)
        ).distinct()


# ============================================================================
# WORKSPACE TIMELINE VIEWSET
# ============================================================================

class WorkspaceTimelineEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace Timeline Events
    """
    
    queryset = WorkspaceTimelineEvent.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workspace', 'event_type', 'is_key_event']
    search_fields = ['title', 'description', 'source']
    ordering_fields = ['event_date', 'event_time', 'created_at']
    ordering = ['event_date', 'event_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkspaceTimelineEventListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return WorkspaceTimelineEventCreateSerializer
        return WorkspaceTimelineEventDetailSerializer
    
    def get_queryset(self):
        """Filter timeline events user can access"""
        user = self.request.user
        
        return WorkspaceTimelineEvent.objects.filter(
            Q(workspace__user=user) |
            Q(workspace__shared_with_users=user) |
            Q(workspace__is_shared=True, workspace__share_with_community=True)
        ).distinct()
    
    @action(detail=False, methods=['get'])
    def timeline_data(self, request):
        """Get timeline data formatted for D3.js visualization"""
        workspace_id = request.query_params.get('workspace')
        
        queryset = self.get_queryset()
        if workspace_id:
            queryset = queryset.filter(workspace__id=workspace_id)
        
        timeline_data = []
        for event in queryset:
            timeline_data.append({
                'id': str(event.id),
                'title': event.title,
                'description': event.description,
                'event_type': event.event_type,
                'date': event.event_date.isoformat(),
                'time': event.event_time.isoformat() if event.event_time else None,
                'is_key_event': event.is_key_event,
                'is_approximate': event.is_approximate,
                'confidence': event.my_confidence,
            })
        
        return Response(timeline_data)


# ============================================================================
# WORKSPACE NOTE VIEWSET
# ============================================================================

class WorkspaceNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace Notes
    """
    
    queryset = WorkspaceNote.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['workspace', 'is_important']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkspaceNoteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return WorkspaceNoteCreateSerializer
        return WorkspaceNoteDetailSerializer
    
    def get_queryset(self):
        """Filter notes user can access"""
        user = self.request.user
        
        return WorkspaceNote.objects.filter(
            Q(workspace__user=user) |
            Q(workspace__shared_with_users=user) |
            Q(workspace__is_shared=True, workspace__share_with_community=True)
        ).distinct()


# ============================================================================
# TIP VIEWSET
# ============================================================================

class TipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tips (public can submit)
    """
    
    queryset = Tip.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['case', 'status', 'priority', 'is_anonymous']
    search_fields = ['subject', 'content']
    ordering_fields = ['priority', 'submitted_at']
    ordering = ['-priority', '-submitted_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TipListSerializer
        elif self.action == 'create':
            return TipCreateSerializer
        return TipDetailSerializer
    
    def perform_create(self, serializer):
        """Capture IP and user agent when tip is submitted"""
        ip_address = self.request.META.get('REMOTE_ADDR')
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        
        if self.request.user.is_authenticated:
            serializer.save(
                user=self.request.user,
                ip_address=ip_address,
                user_agent=user_agent
            )
        else:
            serializer.save(
                ip_address=ip_address,
                user_agent=user_agent
            )