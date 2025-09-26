from django.db import models
from django.conf import settings
from cases.models import Case
import uuid

class Tip(models.Model):
    """Tips submitted by the public"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tips')
    
    # Submitter info
    submitter_name = models.CharField(max_length=255, blank=True)
    submitter_email = models.EmailField(blank=True)
    submitter_phone = models.CharField(max_length=50, blank=True)
    is_anonymous = models.BooleanField(default=False)
    
    # Tip content
    subject = models.CharField(max_length=255)
    message = models.TextField()
    location = models.CharField(max_length=255, blank=True)
    date_of_incident = models.DateField(null=True, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('investigating', 'Investigating'),
        ('closed', 'Closed'),
        ('flagged', 'Flagged'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.IntegerField(default=0)  # 0=normal, 1=high, 2=urgent
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Notes (internal)
    internal_notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tips'
    )
    
    class Meta:
        db_table = 'tips'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', 'status']),
            models.Index(fields=['created_at']),
        ]