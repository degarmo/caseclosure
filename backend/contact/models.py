from django.db import models
from django.utils import timezone
from cases.models import Case


class ContactInquiry(models.Model):
    """Contact inquiries from the main site"""
    
    INQUIRY_TYPES = [
        ('general', 'General Inquiry'),
        ('support', 'Technical Support'),
        ('case_submission', 'New Case Submission'),
        ('press', 'Media/Press'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('responded', 'Responded'),
        ('archived', 'Archived'),
    ]
    
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    inquiry_type = models.CharField(max_length=50, choices=INQUIRY_TYPES)
    subject = models.CharField(max_length=500)
    message = models.TextField()
    case_reference = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    submitted_at = models.DateTimeField(default=timezone.now)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contact_inquiries'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['inquiry_type']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.inquiry_type} - {self.name} ({self.submitted_at})"


class Tip(models.Model):
    """Tips submitted from victim memorial sites"""
    
    URGENCY_LEVELS = [
        ('low', 'Low - General information'),
        ('medium', 'Medium - Relevant details'),
        ('high', 'High - Important information'),
        ('urgent', 'Urgent - Critical information'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('responded', 'Responded'),
        ('archived', 'Archived'),
    ]
    
    id = models.CharField(max_length=255, primary_key=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='tips')
    submitter_name = models.CharField(max_length=255, blank=True, null=True)
    submitter_email = models.EmailField(blank=True, null=True)
    submitter_phone = models.CharField(max_length=50, blank=True, null=True)
    tip_content = models.TextField()
    is_anonymous = models.BooleanField(default=True)
    urgency = models.CharField(max_length=50, choices=URGENCY_LEVELS)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    submitted_at = models.DateTimeField(default=timezone.now)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tips'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['case']),
            models.Index(fields=['status']),
            models.Index(fields=['urgency']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"Tip for {self.case} - {self.urgency} ({self.submitted_at})"