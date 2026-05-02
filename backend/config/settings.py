"""
Django settings for config project.
Prêt pour le déploiement sur Render.com
"""

import os
from pathlib import Path
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# CONFIGURATION DE BASE
# ============================================================

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-e3s9bync1azp+^ge+l*dz5!2ex!5t7^7s2!&7ua#@7s8b0b1d5')
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get(
    'ALLOWED_HOSTS', 
    'localhost,127.0.0.1,.onrender.com'
).split(',')

# ============================================================
# APPLICATION DEFINITION
# ============================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_user_agents',
    
    # Cloudinary (pour les médias en production)
    'cloudinary',
    'cloudinary_storage',
    
    # Local apps
    'listings',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # CORS en premier
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',       # Fichiers statiques
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_user_agents.middleware.UserAgentMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

# ============================================================
# BASE DE DONNÉES
# ============================================================

if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        DATABASES = {
            'default': dj_database_url.config(
                default=database_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

# ============================================================
# MOTS DE PASSE
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================
# REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}

# ============================================================
# JWT SETTINGS
# ============================================================

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ============================================================
# INTERNATIONALISATION
# ============================================================

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Indian/Antananarivo'
USE_I18N = True
USE_TZ = True

# ============================================================
# CORS (Cross-Origin Resource Sharing)
# ============================================================

CORS_ALLOWED_ORIGINS = [
    'https://marketplacemaximin.netlify.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# ============================================================
# STRIPE (Paiement)
# ============================================================

STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_placeholder')

# ============================================================
# FICHIERS STATIQUES
# ============================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

static_dir = BASE_DIR / 'static'
STATICFILES_DIRS = [static_dir] if static_dir.exists() else []

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ============================================================
# FICHIERS MÉDIAS (Cloudinary ou Local)
# ============================================================

# ✅ CORRECT
CLOUDINARY_CLOUD_NAME = 'dbf8mmbxp'
CLOUDINARY_API_KEY = '754296665639492'
CLOUDINARY_API_SECRET = 'oWBIvEJkT6OjTfPzIQmvrCkdYiQ'

if not DEBUG and CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = f"https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/image/upload/"
else:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

# ============================================================
# SÉCURITÉ (Production)
# ============================================================

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# ============================================================
# CACHE
# ============================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# ============================================================
# LOGS
# ============================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# ============================================================
# GÉOLOCALISATION
# ============================================================

GEOIP_PATH = BASE_DIR / 'geoip'

# ============================================================
# DEFAULT AUTO FIELD
# ============================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================
# EMAIL
# ============================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
