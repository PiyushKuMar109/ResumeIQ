import os
import importlib.util
from pathlib import Path
from datetime import timedelta
import environ
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environment variables
env = environ.Env()

# Read DEBUG from environment first to determine if we should read .env
DEBUG = env.bool('DEBUG', default=True)

# Only read .env file in development, not in production
if DEBUG:
    env_file = os.path.join(BASE_DIR, '.env')
    if os.path.exists(env_file):
        environ.Env.read_env(env_file)

# Debug logging for DATABASE_URL (remove after successful deployment)
print("DATABASE_URL exists:", bool(os.getenv("DATABASE_URL")))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-default-key-for-development-change-me')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])
RENDER_EXTERNAL_HOSTNAME = env('RENDER_EXTERNAL_HOSTNAME', default='')

if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'storages',

    # Project-specific apps
    'accounts',
    'resume',
    'analysis',
    'jobs',
    'interview',
    'reports',
    'dashboard',
]

HAS_WHITENOISE = importlib.util.find_spec('whitenoise') is not None

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

if HAS_WHITENOISE:
    MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database configuration - prioritize DATABASE_URL for production
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        ssl_require=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

AUTH_USER_MODEL = 'accounts.User'

AUTHENTICATION_BACKENDS = [
    'accounts.backends.EmailBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'common.authentication.SafeJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_AUTHENTICATION_RULE': lambda user: user.is_active,
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:3000'],
)
CORS_ALLOWED_ORIGIN_REGEXES = env.list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    default=[r'^https:\/\/.*\.vercel\.app$'],
)

FRONTEND_URLS = [url.rstrip('/') for url in env.list('FRONTEND_URLS', default=[])]
FRONTEND_URL = env('FRONTEND_URL', default='').rstrip('/')
if FRONTEND_URL:
    FRONTEND_URLS.append(FRONTEND_URL)

for frontend_url in FRONTEND_URLS:
    if frontend_url and frontend_url not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(frontend_url)

CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:3000', 'https://*.vercel.app'],
)
for frontend_url in FRONTEND_URLS:
    if frontend_url and frontend_url not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(frontend_url)

CORS_ALLOW_CREDENTIALS = True

if HAS_WHITENOISE:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID', default=None)
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY', default=None)
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME', default=None)
AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='ap-south-1')
AWS_S3_CUSTOM_DOMAIN = env('AWS_S3_CUSTOM_DOMAIN', default=None)

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    if AWS_S3_CUSTOM_DOMAIN:
        AWS_S3_CUSTOM_DOMAIN = AWS_S3_CUSTOM_DOMAIN
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True
    SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_ALWAYS_EAGER = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
