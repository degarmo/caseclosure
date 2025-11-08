# caseboard/models.py - UPDATED VERSION with User Workspaces
"""
CaseBoard Models - Master Case + User Workspace Architecture
Supports: Official FOIA cases, Community cases, Private paid cases
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


# ============================================================================
# MASTER CASE MODEL
# ============================================================================

class Case(models.Model):
    """
    Master Case - The official case record (FOIA or user-created)
    This is the "source of truth" - read-only for official cases
    """
    
    STATUS_CHOICES = [
        ('open', 'Open Investigation'),
        ('active', 'Actively Being Worked'),
        ('cold', 'Cold Case'),
        ('solved', 'Solved'),
        ('closed', 'Closed'),
    ]
    
    CASE_TYPES = [
        ('homicide', 'Homicide'),
        ('missing_person', 'Missing Person'),
        ('kidnapping', 'Kidnapping'),
        ('assault', 'Assault'),
        ('robbery', 'Robbery'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic info
    case_number = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    
    # Case details
    case_type = models.CharField(max_length=50, choices=CASE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    jurisdiction = models.CharField(max_length=100)
    
    # Victim information
    victim_name = models.CharField(max_length=255)
    victim_age = models.IntegerField(null=True, blank=True)
    victim_gender = models.CharField(max_length=20, blank=True)
    victim_description = models.TextField(blank=True)
    
    # Incident details
    incident_date = models.DateField(null=True, blank=True)
    incident_location = models.CharField(max_length=255, blank=True)
    incident_summary = models.TextField()
    
    # Investigation details (for official cases)
    lead_investigator = models.CharField(max_length=255, blank=True)
    investigating_agency = models.CharField(max_length=255, blank=True)
    case_file_number = models.CharField(max_length=100, blank=True)
    
    # NEW: Case Type Flags
    is_official = models.BooleanField(default=False, db_index=True)
    # True = Staff-created FOIA case (read-only base)
    # False = User-created case
    
    official_source = models.CharField(max_length=255, blank=True)
    # e.g., "Chicago PD FOIA Request 2024-123"
    
    is_community = models.BooleanField(default=True, db_index=True)
    # True = Free collaborative case (everyone can work on it)
    # False = Private paid case (owner + invited team only)
    
    # Ownership & Access
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_cases'
    )
    
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_cases',
        help_text="Owner of private cases"
    )
    
    team_members = models.ManyToManyField(
        User, 
        related_name='team_cases', 
        blank=True,
        help_text="Invited team members for private cases"
    )
    
    # Pricing
    requires_subscription = models.BooleanField(default=False)
    # True = Need paid subscription to create workspace
    
    price_to_make_private = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=4.99,
        help_text="One-time fee to convert community case to private"
    )
    
    # Metadata
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Stats (aggregate from workspaces)
    total_investigators = models.IntegerField(default=0)
    total_evidence_uploaded = models.IntegerField(default=0)
    total_tips_received = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_cases'
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['case_number']),
            models.Index(fields=['is_official', 'is_community']),
            models.Index(fields=['slug']),
        ]
    
    def __str__(self):
        case_type = "OFFICIAL" if self.is_official else "USER"
        privacy = "COMMUNITY" if self.is_community else "PRIVATE"
        return f"[{case_type}/{privacy}] {self.case_number} - {self.title}"
    
    def can_user_access(self, user):
        """Check if user can access this case"""
        if self.is_community:
            return True  # Community cases are open to all
        
        if not user.is_authenticated:
            return False
        
        # Private case - check ownership and team membership
        return (
            user == self.owner or
            user == self.created_by or
            user in self.team_members.all() or
            user.is_staff
        )
    
    def can_user_edit(self, user):
        """Check if user can edit master case data"""
        if not user.is_authenticated:
            return False
        
        # Official cases: only staff can edit
        if self.is_official:
            return user.is_staff
        
        # User-created cases: owner and team can edit
        return (
            user == self.owner or
            user == self.created_by or
            user.is_staff
        )


# ============================================================================
# USER WORKSPACE MODEL
# ============================================================================

class UserWorkspace(models.Model):
    """
    Individual user's investigation workspace
    Each user gets their own workspace when they start investigating a case
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Links
    case = models.ForeignKey(
        Case, 
        on_delete=models.CASCADE, 
        related_name='workspaces'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='my_workspaces'
    )
    
    # Workspace settings
    workspace_name = models.CharField(
        max_length=255, 
        blank=True,
        help_text="Custom name for this workspace (optional)"
    )
    
    is_shared = models.BooleanField(default=False)
    # True = Other users can see this workspace's findings
    # False = Private to this user only
    
    share_with_community = models.BooleanField(default=False)
    # True = Findings visible to all investigators on this case
    # False = Only shared with specific team members
    
    # User's theory/hypothesis
    my_theory = models.TextField(blank=True)
    confidence_level = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="How confident is user in their theory? 1-10"
    )
    
    # Workspace stats
    evidence_count = models.IntegerField(default=0)
    suspect_count = models.IntegerField(default=0)
    note_count = models.IntegerField(default=0)
    hours_invested = models.FloatField(default=0.0)
    
    # Collaboration
    shared_with_users = models.ManyToManyField(
        User,
        related_name='shared_workspaces',
        blank=True,
        help_text="Specific users who can view this workspace"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_workspaces'
        ordering = ['-last_active']
        unique_together = [['case', 'user']]  # One workspace per user per case
        indexes = [
            models.Index(fields=['case', 'user']),
            models.Index(fields=['is_shared']),
        ]
    
    def __str__(self):
        return f"{self.user.email}'s workspace on {self.case.case_number}"


# ============================================================================
# OFFICIAL CASE EVIDENCE (Read-only for official cases)
# ============================================================================

class OfficialEvidence(models.Model):
    """
    Official evidence from FOIA - part of the master case
    Read-only for official cases, editable for user-created community cases
    """
    
    EVIDENCE_TYPES = [
        ('photo', 'Photograph'),
        ('video', 'Video'),
        ('audio', 'Audio Recording'),
        ('document', 'Document'),
        ('physical', 'Physical Evidence'),
        ('forensic', 'Forensic Report'),
        ('witness_statement', 'Witness Statement'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='official_evidence')
    
    # Evidence details
    evidence_number = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=255)
    evidence_type = models.CharField(max_length=50, choices=EVIDENCE_TYPES)
    description = models.TextField()
    
    # File storage
    file = models.FileField(upload_to='evidence/official/%Y/%m/', null=True, blank=True)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to='evidence/thumbnails/', null=True, blank=True)
    
    # Metadata
    collected_date = models.DateField(null=True, blank=True)
    collected_by = models.CharField(max_length=255, blank=True)
    collected_location = models.CharField(max_length=255, blank=True)
    
    # EXIF/GPS metadata
    metadata_exif = models.JSONField(default=dict, blank=True)
    metadata_gps = models.JSONField(default=dict, blank=True)
    
    # Transcription for audio/video
    transcription = models.TextField(blank=True)
    
    # Tags
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Who uploaded (staff for official, user for community)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_official_evidence'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_official_evidence'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', 'evidence_type']),
        ]
    
    def __str__(self):
        return f"{self.evidence_number} - {self.title}"


