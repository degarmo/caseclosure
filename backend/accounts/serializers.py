# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", allow_blank=True, required=False)
    last_name = serializers.CharField(source="user.last_name", allow_blank=True, required=False)
    email = serializers.EmailField(source="user.email", allow_blank=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'email',
            'phone', 'preferred_contact', 'notifications_tips', 'notifications_updates',
            'timezone', 'language', 'other_language',
            # ...add any other UserProfile fields
        ]

    def update(self, instance, validated_data):
        # Separate user and profile fields
        user_data = validated_data.pop('user', {})
        # Update UserProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Update User fields
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        return instance
