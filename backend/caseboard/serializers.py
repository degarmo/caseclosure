# caseboard/serializers.py - V2 with Workspace Architecture
"""
Django REST Framework Serializers for CaseBoard V2
Supports: Master Cases + User Workspaces
"""

from rest_framework import serializers
from .models import (
    Case, UserWorkspace, OfficialEvidence, WorkspaceEvidence,
    WorkspaceSuspect, WorkspaceTimelineEvent, WorkspaceNote, Tip
)
from django.contrib.auth import get_user_model

User = get_user_model()


# ============================================================================
# USER SERIALIZERS
# ============================================================================

class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user info for nested serialization"""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email', 'first_name', 'last_name']


# ============================================================================
# CASE SERIALIZERS (Master Case)
# ============================================================================

class CaseListSerializer(serializers.ModelSerializer):
    """List view - summary of cases"""
    created_by = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'case_number', 'title', 'slug', 'case_type', 'status',
            'victim_name', 'incident_date', 'jurisdiction',
            'is_official', 'is_community', 'requires_subscription',
            'total_investigators', 'total_evidence_uploaded', 'total_tips_received',
            'created_by', 'created_at', 'last_activity'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity']


class CaseDetailSerializer(serializers.ModelSerializer):
    """Detail view - full case data"""
    created_by = UserSimpleSerializer(read_only=True)
    owner = UserSimpleSerializer(read_only=True)
    team_members = UserSimpleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_activity']


class CaseCreateSerializer(serializers.ModelSerializer):
    """Create/update cases"""
    
    class Meta:
        model = Case
        fields = [
            'case_number', 'title', 'slug', 'case_type', 'status',
            'jurisdiction', 'victim_name', 'victim_age', 'victim_gender',
            'victim_description', 'incident_date', 'incident_location',
            'incident_summary', 'lead_investigator', 'investigating_agency',
            'case_file_number', 'is_official', 'official_source',
            'is_community', 'requires_subscription', 'tags'
        ]


# ============================================================================
# WORKSPACE SERIALIZERS
# ============================================================================

class UserWorkspaceListSerializer(serializers.ModelSerializer):
    """List view - summary of workspaces"""
    case_title = serializers.CharField(source='case.title', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserWorkspace
        fields = [
            'id', 'case', 'case_title', 'case_number', 'user', 'user_email',
            'workspace_name', 'is_shared', 'share_with_community',
            'confidence_level', 'evidence_count', 'suspect_count',
            'note_count', 'hours_invested', 'created_at', 'last_active'
        ]
        read_only_fields = ['id', 'created_at', 'last_active']


class UserWorkspaceDetailSerializer(serializers.ModelSerializer):
    """Detail view - full workspace data"""
    case = CaseListSerializer(read_only=True)
    user = UserSimpleSerializer(read_only=True)
    shared_with_users = UserSimpleSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserWorkspace
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_active']


class UserWorkspaceCreateSerializer(serializers.ModelSerializer):
    """Create/update workspaces"""
    
    class Meta:
        model = UserWorkspace
        fields = [
            'case', 'workspace_name', 'is_shared', 'share_with_community',
            'my_theory', 'confidence_level', 'hours_invested'
        ]


# ============================================================================
# OFFICIAL EVIDENCE SERIALIZERS
# ============================================================================

class OfficialEvidenceListSerializer(serializers.ModelSerializer):
    """List view - summary of official evidence"""
    uploaded_by = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = OfficialEvidence
        fields = [
            'id', 'evidence_number', 'title', 'evidence_type',
            'description', 'file', 'thumbnail', 'collected_date',
            'uploaded_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'thumbnail']


class OfficialEvidenceDetailSerializer(serializers.ModelSerializer):
    """Detail view - full official evidence data"""
    uploaded_by = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = OfficialEvidence
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'thumbnail']


class OfficialEvidenceCreateSerializer(serializers.ModelSerializer):
    """Create/update official evidence"""
    
    class Meta:
        model = OfficialEvidence
        fields = [
            'case', 'evidence_number', 'title', 'evidence_type',
            'description', 'file', 'collected_date', 'collected_by',
            'collected_location', 'tags'
        ]


# ============================================================================
# WORKSPACE EVIDENCE SERIALIZERS
# ============================================================================

class WorkspaceEvidenceListSerializer(serializers.ModelSerializer):
    """List view - summary of workspace evidence"""
    workspace_user = serializers.CharField(source='workspace.user.email', read_only=True)
    
    class Meta:
        model = WorkspaceEvidence
        fields = [
            'id', 'title', 'evidence_type', 'description',
            'file', 'thumbnail', 'source', 'date_obtained',
            'workspace', 'workspace_user', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'thumbnail', 'workspace_user']


class WorkspaceEvidenceDetailSerializer(serializers.ModelSerializer):
    """Detail view - full workspace evidence data"""
    
    class Meta:
        model = WorkspaceEvidence
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'thumbnail']


class WorkspaceEvidenceCreateSerializer(serializers.ModelSerializer):
    """Create/update workspace evidence"""
    
    class Meta:
        model = WorkspaceEvidence
        fields = [
            'workspace', 'title', 'evidence_type', 'description',
            'file', 'my_analysis', 'significance', 'source',
            'date_obtained', 'tags'
        ]


# ============================================================================
# WORKSPACE SUSPECT SERIALIZERS
# ============================================================================

class WorkspaceSuspectListSerializer(serializers.ModelSerializer):
    """List view - summary of suspects"""
    workspace_user = serializers.CharField(source='workspace.user.email', read_only=True)
    
    class Meta:
        model = WorkspaceSuspect
        fields = [
            'id', 'name', 'aliases', 'status', 'my_confidence',
            'photo', 'relationship_to_victim', 'workspace',
            'workspace_user', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'workspace_user']


class WorkspaceSuspectDetailSerializer(serializers.ModelSerializer):
    """Detail view - full suspect data"""
    supporting_evidence = WorkspaceEvidenceListSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkspaceSuspect
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkspaceSuspectCreateSerializer(serializers.ModelSerializer):
    """Create/update suspects"""
    
    class Meta:
        model = WorkspaceSuspect
        fields = [
            'workspace', 'name', 'aliases', 'age', 'description',
            'photo', 'status', 'my_confidence', 'relationship_to_victim',
            'last_known_location', 'my_theory', 'motive', 'alibi',
            'supporting_evidence', 'tags'
        ]


# ============================================================================
# WORKSPACE TIMELINE SERIALIZERS
# ============================================================================

class WorkspaceTimelineEventListSerializer(serializers.ModelSerializer):
    """List view - summary of timeline events"""
    workspace_user = serializers.CharField(source='workspace.user.email', read_only=True)
    
    class Meta:
        model = WorkspaceTimelineEvent
        fields = [
            'id', 'title', 'event_type', 'event_date', 'event_time',
            'is_approximate', 'is_key_event', 'my_confidence',
            'workspace', 'workspace_user', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'workspace_user']


class WorkspaceTimelineEventDetailSerializer(serializers.ModelSerializer):
    """Detail view - full timeline event data"""
    related_suspects = WorkspaceSuspectListSerializer(many=True, read_only=True)
    related_evidence = WorkspaceEvidenceListSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkspaceTimelineEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkspaceTimelineEventCreateSerializer(serializers.ModelSerializer):
    """Create/update timeline events"""
    
    class Meta:
        model = WorkspaceTimelineEvent
        fields = [
            'workspace', 'title', 'description', 'event_type',
            'event_date', 'event_time', 'is_approximate',
            'my_confidence', 'source', 'my_reasoning',
            'related_suspects', 'related_evidence', 'tags',
            'is_key_event'
        ]


# ============================================================================
# WORKSPACE NOTE SERIALIZERS
# ============================================================================

class WorkspaceNoteListSerializer(serializers.ModelSerializer):
    """List view - summary of notes"""
    workspace_user = serializers.CharField(source='workspace.user.email', read_only=True)
    
    class Meta:
        model = WorkspaceNote
        fields = [
            'id', 'title', 'content', 'is_important',
            'workspace', 'workspace_user', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'workspace_user']


class WorkspaceNoteDetailSerializer(serializers.ModelSerializer):
    """Detail view - full note data"""
    
    class Meta:
        model = WorkspaceNote
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkspaceNoteCreateSerializer(serializers.ModelSerializer):
    """Create/update notes"""
    
    class Meta:
        model = WorkspaceNote
        fields = [
            'workspace', 'title', 'content', 'is_important', 'tags'
        ]


# ============================================================================
# TIP SERIALIZERS
# ============================================================================

class TipListSerializer(serializers.ModelSerializer):
    """List view - summary of tips"""
    assigned_to_name = serializers.CharField(source='assigned_to.email', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    
    class Meta:
        model = Tip
        fields = [
            'id', 'subject', 'status', 'priority', 'is_anonymous',
            'case', 'case_title', 'submitted_at', 'assigned_to_name'
        ]
        read_only_fields = ['id', 'submitted_at', 'assigned_to_name', 'case_title']


class TipDetailSerializer(serializers.ModelSerializer):
    """Detail view - full tip data"""
    assigned_to = UserSimpleSerializer(read_only=True)
    user = UserSimpleSerializer(read_only=True)
    case = CaseListSerializer(read_only=True)
    
    class Meta:
        model = Tip
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'updated_at']


class TipCreateSerializer(serializers.ModelSerializer):
    """Create tips (public submission)"""
    
    class Meta:
        model = Tip
        fields = [
            'case', 'subject', 'content',
            'submitter_name', 'submitter_email', 'submitter_phone',
            'is_anonymous'
        ]