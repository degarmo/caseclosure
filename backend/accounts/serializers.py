# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, InviteCode

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_staff", "is_superuser", "account_type"
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

class RegisterSerializer(serializers.ModelSerializer):
    invite_code = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'password', 'email', 'first_name', 'last_name', 'invite_code')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        # Extract invite_code for later use
        self.invite_code = attrs.pop('invite_code', None)
        return attrs

    def create(self, validated_data):
        # Create user with account_type set on the User model
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            account_type='verified',  # Set on User model, not UserProfile
            is_staff=False,
            is_superuser=False,
        )
        
        # Create or get the UserProfile (without account_type since it doesn't have that field)
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'verified': True,
                'can_create_cases': True,
                'max_cases': 1,
                'current_cases': 0
            }
        )
        
        if not created:
            # Profile already existed (shouldn't happen but just in case)
            profile.verified = True
            profile.can_create_cases = True
            profile.max_cases = 1
            profile.save()
            print(f"WARNING: UserProfile already existed for user {user.id}")
        
        return user