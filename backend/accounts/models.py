# accounts/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
import random
import string

# ============ CUSTOM MANAGER ============
class CustomUserManager(BaseUserManager):
    """Custom manager for CustomUser"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


# ============ CUSTOM USER MODEL ============
class CustomUser(AbstractUser):
    """Custom user model for CaseClosure platform"""
    
    # Authentication
    email = models.EmailField(unique=True)
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True
    )
    
    # Basic Info (these are already in AbstractUser but we can override)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    
    # Contact & Verification
    phone = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    phone_verification_code = models.CharField(max_length=6, blank=True)
    phone_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Account Type
    account_type = models.CharField(
        max_length=20,
        choices=[
            ('unverified', 'Unverified User'),
            ('verified', 'Verified Family Member'),
            ('helper', 'Community Helper'),
            ('detective', 'Law Enforcement'),
            ('advocate', 'Victim Advocate'),
            ('admin', 'Administrator'),
        ],
        default='unverified'
    )
    
    # Location
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=2, default='US')
    zip_code = models.CharField(max_length=10, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Use the custom manager
    objects = CustomUserManager()
    
    # IMPORTANT: Only define these once
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Don't require username for createsuperuser
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            base_username = self.email.split('@')[0]
            username = base_username
            counter = 1
            while CustomUser.objects.filter(username=username).exclude(pk=self.pk).exists():
                username = f"{base_username}{counter}"
                counter += 1
            self.username = username
        super().save(*args, **kwargs)
    
    def generate_phone_verification_code(self):
        """Generate 6-digit SMS verification code"""
        self.phone_verification_code = ''.join(random.choices(string.digits, k=6))
        self.phone_verification_sent_at = timezone.now()
        self.save(update_fields=['phone_verification_code', 'phone_verification_sent_at'])
        return self.phone_verification_code
    
    def __str__(self):
        return self.email


# ============ SITE SETTINGS MODEL ============
class SiteSettings(models.Model):
    """Global site settings - singleton model"""
    REGISTRATION_MODES = [
        ('invite_only', 'Invite Only (Beta)'),
        ('open', 'Open Registration'),
        ('closed', 'Registration Closed'),
    ]
    invite_only_mode = models.BooleanField(
        default=True,
        help_text="Require invite codes for registration"
    )
    registration_mode = models.CharField(
        max_length=20,
        choices=REGISTRATION_MODES,
        default='invite_only',
        help_text="Control how users can register"
    )
    beta_message = models.TextField(
        default="CaseClosure is currently in invite-only beta. Please request an invite to join.",
        blank=True,
        help_text="Message shown when registration is restricted"
    )
    max_users = models.IntegerField(
        default=0,
        help_text="Maximum users allowed (0 = unlimited)"
    )
    current_user_count = models.IntegerField(default=0)
    
    # Email settings
    send_welcome_email = models.BooleanField(default=True)
    auto_approve_requests = models.BooleanField(
        default=False,
        help_text="Automatically approve account requests"
    )
    
    # Feature flags
    enable_google_auth = models.BooleanField(
        default=False,
        help_text="Allow Google OAuth registration/login"
    )
    enable_case_creation = models.BooleanField(default=True)
    enable_public_pages = models.BooleanField(default=True)
    
    # Maintenance
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
        db_table = 'site_settings'
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return f"Site Settings ({self.registration_mode})"


# ============ INVITE CODE MODEL ============
class InviteCode(models.Model):
    """Invite codes for beta registration"""
    code = models.CharField(
        max_length=8, 
        unique=True,
        help_text="8-character invite code"
    )
    email = models.EmailField(
        blank=True, 
        help_text="Optional: restrict to specific email"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_invites'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Usage tracking
    used_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_invite'
    )
    used_at = models.DateTimeField(null=True, blank=True)
    
    # Control fields
    is_active = models.BooleanField(default=True)
    max_uses = models.IntegerField(
        default=1,
        help_text="Maximum number of times this code can be used"
    )
    current_uses = models.IntegerField(default=0)
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Optional expiration date"
    )
    
    # Metadata
    notes = models.TextField(
        blank=True,
        help_text="Internal notes about this invite"
    )
    
    class Meta:
        db_table = 'invite_codes'
        ordering = ['-created_at']
        verbose_name = 'Invite Code'
        verbose_name_plural = 'Invite Codes'
        
    def __str__(self):
        status = "Active" if self.is_valid() else "Used/Expired"
        return f"{self.code} - {status}"
    
    @classmethod
    def generate_code(cls):
        """Generate a unique 8-character code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not cls.objects.filter(code=code).exists():
                return code
    
    def is_valid(self):
        """Check if invite code is valid"""
        if not self.is_active:
            return False
        if self.current_uses >= self.max_uses:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
    
    def use(self, user):
        """Mark this invite as used by a user"""
        self.current_uses += 1
        if self.current_uses == 1:
            self.used_by = user
            self.used_at = timezone.now()
        self.save()


