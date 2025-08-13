"""
Configuration Constants Module
Central configuration for all thresholds, weights, and constants
"""

# ============================================================================
# DETECTION THRESHOLDS
# ============================================================================

THRESHOLDS = {
    # Critical behavioral patterns
    'obsessive_visits_count': 20,          # visits in time window
    'obsessive_visits_time': 1800,         # 30 minutes
    'rapid_navigation_count': 25,          # page changes in time window
    'rapid_navigation_time': 60,           # 1 minute
    'victim_info_focus_ratio': 0.6,        # 60% time on victim-related pages
    'timeline_obsession_count': 15,        # timeline page visits
    
    # Authentication and access patterns
    'failed_login_attempts': 3,            # Lower threshold for criminal cases
    'failed_login_time': 300,              # 5 minutes
    'password_reset_attempts': 5,          # password reset attempts
    'account_creation_attempts': 3,        # multiple account attempts
    
    # Network and identity evasion
    'vpn_usage_ratio': 0.4,               # Lower threshold - 40%
    'ip_changes_count': 3,                # IP changes in session
    'tor_usage_tolerance': 0,             # Zero tolerance for Tor
    'proxy_chain_depth': 2,               # Multiple proxy layers
    'geo_jump_speed': 300,                # Lower threshold for impossible travel (mph)
    
    # Time and scheduling patterns
    'unusual_hour_ratio': 0.3,            # 30% access at unusual hours
    'night_stalking_ratio': 0.5,          # 50% access 11pm-4am
    'anniversary_monitoring': True,       # Access on case anniversaries
    'news_correlation_threshold': 0.8,    # Activity spikes with news
    
    # Device and fingerprint evasion
    'device_switches': 3,                 # Lower threshold
    'fingerprint_changes': 2,             # More sensitive
    'cookie_clearing_frequency': 0.7,     # 70% of sessions clear cookies
    'javascript_disabled_ratio': 0.5,     # Half sessions block JS
    
    # Content interaction patterns
    'victim_photo_downloads': 5,          # Downloaded victim photos
    'evidence_screenshot_count': 10,      # Screenshots of evidence
    'copy_events_count': 15,              # Copy events in session
    'print_events_count': 5,              # Print attempts
    'save_attempts_count': 8,             # Save/download attempts
    
    # Communication and contact patterns
    'tip_submission_failures': 5,         # Failed tip submissions
    'contact_form_probing': 3,            # Contact form testing
    'phone_number_harvesting': True,      # Collecting contact info
    'email_validation_attempts': 5,       # Testing email addresses
    
    # Reconnaissance patterns
    'url_manipulation_count': 10,         # URL parameter testing
    'hidden_page_access': 3,              # Access to non-linked pages
    'admin_page_probing': 1,              # Zero tolerance for admin probing
    'social_media_correlation': True,     # Cross-platform tracking
    
    # Behavioral anomalies specific to criminal cases
    'victim_name_searches': 5,            # Searching victim names
    'location_obsession_count': 10,       # Obsessive location checking
    'evidence_tampering_attempts': 1,     # Any evidence tampering
    'witness_info_focus': 0.4,            # 40% time on witness info
    'law_enforcement_monitoring': True,   # Monitoring police activity
    
    # Advanced evasion techniques
    'browser_automation_detection': True, # Headless browser detection
    'canvas_fingerprinting_evasion': True, # Canvas fingerprint spoofing
    'timezone_spoofing': True,            # Timezone inconsistencies
    'language_header_manipulation': True, # Accept-Language manipulation
    
    # Session and timing anomalies
    'micro_session_count': 15,            # Very short sessions
    'session_duration_suspicious': 8,     # Hours - unusually long
    'pause_and_resume_pattern': 5,        # Suspicious session patterns
    'activity_burst_detection': 10,       # Sudden activity bursts
    
    # Extended detection thresholds for nervous behavior
    'nervous_typing_backspace_ratio': 0.3,
    'typing_rhythm_variance': 0.7,
    'panic_click_rate': 10,
    'mouse_direction_changes': 50,
    'panic_exit_velocity': 1000,
    'immediate_exit_threshold': 3,
    'scroll_stutter_threshold': 5,
    'field_hover_time': 5000,
    'excessive_tab_switching': 10,
    'suspicious_search_threshold': 3,
    'writing_stress_threshold': 0.2,
    
    # Media interaction thresholds
    'face_focus_duration': 30000,         # 30 seconds on faces
    'replay_count_threshold': 5,
    'pause_count_threshold': 10,
    
    # Cognitive and psychological thresholds
    'decision_paralysis_time': 10000,     # 10 seconds hovering
    'rapid_close_threshold': 2,
    'hover_repetition_threshold': 5,
    'systematic_access_threshold': 4,
    
    # Environmental thresholds
    'public_wifi_ratio': 0.8,
    'fresh_browser_indicators': 3,
    'work_hours_violation_ratio': 0.3,
    
    # Coordination thresholds
    'synchronized_visit_threshold': 3,
    'coordination_time_window': 300,      # 5 minutes
    
    # Escalation thresholds
    'escalation_probability_threshold': 0.7,
    'planning_indicators_threshold': 2,
    'risk_increase_threshold': 0.5,
}

