from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
import string

User = get_user_model()

class AccountRequest(models.Model):
    """Initial request for account - pending approval"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Account Created'),
    ]
    
    # Basic info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    
    # Verification
    description = models.TextField(help_text="Why do you need an account? Relationship to victim?")
    supporting_links = models.TextField(blank=True, help_text="News articles, obituaries, etc.")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_requests')
    rejection_reason = models.TextField(blank=True)
    
    # Verification code for SMS
    verification_code = models.CharField(max_length=6, blank=True)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    verification_attempts = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def generate_verification_code(self):
        """Generate 6-digit verification code"""
        self.verification_code = ''.join(random.choices(string.digits, k=6))
        self.verification_sent_at = timezone.now()
        self.save()
        return self.verification_code
    
    def is_code_valid(self):
        """Check if verification code is still valid (10 minutes)"""
        if not self.verification_sent_at:
            return False
        from datetime import timedelta
        return timezone.now() - self.verification_sent_at < timedelta(minutes=10)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.status}"


class UserProfile(models.Model):
    """Enhanced user profile with verification and permissions"""
    
    # Account Types - Controls what they can see/do
    ACCOUNT_TYPES = [
        ('basic', 'Basic Account'),           # Can only see their own case
        ('verified', 'Verified Family'),      # Verified family member
        ('detective', 'Law Enforcement'),     # Can see multiple cases
        ('advocate', 'Victim Advocate'),      # Support organization
        ('admin', 'Administrator'),           # Full access
    ]
    
    # YOUR EXISTING FIELDS
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    organization = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=100, blank=True, help_text="Relationship to case (e.g. Family, Detective, Advocate)")
    bio = models.TextField(blank=True, help_text="Your story, connection, or reason for joining")
    location = models.CharField(max_length=255, blank=True)
    preferred_contact = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ("email", "Email"),
            ("phone", "Phone"),
            ("both", "Both"),
        ],
        default="email"
    )
    notifications_tips = models.BooleanField(default=True)
    notifications_updates = models.BooleanField(default=True)
    timezone = models.CharField(max_length=50, blank=True)
    language = models.CharField(max_length=30, blank=True)
    other_language = models.CharField(max_length=50, blank=True, help_text="Specify if language is 'Other'")
    verified = models.BooleanField(default=False)
    
    # NEW FIELDS FOR ACCESS CONTROL
    account_type = models.CharField(
        max_length=20, 
        choices=ACCOUNT_TYPES, 
        default='basic',
        help_text="Determines access level and permissions"
    )
    
    # Phone verification
    phone_verified = models.BooleanField(default=False)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Case permissions
    can_create_cases = models.BooleanField(default=False)
    max_cases = models.IntegerField(default=1, help_text="Maximum number of cases user can create")
    current_cases = models.IntegerField(default=0, help_text="Current number of active cases")
    
    # Identity verification
    identity_verified = models.BooleanField(default=False)
    identity_verified_at = models.DateTimeField(null=True, blank=True)
    identity_verified_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='verified_profiles'
    )
    verification_documents = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Stored verification documents/links"
    )
    
    # Link to account request
    account_request = models.ForeignKey(
        AccountRequest, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        help_text="Original account request"
    )
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Suspicious activity flag (for bad actors)
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    flagged_at = models.DateTimeField(null=True, blank=True)
    flagged_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='flagged_profiles'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username} ({self.account_type})"
    
    def can_access_case(self, case):
        """Check if user can access a specific case"""
        # Admins can access everything
        if self.account_type == 'admin' or self.user.is_staff:
            return True
        
        # Basic users can only access their own cases
        if self.account_type == 'basic':
            return case.user == self.user
        
        # Detectives can access cases they're assigned to
        if self.account_type == 'detective':
            # You could add a ManyToMany field for assigned cases
            return case.detective_email == self.user.email
        
        # Verified family can access their case
        if self.account_type == 'verified':
            return case.user == self.user
        
        return False
    
    def can_create_new_case(self):
        """Check if user can create another case"""
        if not self.can_create_cases:
            return False
        
        if self.current_cases >= self.max_cases:
            return False
        
        # Must be phone verified
        if not self.phone_verified:
            return False
        
        return True
    
    def increment_case_count(self):
        """Called when user creates a new case"""
        self.current_cases += 1
        self.save()
    
    def decrement_case_count(self):
        """Called when user's case is deleted"""
        if self.current_cases > 0:
            self.current_cases -= 1
            self.save()
    
    @property
    def display_name(self):
        """Get display name for user"""
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.user.username
    
    @property
    def is_high_access(self):
        """Check if user has elevated access"""
        return self.account_type in ['detective', 'advocate', 'admin']
    
    @property
    def needs_verification(self):
        """Check if user needs additional verification"""
        return not self.phone_verified or not self.identity_verified