from django.contrib import admin
from .models import (
    Case, UserWorkspace, OfficialEvidence, WorkspaceEvidence,
    WorkspaceSuspect, WorkspaceTimelineEvent, WorkspaceNote, Tip
)

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'title', 'is_official', 'is_community', 'requires_subscription', 'created_at']
    list_filter = ['is_official', 'is_community', 'requires_subscription', 'case_type', 'status']
    search_fields = ['case_number', 'title', 'victim_name']
    prepopulated_fields = {'slug': ('title',)}

@admin.register(UserWorkspace)
class UserWorkspaceAdmin(admin.ModelAdmin):
    list_display = ['user', 'case', 'is_shared', 'share_with_community', 'created_at']
    list_filter = ['is_shared', 'share_with_community']
    search_fields = ['workspace_name', 'user__email', 'case__title']
    
@admin.register(OfficialEvidence)
class OfficialEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence_number', 'title', 'case', 'evidence_type', 'created_at']
    list_filter = ['evidence_type']
    search_fields = ['evidence_number', 'title', 'case__title']

@admin.register(WorkspaceEvidence)
class WorkspaceEvidenceAdmin(admin.ModelAdmin):
    list_display = ['title', 'workspace', 'evidence_type', 'created_at']
    list_filter = ['evidence_type']
    search_fields = ['title', 'workspace__user__email']

@admin.register(WorkspaceSuspect)
class WorkspaceSuspectAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'status', 'my_confidence', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'aliases', 'workspace__user__email']

@admin.register(WorkspaceTimelineEvent)
class WorkspaceTimelineEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_date', 'event_type', 'workspace', 'is_key_event']
    list_filter = ['event_type', 'is_key_event']
    date_hierarchy = 'event_date'
    search_fields = ['title', 'description', 'workspace__user__email']

@admin.register(WorkspaceNote)
class WorkspaceNoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'workspace', 'is_important', 'created_at']
    list_filter = ['is_important']
    search_fields = ['title', 'content', 'workspace__user__email']

@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):
    list_display = ['subject', 'case', 'status', 'priority', 'is_anonymous', 'submitted_at']
    list_filter = ['status', 'priority', 'is_anonymous']
    search_fields = ['subject', 'content', 'case__title', 'submitter_email']