# ============ ACCOUNT REQUEST MODEL ============
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
    
    # Additional fields
    relation = models.CharField(
        max_length=100,
        blank=True,
        help_text="Relationship to case"
    )
    organization = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    # Verification
    description = models.TextField(help_text="Why do you need an account? Relationship to victim?")
    supporting_links = models.TextField(blank=True, help_text="News articles, obituaries, etc.")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        CustomUser,
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='reviewed_requests'
    )
    rejection_reason = models.TextField(blank=True)
    
    # Link to invite code if approved
    invite_code = models.ForeignKey(
        InviteCode,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='account_request'
    )
    
    # Verification code for SMS
    verification_code = models.CharField(max_length=6, blank=True)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    verification_attempts = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'account_requests'
        ordering = ['-submitted_at']
        verbose_name = 'Account Request'
        verbose_name_plural = 'Account Requests'
    
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
    
    def approve_and_create_invite(self, approved_by):
        """Approve request and create invite code"""
        self.status = 'approved'
        self.reviewed_by = approved_by
        self.reviewed_at = timezone.now()
        
        # Create invite code for this email
        invite = InviteCode.objects.create(
            code=InviteCode.generate_code(),
            email=self.email,  # Restrict to requester's email
            created_by=approved_by,
            max_uses=1,
            notes=f"Created for account request from {self.first_name} {self.last_name}"
        )
        
        self.invite_code = invite
        self.save()
        
        # NOTE: Email is sent from the view to avoid circular imports
        
        return invite
    
    def reject(self, rejected_by, reason=""):
        """Reject the account request"""
        self.status = 'rejected'
        self.reviewed_by = rejected_by
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.status}"


# ============ USER PROFILE MODEL ============
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
    
    # Link to CustomUser
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE, 
        related_name="profile"
    )
    
    # Contact & Basic Info
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    organization = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=100, blank=True, help_text="Relationship to case (e.g. Family, Detective, Advocate)")
    bio = models.TextField(blank=True, help_text="Your story, connection, or reason for joining")
    location = models.CharField(max_length=255, blank=True)
    
    # Preferences
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
    
    # Verification Status
    verified = models.BooleanField(default=False)
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
        CustomUser,
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
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='flagged_profiles'
    )
    
    class Meta:
        db_table = 'user_profiles'
        ordering = ['-created_at']
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.email} ({self.account_type})"
    
    def can_access_case(self, case):
        """Check if user can access a specific case"""
        if self.account_type == 'admin' or self.user.is_staff:
            return True
        if self.account_type == 'basic':
            return case.user == self.user
        if self.account_type == 'detective':
            return case.detective_email == self.user.email
        if self.account_type == 'verified':
            return case.user == self.user
        return False
    
    def has_reached_case_limit(self):
        """Check if user has reached their case creation limit"""
        return self.current_cases >= self.max_cases
    
    def increment_case_count(self):
        """Increment the current case count"""
        self.current_cases += 1
        self.save(update_fields=['current_cases'])
    
    def decrement_case_count(self):
        """Decrement the current case count"""
        if self.current_cases > 0:
            self.current_cases -= 1
            self.save(update_fields=['current_cases'])