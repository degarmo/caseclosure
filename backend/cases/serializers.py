from rest_framework import serializers
from .models import Case

class CaseSerializer(serializers.ModelSerializer):
    # Read-only field to return the URL for the logo image
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Case
        fields = [
            'id', 'user', 'victim_name', 'first_name', 'last_name',
            'description', 'relation', 'crime_type',
            'detective_name', 'detective_phone', 'detective_email',
            'template', 'layout', 'subdomain', 'custom_domain',
            'media_links', 'date_of_birth', 'date_of_death', 'incident_date',
            'incident_location', 'case_number', 'investigating_department',
            'reward_offered', 'reward_amount', 'is_public', 'domain_status',
            'logo',            # add for upload
            'logo_url',        # add for display
            'logo_gallery_id', # add if you want gallery logos
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'logo_url']

    def get_logo_url(self, obj):
        if obj.logo and hasattr(obj.logo, 'url'):
            return obj.logo.url
        return None
