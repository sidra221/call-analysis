from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration.
    Creates both a Django User and a linked UserProfile in a single operation.
    """

    # write_only ensures password and role never appear in response output
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
        }

    def validate_email(self, value):
        """Reject registration if the email is already in use."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_role(self, value):
        """Ensure the provided role is one of the allowed choices."""
        valid_roles = [choice[0] for choice in UserProfile.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}."
            )
        return value

    def create(self, validated_data):
        """
        Create a User and its associated UserProfile.
        Role and password are extracted before passing data to create_user.
        """
        role = validated_data.pop('role')
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.create(user=user, role=role)

        return user