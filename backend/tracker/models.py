import uuid
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import json

# Import the Case model from your main app
from cases.models import Case


# ============================================================================
# TRACKING MODELS
# ============================================================================

class DeviceFingerprint(models.Model):
    """Model for storing device fingerprints"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fingerprint_hash = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Browser details
    user_agent = models.TextField()
    browser = models.CharField(max_length=50)
    browser_version = models.CharField(max_length=20)
    
    # OS details
    os = models.CharField(max_length=50)
    os_version = models.CharField(max_length=20)
    platform = models.CharField(max_length=50)
    
    # Hardware
    device_type = models.CharField(max_length=20)
    device_memory = models.IntegerField(null=True, blank=True)
    hardware_concurrency = models.IntegerField(null=True, blank=True)
    
    # Screen
    screen_resolution = models.CharField(max_length=20)
    color_depth = models.IntegerField()
    
    # Browser features
    languages = ArrayField(models.CharField(max_length=10), blank=True, default=list)
    timezone = models.CharField(max_length=50)
    timezone_offset = models.IntegerField()
    
    # Canvas/WebGL fingerprints
    canvas_fingerprint = models.TextField()
    webgl_fingerprint = models.TextField(blank=True)
    audio_fingerprint = models.TextField(blank=True)
    
    # Fonts
    fonts = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    
    # Browser capabilities
    plugins = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    mime_types = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Touch/Input
    touch_support = models.BooleanField(default=False)
    max_touch_points = models.IntegerField(default=0)
    
    # Additional features
    cookies_enabled = models.BooleanField(default=True)
    local_storage = models.BooleanField(default=True)
    session_storage = models.BooleanField(default=True)
    indexed_db = models.BooleanField(default=True)
    
    # Risk assessment
    trust_score = models.FloatField(default=0.5)
    is_suspicious = models.BooleanField(default=False)
    is_bot = models.BooleanField(default=False)
    
    # Associated data
    known_ips = ArrayField(models.GenericIPAddressField(), blank=True, default=list)
    associated_cases = models.ManyToManyField(Case, blank=True)
    
    # Timestamps
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    total_sessions = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'device_fingerprints'
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['fingerprint_hash']),
            models.Index(fields=['is_suspicious', 'last_seen']),
        ]
    
    def __str__(self):
        return f"{self.fingerprint_hash[:8]} - {self.browser} on {self.os}"


class UserSession(models.Model):
    """Model for user sessions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tracker_sessions', null=True, blank=True)  # Made nullable
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Identification
    fingerprint_hash = models.CharField(max_length=255, db_index=True)
    fingerprint_confidence = models.FloatField(default=0.0)
    
    # Network information
    ip_address = models.GenericIPAddressField()
    ip_country = models.CharField(max_length=2, blank=True)
    ip_city = models.CharField(max_length=100, blank=True)
    is_vpn = models.BooleanField(default=False)
    
    # Device information
    user_agent = models.TextField()
    browser = models.CharField(max_length=50, blank=True)
    os = models.CharField(max_length=50, blank=True)
    device_type = models.CharField(max_length=20, blank=True)
    
    # Browser fingerprint components
    canvas_fingerprint = models.CharField(max_length=255, blank=True)
    webgl_fingerprint = models.CharField(max_length=255, blank=True)
    audio_fingerprint = models.CharField(max_length=255, blank=True)
    fonts_fingerprint = models.CharField(max_length=255, blank=True)
    
    # Browser capabilities
    cookies_enabled = models.BooleanField(default=True)
    javascript_enabled = models.BooleanField(default=True)
    do_not_track = models.BooleanField(default=False)
    ad_blocker = models.BooleanField(default=False)
    
    # Time information
    timezone = models.CharField(max_length=50, blank=True)
    timezone_offset = models.IntegerField(null=True, blank=True)  # minutes from UTC
    local_time = models.DateTimeField(null=True, blank=True)
    is_unusual_hour = models.BooleanField(default=False)
    
    # Session metrics
    page_views = models.IntegerField(default=0)
    total_duration = models.IntegerField(default=0)  # seconds
    bounce = models.BooleanField(default=False)
    entry_page = models.CharField(max_length=255, blank=True)
    exit_page = models.CharField(max_length=255, blank=True)
    
    # Behavioral metrics
    avg_time_per_page = models.FloatField(default=0.0)
    actions_count = models.IntegerField(default=0)
    forms_submitted = models.IntegerField(default=0)
    copy_events = models.IntegerField(default=0)
    rapid_clicks = models.IntegerField(default=0)
    
    # Suspicious activity
    suspicious_score = models.FloatField(default=0.0)
    is_suspicious = models.BooleanField(default=False, db_index=True)
    risk_level = models.CharField(max_length=20, blank=True)  # LOW, MEDIUM, HIGH, CRITICAL
    
    # ML Analysis fields
    ml_analysis_results = models.JSONField(default=dict, blank=True)
    risk_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['fingerprint_hash', 'created_at']),
            models.Index(fields=['case', 'created_at']),
            models.Index(fields=['is_suspicious', 'created_at']),
        ]
    
    def __str__(self):
        return f"Session {self.session_id[:8]} - {self.created_at}"


