from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError(
                'This account has been deactivated. Contact your manager.',
            )
        return data


class RegisterSerializer(serializers.ModelSerializer):
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
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_role(self, value):
        if value != 'qa':
            raise serializers.ValidationError(
                'Public registration is limited to the QA role only.'
            )
        return value

    def create(self, validated_data):
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.create(user=user, role=role)
        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializes user data for the Users Management page.
    Includes role and avatar from the related UserProfile.
    """
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    avatar_style = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'avatar', 'avatar_style',
            'created_at', 'last_login', 'is_active',
        )

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return None

    def get_avatar(self, obj):
        try:
            profile = obj.profile
            if profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(profile.avatar.url)
                return profile.avatar.url
        except UserProfile.DoesNotExist:
            pass
        return None

    def get_avatar_style(self, obj):
        try:
            style = obj.profile.avatar_style
            return 'initial' if style == 'dicebear' else style
        except UserProfile.DoesNotExist:
            return 'initial'


class UserUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    role = serializers.CharField(required=False)
    password = serializers.CharField(required=False, min_length=8, write_only=True)
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        user = self.context.get('user_instance')
        if user and User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in UserProfile.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}."
            )
        return value

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("No fields to update.")
        return attrs

    def update(self, instance, validated_data):
        if 'email' in validated_data:
            instance.email = validated_data['email']
            instance.save(update_fields=['email'])

        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
            instance.save(update_fields=['password'])

        if 'role' in validated_data:
            profile, _ = UserProfile.objects.get_or_create(
                user=instance,
                defaults={'role': validated_data['role']},
            )
            profile.role = validated_data['role']
            profile.save(update_fields=['role'])

        if 'is_active' in validated_data:
            instance.is_active = validated_data['is_active']
            instance.save(update_fields=['is_active'])

        return instance