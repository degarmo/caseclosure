# admin.py - Django Admin Configuration for Case Tracking System

from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib import messages
from django.http import HttpResponse
from datetime import datetime, timedelta
import csv
import json

# Import your models
from .models import (
    TrackingEvent, 
    UserSession, 
    SuspiciousActivity
)

# Import optional models with error handling
try:
    from .models import DeviceFingerprint
    HAS_DEVICE_FINGERPRINT = True
except ImportError:
    HAS_DEVICE_FINGERPRINT = False

try:
    from .models import Alert
    HAS_ALERT = True
except ImportError:
    HAS_ALERT = False

try:
    from .models import MLModel
    HAS_ML_MODEL = True
except ImportError:
    HAS_ML_MODEL = False


# ============================================
# CUSTOM FILTERS
# ============================================

class SeverityLevelFilter(SimpleListFilter):
    """Filter for suspicious activity severity levels"""
    title = 'Severity Level'
    parameter_name = 'severity'
    
    def lookups(self, request, model_admin):
        return (
            ('low', 'Low (1-2)'),
            ('medium', 'Medium (3)'),
            ('high', 'High (4)'),
            ('critical', 'Critical (5)'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'low':
            return queryset.filter(severity_level__lte=2)
        elif self.value() == 'medium':
            return queryset.filter(severity_level=3)
        elif self.value() == 'high':
            return queryset.filter(severity_level=4)
        elif self.value() == 'critical':
            return queryset.filter(severity_level=5)


class TimeRangeFilter(SimpleListFilter):
    """Filter for time-based queries"""
    title = 'Time Range'
    parameter_name = 'timerange'
    
    def lookups(self, request, model_admin):
        return (
            ('1h', 'Last Hour'),
            ('24h', 'Last 24 Hours'),
            ('7d', 'Last 7 Days'),
            ('30d', 'Last 30 Days'),
        )
    
    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == '1h':
            return queryset.filter(timestamp__gte=now - timedelta(hours=1))
        elif self.value() == '24h':
            return queryset.filter(timestamp__gte=now - timedelta(hours=24))
        elif self.value() == '7d':
            return queryset.filter(timestamp__gte=now - timedelta(days=7))
        elif self.value() == '30d':
            return queryset.filter(timestamp__gte=now - timedelta(days=30))



# ============================================
# SUSPICIOUS ACTIVITY ADMIN
# ============================================

@admin.register(SuspiciousActivity)
class SuspiciousActivityAdmin(admin.ModelAdmin):
    """Admin interface for reviewing suspicious activities"""
    
    list_display = [
        'id',
        'case',
        'activity_type',
        'severity_level',
        'ip_address',
        'created_at'
    ]
    
    list_filter = [
        SeverityLevelFilter,
        'activity_type',
        'reviewed',
        'false_positive',
        'case',
        'created_at'
    ]
    
    search_fields = [
        'fingerprint_hash',
        'ip_address',
        'case__victim_name'
    ]
    
    readonly_fields = [
        'id',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Activity Information', {
            'fields': (
                'case',
                'activity_type',
                'severity_level',
                'confidence_score',
                'fingerprint_hash',
                'ip_address'
            )
        }),
        ('Analysis', {
            'fields': (
                'details',
                'evidence',
                'ml_features',
                'ml_prediction',
                'anomaly_score'
            ),
            'classes': ('collapse',)
        }),
        ('Review Status', {
            'fields': (
                'reviewed',
                'reviewed_by',
                'reviewed_at',
                'action_taken',
                'false_positive',
                'whitelisted'
            )
        }),
        ('Metadata', {
            'fields': (
                'id',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    actions = ['mark_reviewed', 'mark_false_positive']
    
    def mark_reviewed(self, request, queryset):
        """Mark activities as reviewed"""
        updated = queryset.update(
            reviewed=True,
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        messages.success(request, f"{updated} activities marked as reviewed")
    mark_reviewed.short_description = "Mark as reviewed"
    
    def mark_false_positive(self, request, queryset):
        """Mark as false positive"""
        updated = queryset.update(
            false_positive=True,
            reviewed=True,
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        messages.info(request, f"{updated} marked as false positive")
    mark_false_positive.short_description = "Mark as false positive"


# ============================================
# TRACKING EVENT ADMIN
# ============================================

@admin.register(TrackingEvent)
class TrackingEventAdmin(admin.ModelAdmin):
    """Admin interface for tracking events"""
    
    list_display = [
        'timestamp',
        'case',
        'event_type',
        'ip_address',
        'page_url',
        'is_suspicious'
    ]
    
    list_filter = [
        'event_type',
        'is_suspicious',
        'case',
        'timestamp'
    ]
    
    search_fields = [
        'fingerprint_hash',
        'ip_address',
        'page_url',
        'case__victim_name'
    ]
    
    readonly_fields = [
        'id',
        'timestamp'
    ]
    
    date_hierarchy = 'timestamp'
    list_per_page = 50


# ============================================
# USER SESSION ADMIN
# ============================================

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin interface for user sessions"""
    
    list_display = [
        'session_id',
        'case',
        'ip_address',
        'created_at',
        'last_activity',
        'is_suspicious'
    ]
    
    list_filter = [
        'is_suspicious',
        'case',
        'created_at'
    ]
    
    search_fields = [
        'session_id',
        'fingerprint_hash',
        'ip_address'
    ]
    
    readonly_fields = [
        'id',
        'session_id',
        'created_at',
        'last_activity'
    ]
    
    date_hierarchy = 'created_at'


# ============================================
# OPTIONAL MODEL REGISTRATIONS
# ============================================

if HAS_DEVICE_FINGERPRINT:
    @admin.register(DeviceFingerprint)
    class DeviceFingerprintAdmin(admin.ModelAdmin):
        list_display = [
            'fingerprint_hash',
            'device_type',
            'browser',
            'os',
            'first_seen',
            'last_seen'
        ]
        
        search_fields = ['fingerprint_hash']
        
        readonly_fields = [
            'fingerprint_hash',
            'first_seen',
            'last_seen'
        ]
        
        list_filter = [
            'device_type',
            'browser',
            'os'
        ]


if HAS_ALERT:
    @admin.register(Alert)
    class AlertAdmin(admin.ModelAdmin):
        list_display = [
            'title',
            'case',
            'alert_type',
            'priority',
            'acknowledged',
            'resolved',
            'created_at'
        ]
        
        list_filter = [
            'priority',
            'alert_type',
            'acknowledged',
            'resolved',
            'case'
        ]
        
        search_fields = [
            'title',
            'message',
            'case__victim_name'
        ]
        
        readonly_fields = [
            'id',
            'created_at',
            'updated_at'
        ]
        
        actions = ['acknowledge_alerts', 'resolve_alerts']
        
        def acknowledge_alerts(self, request, queryset):
            """Acknowledge selected alerts"""
            updated = queryset.filter(acknowledged=False).update(
                acknowledged=True,
                acknowledged_by=request.user,
                acknowledged_at=timezone.now()
            )
            messages.success(request, f"{updated} alerts acknowledged")
        acknowledge_alerts.short_description = "Acknowledge selected"
        
        def resolve_alerts(self, request, queryset):
            """Resolve selected alerts"""
            updated = queryset.filter(resolved=False).update(
                resolved=True,
                resolved_by=request.user,
                resolved_at=timezone.now()
            )
            messages.success(request, f"{updated} alerts resolved")
        resolve_alerts.short_description = "Resolve selected"


if HAS_ML_MODEL:
    @admin.register(MLModel)
    class MLModelAdmin(admin.ModelAdmin):
        list_display = [
            'name',
            'version',
            'model_type',
            'is_active',
            'created_at'
        ]
        
        list_filter = [
            'model_type',
            'is_active'
        ]
        
        readonly_fields = [
            'id',
            'created_at',
            'updated_at'
        ]


# ============================================
# ADMIN SITE CUSTOMIZATION
# ============================================

admin.site.site_header = "Case Tracking System Administration"
admin.site.site_title = "Case Tracking Admin"
admin.site.index_title = "Welcome to Case Tracking Administration"

# ============================================================================
# ML TRAINING LABELS
# ============================================================================

from .models import MLTrainingLabel


def _make_label_action(label_value, label_display):
    """Factory that creates an admin action for a given label."""
    def action(modeladmin, request, queryset):
        from django.contrib import messages
        updated = 0
        for event in queryset:
            MLTrainingLabel.objects.update_or_create(
                fingerprint_hash=event.fingerprint_hash,
                case=event.case,
                defaults={
                    'label': label_value,
                    'labeled_by': request.user,
                    'notes': f'Labeled via admin action on TrackingEvent {event.id}',
                },
            )
            updated += 1
        messages.success(
            request, f'Labeled {updated} fingerprint(s) as "{label_display}".'
        )
    action.short_description = f'🏷 Label as: {label_display}'
    action.__name__ = f'label_as_{label_value}'
    return action


label_as_suspect   = _make_label_action('suspect',   'Confirmed Suspect')
label_as_high_risk = _make_label_action('high_risk', 'High Risk')
label_as_innocent  = _make_label_action('innocent',  'Cleared / Innocent')


@admin.register(MLTrainingLabel)
class MLTrainingLabelAdmin(admin.ModelAdmin):
    list_display  = ['fingerprint_short', 'label', 'case', 'labeled_by', 'labeled_at', 'notes_short']
    list_filter   = ['label', 'labeled_at']
    search_fields = ['fingerprint_hash', 'notes']
    readonly_fields = ['labeled_at', 'cached_features']
    ordering      = ['-labeled_at']

    def fingerprint_short(self, obj):
        return obj.fingerprint_hash[:20] + '…'
    fingerprint_short.short_description = 'Fingerprint'

    def notes_short(self, obj):
        return obj.notes[:60] + '…' if len(obj.notes) > 60 else obj.notes
    notes_short.short_description = 'Notes'

# Attach label actions to TrackingEventAdmin after all functions are defined
TrackingEventAdmin.label_as_suspect   = label_as_suspect
TrackingEventAdmin.label_as_high_risk = label_as_high_risk
TrackingEventAdmin.label_as_innocent  = label_as_innocent
TrackingEventAdmin.actions = ['label_as_suspect', 'label_as_high_risk', 'label_as_innocent']
