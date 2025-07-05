from rest_framework import serializers
from .models import VisitorProfile, VisitorEvent

class VisitorEventSerializer(serializers.ModelSerializer):
    """
    Serializer for ingesting/tracking individual visitor events.
    Expect fields: fingerprint (via context), url, event_type, metadata.
    """
    class Meta:
        model = VisitorEvent
        fields = ['url', 'event_type', 'metadata']

class VisitorProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for reading a visitor profile and its events.
    """
    events = VisitorEventSerializer(many=True, read_only=True)

    class Meta:
        model = VisitorProfile
        fields = ['fingerprint', 'first_seen', 'last_seen', 'events']
        read_only_fields = ['first_seen', 'last_seen']
