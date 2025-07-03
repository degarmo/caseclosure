from rest_framework import serializers
from .models import Victim

class VictimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Victim
        fields = [
            'id', 'name', 'subdomain', 'custom_domain',
            'image_url', 'story', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']