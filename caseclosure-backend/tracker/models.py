# caseclosure-backend/tracker/models.py

from django.db import models
from victims.models import Victim

class VisitorProfile(models.Model):
    """
    Represents a unique visitor (via fingerprint) to a given victim's site.
    """
    fingerprint = models.CharField(max_length=255, unique=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    victim = models.ForeignKey(
        Victim,
        on_delete=models.CASCADE,
        related_name="visitors"
    )

    def __str__(self):
        return f"{self.fingerprint} @ {self.victim.subdomain}"

class VisitorEvent(models.Model):
    """
    An individual event (pageview, click, etc.) tied to a VisitorProfile.
    """
    profile = models.ForeignKey(
        VisitorProfile,
        on_delete=models.CASCADE,
        related_name="events"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    url = models.URLField()
    event_type = models.CharField(max_length=50)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.event_type} @ {self.timestamp}"

