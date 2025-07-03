from django.db import models


class Victim(models.Model):
    name = models.CharField(max_length=255)
    subdomain = models.SlugField(unique=True)
    custom_domain = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    story = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name