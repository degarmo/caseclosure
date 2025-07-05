from django.core.exceptions import ValidationError
from django.db import models
from victims.models import Victim
from tracker.models import VisitorProfile

class Tip(models.Model):
    victim     = models.ForeignKey(Victim, on_delete=models.CASCADE, related_name="tips")
    profile    = models.ForeignKey(VisitorProfile, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="tips")
    anonymous  = models.BooleanField(default=False)
    name       = models.CharField(max_length=255, blank=True)
    email      = models.EmailField(blank=True)
    phone      = models.CharField(max_length=20, blank=True)
    message    = models.TextField()
    document   = models.FileField(upload_to='tip_docs/', blank=True, null=True)
    approved   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # enforce identifier if not anonymous
        if not self.anonymous and not (self.name or self.email or self.phone):
            raise ValidationError("Provide name, email or phone, or mark anonymous.")
