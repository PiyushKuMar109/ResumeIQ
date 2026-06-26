from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'role',
            'phone_number',
            'linkedin_profile',
            'github_profile',
            'portfolio_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    # Accept payload from the frontend (Register.jsx)
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        # User model has: full_name, email, role, phone_number, ...
        fields = ['full_name', 'email', 'password', 'role', 'first_name', 'last_name', 'phone_number', 'department']

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Build full_name for your User model
        first_name = (validated_data.pop('first_name', '') or '').strip()
        last_name = (validated_data.pop('last_name', '') or '').strip()
        full_name = (validated_data.get('full_name') or '').strip()

        if not full_name:
            full_name = f"{first_name} {last_name}".strip()

        # department is not a field on User in current models; ignore it.
        validated_data.pop('department', None)

        user = User.objects.create_user(
            full_name=full_name,
            password=password,
            **validated_data,
        )
        return user



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token


class LoginResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()
