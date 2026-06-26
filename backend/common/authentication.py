from rest_framework_simplejwt.authentication import JWTAuthentication


class SafeJWTAuthentication(JWTAuthentication):
    """
    A wrapper around SimpleJWT's JWTAuthentication that treats invalid tokens
    as unauthenticated instead of raising an error. This prevents an invalid
    Authorization header from blocking public endpoints (e.g. register/login).
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            # Swallow token errors and treat request as unauthenticated.
            return None
