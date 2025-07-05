
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Tip
from django.conf import settings

@receiver(post_save, sender=Tip)
def email_admin_on_tip(sender, instance, created, **kwargs):
    if created:
        send_mail(
          subject=f"New tip for {instance.victim.name}",
          message=instance.message,
          from_email=settings.DEFAULT_FROM_EMAIL,
          recipient_list=[settings.ADMIN_EMAIL],
        )
