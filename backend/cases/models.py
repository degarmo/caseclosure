from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Case(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cases")
    name = models.CharField(max_length=100, help_text="Title for the case")
    victim_name = models.CharField(max_length=100, help_text="Full name of the victim")
    photo = models.ImageField(upload_to="case_photos/", blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    date_of_death = models.DateField(blank=True, null=True)
    incident_date = models.DateField(blank=True, null=True)
    incident_location = models.CharField(max_length=255, blank=True, help_text="Where the incident occurred")
    case_number = models.CharField(max_length=100, blank=True, help_text="Official case number")
    investigating_department = models.CharField(max_length=255, blank=True)
    detective_contact = models.CharField(max_length=255, blank=True, help_text="Detective's contact info")
    description = models.TextField(blank=True, help_text="Case bio or story")
    media_links = models.TextField(blank=True, help_text="Comma-separated URLs or media links")
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    # -- Reward Fields --
    reward_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Reward amount in USD (ex: 5000.00)"
    )
    reward_offered = models.CharField(
        max_length=100, blank=True,
        help_text="Reward details/terms (e.g., 'For info leading to arrest/conviction. Subject to verification.')"
    )
    # -- End Reward Fields --

    # -- BEGIN PUBLISHING FIELDS --
    is_public = models.BooleanField(default=False)
    subdomain = models.CharField(max_length=50, unique=True, blank=True, null=True)
    custom_domain = models.CharField(max_length=255, unique=True, blank=True, null=True)
    DOMAIN_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('live', 'Live'),
        ('error', 'Error'),
    ]
    domain_status = models.CharField(
        max_length=16,
        choices=DOMAIN_STATUS_CHOICES,
        default='pending'
    )
    # -- END PUBLISHING FIELDS --

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_disabled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.victim_name} ({self.name})"
