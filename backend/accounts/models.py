from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
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

    def __str__(self):
        return f"Profile for {self.user.username}"
