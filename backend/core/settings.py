# settings.py
"""
Django settings for core project with environment-based configuration.
"""

from pathlib import Path
from datetime import timedelta
import os
from decouple import config, Csv
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Cloudinary Configuration (optional for local dev)
CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
CLOUDINARY_API_KEY = config('CLOUDINARY_API_KEY', default='')
CLOUDINARY_API_SECRET = config('CLOUDINARY_API_SECRET', default='')

if CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }
else:
    CLOUDINARY_STORAGE = {}

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment
ENV = config('ENV', default='development')
DEBUG = config('DEBUG', default=False, cast=bool)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# ALLOWED_HOSTS Configuration
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

if DEBUG:
    ALLOWED_HOSTS += [
        'testserver',
        'localhost:8000',
        '127.0.0.1:8000',
        'localhost:5173',
        '127.0.0.1:5173',
    ]

# Add production domains
if not DEBUG:
    ALLOWED_HOSTS += [
        '.caseclosure.org',  # Allows all subdomains
        'caseclosure.org',
        'www.caseclosure.org',
        'caseclosure.onrender.com',  # Render's default domain
    ]

# Add Render's dynamic hostname if available
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Custom User Model
AUTH_USER_MODEL = 'accounts.CustomUser'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'rest_framework',
    'corsheaders',
    'accounts',
    'cases',
    'tracker',
    'django_celery_beat',
    'django_celery_results',
    'channels',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'rest_framework_simplejwt.token_blacklist',
    'rest_framework.authtoken',
    'spotlight',
    'cloudinary_storage',
    'cloudinary',
    'contact',
    'caseboard',
    'django_filters',
]

# Registration Settings
REGISTRATION_MODE = config('REGISTRATION_MODE', default='invite_only')
REGISTRATION_MODES = {
    'invite_only': 'Invite codes required',
    'open': 'Open registration',
    'closed': 'Registration disabled'
}

# Add production-only apps
if not DEBUG:
    INSTALLED_APPS += [
        'storages',  # for S3 if needed later
    ]

SITE_ID = 1

ASGI_APPLICATION = 'core.asgi.application'

# Celery Configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ALWAYS_EAGER = config('CELERY_ALWAYS_EAGER', default=True, cast=bool)  # Run tasks synchronously in dev

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'core.middleware.SubdomainCaseMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
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

WSGI_APPLICATION = 'core.wsgi.application'

# Database Configuration
if config('DATABASE_URL', default=''):
    # Production: Use DATABASE_URL (automatically provided by Render PostgreSQL)
    DATABASES = {
        'default': dj_database_url.parse(
            config('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development: Use local PostgreSQL or SQLite fallback
    DB_ENGINE = config('DB_ENGINE', default='django.db.backends.sqlite3')
    if DB_ENGINE == 'django.db.backends.sqlite3':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': config('DB_SQLITE_PATH', default=os.path.join(os.path.expanduser('~'), 'db.sqlite3')),
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': config('DB_NAME', default='caseclosure_db'),
                'USER': config('DB_USER', default='postgres'),
                'PASSWORD': config('DB_PASSWORD', default=''),
                'HOST': config('DB_HOST', default='localhost'),
                'PORT': config('DB_PORT', default='5432'),
            }
        }

# Additional database options for production
if not DEBUG:
    DATABASES['default'].update({
        'OPTIONS': {
            'sslmode': 'require',
            'connect_timeout': 10,
        },
        'ATOMIC_REQUESTS': True,
    })

# Cache Configuration
REDIS_URL = config('REDIS_URL', default='')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    # Fallback to local memory cache for development without Redis
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Channel Layers (WebSocket support via Django Channels)
if REDIS_URL:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [REDIS_URL],
            },
        },
    }
else:
    # In-memory channel layer for local dev (single-process only)
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Password validation
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

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Chicago'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

if DEBUG:
    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, 'static'),
    ]

# WhiteNoise for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files - Use Cloudinary if configured, otherwise local storage
if CLOUDINARY_CLOUD_NAME:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.caseclosure\.org$",          # Production: all subdomains
    r"^https://.*\.caseclosure\.com$",          # Alt domain subdomains
    r"^http://.*\.localhost:\d+$",              # Local dev: *.localhost:5173
    r"^http://.*\.caseclosure\.org:\d+$",       # Local dev with custom hosts
]

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://caseclosure-frontend.onrender.com",
    "https://caseclosure.org",
    "https://www.caseclosure.org"
]

if not DEBUG:
    CORS_ALLOWED_ORIGINS += [
        "https://caseclosure.org",
        "https://www.caseclosure.org",
        "https://caseclosure.onrender.com",
    ]

CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# Add BrowsableAPIRenderer only in development
if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append(
        'rest_framework.renderers.BrowsableAPIRenderer'
    )

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7 if DEBUG else 1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30 if DEBUG else 7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'UPDATE_LAST_LOGIN': True,
}

# Detection System Configuration
DETECTOR_PARALLEL = True
DETECTOR_MAX_WORKERS = 10

DETECTION_CONFIG = {
    'thresholds': {
        'tor_usage_tolerance': 0,
        'vpn_usage_ratio': 0.4,
    },
    'risk_weights': {
        'tor_usage': 10.0,
        'evidence_tampering': 10.0,
    }
}

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Email configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@caseclosure.org')
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ADMIN_EMAIL = config('ADMIN_EMAIL', default='admin@caseclosure.org')
ADMINS = [('Admin', ADMIN_EMAIL)]

# Allauth Settings
ACCOUNT_EMAIL_VERIFICATION = 'optional' if DEBUG else 'mandatory'
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
ACCOUNT_UNIQUE_EMAIL = True
LOGIN_REDIRECT_URL = '/dashboard'
ACCOUNT_LOGOUT_REDIRECT_URL = '/'

# Social Auth (optional - only configure if credentials are provided)
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    SOCIALACCOUNT_PROVIDERS = {
        'google': {
            'APP': {
                'client_id': GOOGLE_CLIENT_ID,
                'secret': GOOGLE_CLIENT_SECRET,
                'key': ''
            },
            'SCOPE': ['profile', 'email'],
            'AUTH_PARAMS': {'access_type': 'online'},
            'OAUTH_PKCE_ENABLED': True,
        }
    }
else:
    SOCIALACCOUNT_PROVIDERS = {}

# Site URL for emails and redirects
SITE_URL = config('SITE_URL', default='http://localhost:8000')

# Security Settings for Production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_AGE = 60 * 60 * 24 * 7
    SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Logging Configuration
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
        'level': 'INFO' if not DEBUG else 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Sentry for Error Tracking (Optional)
if not DEBUG and config('SENTRY_DSN', default=''):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=config('SENTRY_DSN'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment=ENV,
    )

# Tracking settings
TRACKING_EXCLUDED_PATHS = [
    '/admin/',
    '/static/',
    '/media/',
]

TRACKING_RATE_LIMITS = {
    'default': (100, 60),
    'api': (1000, 60),
    'auth': (5, 300),
}

try:
    from celery.schedules import crontab
    CELERY_BEAT_SCHEDULE = {
        'publish-scheduled-spotlight-posts': {
            'task': 'spotlight.tasks.publish_scheduled_posts',
            'schedule': crontab(minute='*/5'),  # Every 5 minutes
        },
    }
except ImportError:
    CELERY_BEAT_SCHEDULE = {}