# ============================================================================
# USER WORKSPACE EVIDENCE (User's own uploads)
# ============================================================================

class WorkspaceEvidence(models.Model):
    """
    Evidence uploaded by user in their workspace
    Private to the workspace (unless workspace is shared)
    """
    
    EVIDENCE_TYPES = [
        ('photo', 'Photograph'),
        ('video', 'Video'),
        ('audio', 'Audio Recording'),
        ('document', 'Document'),
        ('screenshot', 'Screenshot'),
        ('research', 'Research/Analysis'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        UserWorkspace,
        on_delete=models.CASCADE,
        related_name='my_evidence'
    )
    
    # Evidence details
    title = models.CharField(max_length=255)
    evidence_type = models.CharField(max_length=50, choices=EVIDENCE_TYPES)
    description = models.TextField()
    
    # File
    file = models.FileField(upload_to='evidence/user/%Y/%m/', null=True, blank=True)
    thumbnail = models.ImageField(upload_to='evidence/user/thumbnails/', null=True, blank=True)
    
    # User's analysis
    my_analysis = models.TextField(blank=True)
    significance = models.TextField(blank=True, help_text="Why is this evidence important?")
    
    # Metadata
    source = models.CharField(max_length=255, blank=True, help_text="Where did this come from?")
    date_obtained = models.DateField(null=True, blank=True)
    
    # Tags
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_workspace_evidence'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.workspace.user.email}: {self.title}"


# ============================================================================
# WORKSPACE SUSPECTS (User's suspect theories)
# ============================================================================

class WorkspaceSuspect(models.Model):
    """
    Suspect tracked in user's workspace
    User's own theories about persons of interest
    """
    
    STATUS_CHOICES = [
        ('person_of_interest', 'Person of Interest'),
        ('suspect', 'Suspect'),
        ('cleared', 'Cleared'),
        ('charged', 'Charged'),
        ('convicted', 'Convicted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        UserWorkspace,
        on_delete=models.CASCADE,
        related_name='my_suspects'
    )
    
    # Personal information
    name = models.CharField(max_length=255)
    aliases = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    age = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    
    # Photo
    photo = models.ImageField(upload_to='suspects/', null=True, blank=True)
    
    # Status & priority
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='person_of_interest')
    my_confidence = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="How confident are you this person is involved?"
    )
    
    # Details
    relationship_to_victim = models.CharField(max_length=255, blank=True)
    last_known_location = models.CharField(max_length=255, blank=True)
    
    # User's theory
    my_theory = models.TextField(blank=True, help_text="Why do you think they're involved?")
    motive = models.TextField(blank=True)
    alibi = models.TextField(blank=True)
    
    # Evidence links
    supporting_evidence = models.ManyToManyField(
        WorkspaceEvidence,
        blank=True,
        related_name='related_suspects'
    )
    
    # Tags
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_workspace_suspects'
        ordering = ['-my_confidence', 'name']
    
    def __str__(self):
        return f"{self.workspace.user.email}'s suspect: {self.name}"


