from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_staff", "is_superuser"
        ]

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
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        return instance