# ============================================================================
# RISK WEIGHTS (10-point scale)
# ============================================================================

RISK_WEIGHTS = {
    # Critical indicators (8-10 points)
    'tor_usage': 10.0,
    'evidence_tampering': 10.0,
    'admin_probing': 9.0,
    'victim_obsession': 9.0,
    'stalking_patterns': 8.5,
    'witness_targeting': 8.0,
    
    # High-risk indicators (6-8 points)
    'geographic_evasion': 7.5,
    'identity_manipulation': 7.0,
    'timeline_obsession': 7.0,
    'contact_probing': 6.5,
    'advanced_evasion': 6.5,
    'news_correlation': 6.0,
    
    # Medium-risk indicators (4-6 points)
    'vpn_usage': 5.5,
    'device_switching': 5.0,
    'unusual_timing': 4.5,
    'content_harvesting': 4.5,
    'rapid_visits': 4.0,
    
    # Lower-risk indicators (2-4 points)
    'authentication_issues': 3.5,
    'proxy_usage': 3.0,
    'session_anomalies': 2.5,
    'behavioral_anomalies': 2.0,
    
    # Psychological indicators
    'nervous_behavior': 3.0,
    'cognitive_overload': 3.5,
    'guilty_conscience': 5.0,
    'escalation_pattern': 6.0,
}

# ============================================================================
# TIME WINDOWS AND INTERVALS
# ============================================================================

TIME_WINDOWS = {
    'recent_activity': 300,              # 5 minutes
    'session_timeout': 1800,             # 30 minutes
    'short_term_history': 3600,          # 1 hour
    'medium_term_history': 86400,        # 24 hours
    'long_term_history': 604800,         # 7 days
    'case_history': 2592000,             # 30 days
}

# ============================================================================
# SEVERITY LEVELS
# ============================================================================

SEVERITY_LEVELS = {
    1: 'minimal',
    2: 'low',
    3: 'medium',
    4: 'high',
    5: 'critical'
}

# ============================================================================
# ACTIVITY TYPES
# ============================================================================

ACTIVITY_TYPES = [
    'evidence_tampering',
    'dark_web_access',
    'victim_stalking',
    'witness_intimidation',
    'cyberstalking',
    'system_infiltration',
    'location_evasion',
    'identity_fraud',
    'case_monitoring',
    'technical_evasion',
    'suspicious_behavior',
    'reconnaissance',
    'data_harvesting',
    'communication_probing',
]

# ============================================================================
# PAGE CATEGORIES
# ============================================================================

PAGE_CATEGORIES = {
    'evidence': ['evidence', 'proof', 'document', 'file', 'record'],
    'victim': ['victim', 'missing', 'disappeared', 'person', 'individual'],
    'witness': ['witness', 'testimony', 'statement', 'account'],
    'timeline': ['timeline', 'chronology', 'sequence', 'events'],
    'location': ['location', 'place', 'address', 'map', 'coordinates'],
    'media': ['photo', 'image', 'video', 'media', 'gallery'],
    'contact': ['contact', 'tip', 'report', 'submit', 'form'],
    'news': ['news', 'update', 'press', 'release', 'announcement'],
    'admin': ['admin', 'login', 'dashboard', 'panel', 'backend'],
}

# ============================================================================
# SUSPICIOUS PATTERNS
# ============================================================================

SUSPICIOUS_SEARCH_TERMS = [
    # Disposal and evidence destruction
    'how to hide', 'dissolve', 'burn evidence', 'delete permanently', 
    'destroy DNA', 'remove traces', 'clean evidence',
    
    # Investigation knowledge
    'police procedure', 'DNA evidence', 'forensic', 'investigation process',
    'how long before', 'statute limitations', 'cold case',
    
    # Counter-forensics
    'IP trace', 'anonymous browsing', 'metadata removal', 'EXIF',
    'digital footprint', 'untraceable', 'proxy chain',
    
    # Victim information
    'last seen wearing', 'personal schedule', 'home alone', 
    'routine', 'habits', 'vulnerable', 'isolated',
    
    # Legal consequences
    'sentence for', 'prison time', 'death penalty', 
    'plea deal', 'immunity', 'prosecution', 'charges',
]

