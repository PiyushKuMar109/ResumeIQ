from django.contrib.auth import get_user_model
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    MyTokenObtainPairSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token_data = MyTokenObtainPairSerializer.get_token(user)
        access = str(token_data.access_token)
        refresh = str(token_data)

        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'access': access,
            'refresh': refresh,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email and password are required',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate using email
        from django.contrib.auth import authenticate
        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                'success': False,
                'message': 'Invalid credentials',
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': access,
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'Refresh token is required',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'success': True,
                'message': 'Logged out successfully',
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'success': False,
                'message': 'Invalid refresh token',
            }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response({
            'success': True,
            'message': 'Profile fetched successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'data': serializer.data,
        }, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class RevokeTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('refresh')
        if not token:
            return Response({
                'success': False,
                'message': 'Refresh token is required',
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(token).blacklist()
            return Response({
                'success': True,
                'message': 'Token revoked successfully',
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'success': False,
                'message': 'Could not revoke token',
            }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid password data',
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response({
                'success': False,
                'message': 'Old password is incorrect',
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({
            'success': True,
            'message': 'Password changed successfully',
        }, status=status.HTTP_200_OK)