class TrackingEvent(models.Model):
    """Model for all tracking events"""
    
    EVENT_TYPES = [
        # Page events
        ('page_view', 'Page View'),
        ('page_exit', 'Page Exit'),
        
        # Navigation events
        ('navigation', 'Navigation'),
        ('scroll', 'Scroll'),
        ('visibility_change', 'Visibility Change'),
        
        # Interaction events
        ('click', 'Click'),
        ('form_submit', 'Form Submit'),
        ('form_field_focus', 'Form Field Focus'),
        
        # Content interactions
        ('post_view', 'Post View'),
        ('post_create', 'Post Create'),
        ('comment', 'Comment'),
        ('like', 'Like'),
        ('share', 'Share'),
        ('copy', 'Copy'),
        ('download', 'Download'),
        
        # Media interactions
        ('media_view', 'Media View'),
        ('video_play', 'Video Play'),
        ('video_pause', 'Video Pause'),
        ('gallery_open', 'Gallery Open'),
        
        # Tip/Contact events
        ('tip_submit', 'Tip Submit'),
        ('contact_submit', 'Contact Submit'),
        ('tip_view', 'Tip View'),
        
        # Donation events
        ('donation_click', 'Donation Click'),
        ('donation_complete', 'Donation Complete'),
        ('donation_cancel', 'Donation Cancel'),
        
        # Authentication events
        ('login_attempt', 'Login Attempt'),
        ('login_success', 'Login Success'),
        ('login_fail', 'Login Fail'),
        ('logout', 'Logout'),
        
        # Suspicious events
        ('rapid_navigation', 'Rapid Navigation'),
        ('vpn_detected', 'VPN Detected'),
        ('suspicious_pattern', 'Suspicious Pattern'),
        ('anomaly_detected', 'Anomaly Detected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tracking_events', null=True, blank=True)  # Made nullable
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Session/User identification
    session_identifier = models.CharField(max_length=255, db_index=True)
    fingerprint_hash = models.CharField(max_length=255, db_index=True)
    
    # Event information
    event_type = models.CharField(max_length=100, choices=EVENT_TYPES, db_index=True)
    event_data = models.JSONField(default=dict, blank=True)
    
    # Page information
    page_url = models.TextField()
    page_title = models.CharField(max_length=255, blank=True)
    referrer_url = models.TextField(blank=True)
    
    # Network information
    ip_address = models.GenericIPAddressField(db_index=True)
    ip_country = models.CharField(max_length=2, blank=True)
    ip_region = models.CharField(max_length=100, blank=True)
    ip_city = models.CharField(max_length=100, blank=True)
    ip_latitude = models.FloatField(null=True, blank=True)
    ip_longitude = models.FloatField(null=True, blank=True)
    is_vpn = models.BooleanField(default=False)
    is_proxy = models.BooleanField(default=False)
    is_tor = models.BooleanField(default=False)
    isp = models.CharField(max_length=255, blank=True)
    
    # Device information
    user_agent = models.TextField()
    browser = models.CharField(max_length=50, blank=True)
    browser_version = models.CharField(max_length=20, blank=True)
    os = models.CharField(max_length=50, blank=True)
    os_version = models.CharField(max_length=20, blank=True)
    device_type = models.CharField(max_length=20, blank=True)  # desktop, mobile, tablet
    device_brand = models.CharField(max_length=50, blank=True)
    device_model = models.CharField(max_length=50, blank=True)
    
    # Screen/Browser properties
    screen_width = models.IntegerField(null=True, blank=True)
    screen_height = models.IntegerField(null=True, blank=True)
    viewport_width = models.IntegerField(null=True, blank=True)
    viewport_height = models.IntegerField(null=True, blank=True)
    color_depth = models.IntegerField(null=True, blank=True)
    
    # Time information
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    timezone = models.CharField(max_length=50, blank=True)
    local_timestamp = models.DateTimeField(null=True, blank=True)
    is_unusual_hour = models.BooleanField(default=False)
    
    # Page interaction metrics
    time_on_page = models.IntegerField(null=True, blank=True)  # seconds
    scroll_depth = models.FloatField(null=True, blank=True)  # percentage
    clicks_count = models.IntegerField(default=0)
    
    # Suspicious activity scoring
    suspicious_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    flags = models.JSONField(default=dict, blank=True)
    is_suspicious = models.BooleanField(default=False, db_index=True)
    
    # Processing status
    processed = models.BooleanField(default=False)
    ml_analyzed = models.BooleanField(default=False)
    alerted = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'tracking_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['case', 'timestamp']),
            models.Index(fields=['fingerprint_hash', 'timestamp']),
            models.Index(fields=['session_identifier', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['is_suspicious', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
    
    def __str__(self):
        case_name = self.case.victim_name if self.case else "No Case"
        return f"{self.event_type} - {case_name} - {self.timestamp}"


class SuspiciousActivity(models.Model):
    """Model for tracking suspicious activities"""
    
    ACTIVITY_TYPES = [
        # Access patterns
        ('rapid_visits', 'Rapid Visits'),
        ('unusual_hour', 'Unusual Hour Access'),
        ('excessive_page_views', 'Excessive Page Views'),
        
        # Network anomalies
        ('vpn_usage', 'VPN/Proxy Usage'),
        ('tor_usage', 'Tor Usage'),
        ('ip_change', 'IP Address Change'),
        ('geo_jump', 'Geographic Jump'),
        
        # Device anomalies
        ('device_change', 'Device Change'),
        ('fingerprint_mismatch', 'Fingerprint Mismatch'),
        ('multiple_devices', 'Multiple Devices'),
        
        # Behavioral anomalies
        ('rapid_navigation', 'Rapid Navigation'),
        ('no_interaction', 'No Interaction'),
        ('excessive_copying', 'Excessive Copying'),
        ('data_scraping', 'Data Scraping'),
        ('form_flooding', 'Form Flooding'),
        
        # Security threats
        ('sql_injection', 'SQL Injection Attempt'),
        ('xss_attempt', 'XSS Attempt'),
        ('bot_behavior', 'Bot Behavior'),
        ('credential_stuffing', 'Credential Stuffing'),
        
        # Content-related
        ('fake_tip', 'Fake Tip Submission'),
        ('spam_content', 'Spam Content'),
        ('harassment', 'Harassment'),
        ('suspicious_pattern', 'Suspicious Pattern'),  # Added default
    ]
    
    SEVERITY_LEVELS = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
        (4, 'Critical'),
        (5, 'Emergency'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='suspicious_activities', null=True, blank=True)  # Made nullable
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspicious_activities')
    
    # Identification
    session_identifier = models.CharField(max_length=255, db_index=True)
    fingerprint_hash = models.CharField(max_length=255, db_index=True)
    ip_address = models.GenericIPAddressField()
    
    # Activity details
    activity_type = models.CharField(max_length=100, choices=ACTIVITY_TYPES, db_index=True)
    severity_level = models.IntegerField(choices=SEVERITY_LEVELS, db_index=True)
    confidence_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    
    # Detailed information
    details = models.JSONField(default=dict)
    evidence = models.JSONField(default=dict)
    
    # Related events
    related_events = models.ManyToManyField(TrackingEvent, blank=True)
    
    # ML/AI analysis
    ml_prediction = models.FloatField(null=True, blank=True)
    ml_features = models.JSONField(default=dict, blank=True)
    anomaly_score = models.FloatField(null=True, blank=True)
    
    # Response/Action taken
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_activities')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.TextField(blank=True)
    
    # Law enforcement
    flagged_for_law_enforcement = models.BooleanField(default=False)
    law_enforcement_notified = models.BooleanField(default=False)
    law_enforcement_reference = models.CharField(max_length=100, blank=True)
    
    # Status
    false_positive = models.BooleanField(default=False)
    whitelisted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suspicious_activities'
        ordering = ['-severity_level', '-created_at']
        indexes = [
            models.Index(fields=['case', 'severity_level', 'created_at']),
            models.Index(fields=['fingerprint_hash', 'created_at']),
            models.Index(fields=['activity_type', 'severity_level']),
            models.Index(fields=['flagged_for_law_enforcement', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_activity_type_display()} - Level {self.severity_level} - {self.created_at}"


class Alert(models.Model):
    """Model for system alerts"""
    
    ALERT_TYPES = [
        ('suspicious_user', 'Suspicious User Detected'),
        ('high_risk', 'High Risk Activity'),
        ('pattern_detected', 'Pattern Detected'),
        ('threshold_exceeded', 'Threshold Exceeded'),
        ('law_enforcement', 'Law Enforcement Alert'),
        ('system', 'System Alert'),
        ('ml_detection', 'ML Detection'),
        ('daily_summary', 'Daily Summary'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tracker_alerts', null=True, blank=True)  # Made nullable
    
    # Alert details
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related data
    suspicious_activity = models.ForeignKey(SuspiciousActivity, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True)
    fingerprint_hash = models.CharField(max_length=255, blank=True)
    
    # Alert data
    data = models.JSONField(default=dict)
    recommended_actions = ArrayField(models.TextField(), blank=True, default=list)
    
    # Status
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    # Notifications
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    notification_sent = models.BooleanField(default=False)
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'alerts'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['case', 'priority', 'created_at']),
            models.Index(fields=['acknowledged', 'resolved']),
            models.Index(fields=['alert_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_priority_display()} - {self.title} - {self.created_at}"


class MLModel(models.Model):
    """Model for tracking ML model versions and performance"""
    
    MODEL_TYPES = [
        ('anomaly_detection', 'Anomaly Detection'),
        ('pattern_recognition', 'Pattern Recognition'),
        ('risk_scoring', 'Risk Scoring'),
        ('behavior_clustering', 'Behavior Clustering'),
        ('sequence_analysis', 'Sequence Analysis'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    version = models.CharField(max_length=20)
    
    # Model details
    description = models.TextField(blank=True)
    algorithm = models.CharField(max_length=100)
    parameters = models.JSONField(default=dict)
    features = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    
    # Performance metrics
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    auc_score = models.FloatField(null=True, blank=True)
    
    # Training details
    training_samples = models.IntegerField(null=True, blank=True)
    training_date = models.DateTimeField(null=True, blank=True)
    training_duration = models.IntegerField(null=True, blank=True)  # seconds
    
    # Model file
    model_file_path = models.CharField(max_length=255, blank=True)
    model_size = models.IntegerField(null=True, blank=True)  # bytes
    
    # Status
    is_active = models.BooleanField(default=False)
    deployed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ml_models'
        ordering = ['-created_at']
        unique_together = [['model_type', 'version']]
    
    def __str__(self):
        return f"{self.name} v{self.version} - {self.get_model_type_display()}"