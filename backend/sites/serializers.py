from rest_framework import serializers
from .models import MemorialSite

class MemorialSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemorialSite
        fields = [
            'id', 'user', 'name', 'victim_name', 'photo', 'date_of_birth', 'date_of_death',
            'incident_date', 'incident_location', 'case_number', 'investigating_department',
            'detective_contact', 'description', 'media_links', 'reward_offered',
            # --- Publishing fields ---
            'is_public',         # Now default=False on model!
            'subdomain',         # User can PATCH this
            'custom_domain',     # For future custom domain support
            'domain_status',     # Show "Pending", "Live", "Error" on dashboard
            'created_at'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'photo', 'domain_status'
        ]

    # Make user = request.user automatically
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, "user"):
            validated_data['user'] = request.user
        return super().create(validated_data)