# ============================================================================
# HONEYTRAP CONFIGURATIONS
# ============================================================================

HONEYTRAP_PAGES = {
    '/admin': 10.0,
    '/evidence/unreleased/': 10.0,
    '/.git/': 8.0,
    '/wp-admin': 7.0,
    '/backup/': 6.0,
    '/private/': 8.0,
    '/internal/': 8.0,
    '/test/': 5.0,
    '/dev/': 5.0,
    '/stage/': 5.0,
    '/.env': 9.0,
    '/config/': 7.0,
    '/api/admin': 9.0,
    '/debug/': 6.0,
}

HONEYPOT_DOCUMENTS = [
    'evidence_unreleased.pdf',
    'witness_list_confidential.doc',
    'investigation_notes_private.txt',
    'suspect_database.xlsx',
    'case_files_backup.zip',
    'forensic_report_draft.pdf',
    'interview_transcripts.docx',
]

# ============================================================================
# NETWORK INDICATORS
# ============================================================================

KNOWN_VPN_PROVIDERS = [
    'NordVPN', 'ExpressVPN', 'CyberGhost', 'ProtonVPN',
    'Surfshark', 'IPVanish', 'Private Internet Access',
    'TunnelBear', 'Hotspot Shield', 'Windscribe',
]

TOR_EXIT_NODE_RANGES = [
    '198.96.0.0/16',
    '199.87.0.0/16',
    '23.129.0.0/16',
    '104.244.0.0/14',
    '109.70.100.0/24',
]

# ============================================================================
# BEHAVIORAL INDICATORS
# ============================================================================

BEHAVIORAL_PATTERNS = {
    'calculated_observer': {
        'movement_speed_max': 100,
        'hover_duration_min': 3000,
        'precision_min': 0.9,
        'risk_score': 6.0,
    },
    'impulsive_checker': {
        'movement_speed_min': 500,
        'click_count_min': 20,
        'trajectory_changes_min': 30,
        'risk_score': 5.0,
    },
    'stalker_pattern': {
        'face_trace_count_min': 3,
        'photo_hover_duration_min': 20000,
        'risk_score': 8.0,
    },
    'nervous_user': {
        'jitter_score_min': 0.7,
        'direction_changes_min': 50,
        'overshoot_count_min': 5,
        'risk_score': 3.0,
    },
}

# ============================================================================
# ALERT CONFIGURATIONS
# ============================================================================

ALERT_PRIORITIES = {
    'critical': {
        'color': '#FF0000',
        'icon': '🚨',
        'auto_escalate': True,
        'notification_channels': ['email', 'sms', 'dashboard', 'api'],
    },
    'high': {
        'color': '#FF6600',
        'icon': '⚠️',
        'auto_escalate': False,
        'notification_channels': ['email', 'dashboard'],
    },
    'medium': {
        'color': '#FFAA00',
        'icon': '📊',
        'auto_escalate': False,
        'notification_channels': ['dashboard'],
    },
    'low': {
        'color': '#FFFF00',
        'icon': '📋',
        'auto_escalate': False,
        'notification_channels': ['dashboard'],
    },
    'info': {
        'color': '#0099FF',
        'icon': 'ℹ️',
        'auto_escalate': False,
        'notification_channels': [],
    },
}

# ============================================================================
# CACHE CONFIGURATIONS
# ============================================================================

CACHE_SETTINGS = {
    'criminal_history_ttl': 600,         # 10 minutes
    'session_data_ttl': 1800,            # 30 minutes
    'alert_ttl': 604800,                 # 7 days
    'activity_record_ttl': 2592000,      # 30 days
    'fingerprint_ttl': 86400,            # 24 hours
}

# ============================================================================
# RATE LIMITS
# ============================================================================

RATE_LIMITS = {
    'max_requests_per_minute': 60,
    'max_failed_logins': 5,
    'max_password_resets': 3,
    'max_api_calls': 100,
    'cooldown_period': 300,              # 5 minutes
}

# ============================================================================
# GEOGRAPHIC CONSTANTS
# ============================================================================

GEOGRAPHIC_CONSTANTS = {
    'earth_radius_miles': 3959,
    'earth_radius_km': 6371,
    'impossible_speed_mph': 500,         # Commercial flight speed
    'suspicious_speed_mph': 300,         # Suspicious travel speed
    'normal_speed_mph': 70,              # Highway driving speed
}

# ============================================================================
# REGEX PATTERNS
# ============================================================================

REGEX_PATTERNS = {
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'phone': r'^\+?\d{10,15}$',
    'ip_address': r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$',
    'base64': r'^[A-Za-z0-9+/]+={0,2}$',
    'url': r'^https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)$',
}