# ============================================================================
# WORKSPACE TIMELINE (User's timeline additions)
# ============================================================================

class WorkspaceTimelineEvent(models.Model):
    """
    Timeline events added by user in their workspace
    Can reference official evidence or their own
    """
    
    EVENT_TYPES = [
        ('incident', 'Incident Occurred'),
        ('victim_activity', 'Victim Activity'),
        ('suspect_activity', 'Suspect Activity'),
        ('witness_account', 'Witness Account'),
        ('evidence_found', 'Evidence Found'),
        ('theory', 'My Theory/Hypothesis'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        UserWorkspace,
        on_delete=models.CASCADE,
        related_name='my_timeline'
    )
    
    # Event details
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    
    # Timing
    event_date = models.DateField(db_index=True)
    event_time = models.TimeField(null=True, blank=True)
    is_approximate = models.BooleanField(default=False)
    
    # User's confidence
    my_confidence = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    
    # Source/reasoning
    source = models.CharField(max_length=255, blank=True)
    my_reasoning = models.TextField(blank=True, help_text="Why do you believe this happened?")
    
    # Links
    related_suspects = models.ManyToManyField(
        WorkspaceSuspect,
        blank=True,
        related_name='timeline_events'
    )
    
    related_evidence = models.ManyToManyField(
        WorkspaceEvidence,
        blank=True,
        related_name='timeline_events'
    )
    
    # Tags
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    is_key_event = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_workspace_timeline'
        ordering = ['event_date', 'event_time']
    
    def __str__(self):
        return f"{self.event_date}: {self.title}"


# ============================================================================
# WORKSPACE NOTES
# ============================================================================

class WorkspaceNote(models.Model):
    """
    User's investigation notes
    Private unless workspace is shared
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        UserWorkspace,
        on_delete=models.CASCADE,
        related_name='my_notes'
    )
    
    # Note content
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    
    # Metadata
    is_important = models.BooleanField(default=False)
    tags = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_workspace_notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note: {self.title or 'Untitled'}"


# ============================================================================
# TIP MODEL (for master case)
# ============================================================================

class Tip(models.Model):
    """
    Tips submitted to the master case
    Public can submit tips to any case
    """
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewing', 'Under Review'),
        ('investigating', 'Being Investigated'),
        ('verified', 'Verified'),
        ('dismissed', 'Dismissed'),
        ('forwarded', 'Forwarded to Law Enforcement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tips')
    
    # Tip content
    subject = models.CharField(max_length=255)
    content = models.TextField()
    
    # Submitter (optional)
    submitter_name = models.CharField(max_length=255, blank=True)
    submitter_email = models.EmailField(blank=True)
    submitter_phone = models.CharField(max_length=20, blank=True)
    is_anonymous = models.BooleanField(default=True)
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_tips'
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    
    # Follow-up
    follow_up_notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_case_tips'
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'caseboard_case_tips'
        ordering = ['-priority', '-submitted_at']
    
    def __str__(self):
        return f"Tip: {self.subject}"