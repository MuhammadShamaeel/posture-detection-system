from django.contrib.auth import get_user_model, authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from api.serializers.auth_serializers import (
    SignupSerializer,
    LoginSerializer
)


User = get_user_model()


# Token generator
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


#  Common response format
def auth_response(message, user, tokens):
    return Response({
        "message": message,
        "access": tokens["access"],
        "refresh": tokens["refresh"],
        "user": {
            "email": user.email
        }
    })


#  1. SIGNUP
@api_view(['POST'])
def signup(request):
    serializer = SignupSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    if User.objects.filter(email=email).exists():
        return Response({"error": "User already exists"}, status=400)

    user = User.objects.create_user(email=email, password=password)

    tokens = get_tokens(user)

    return auth_response("Signup successful", user, tokens)


# 2. LOGIN
@api_view(['POST'])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    user = authenticate(request, email=email, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    tokens = get_tokens(user)

    return auth_response("Login successful", user, tokens)


