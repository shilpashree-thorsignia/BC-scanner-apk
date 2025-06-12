import os
import dj_database_url
from .settings import *

# Vercel serverless settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-k8#mq3v&x9p7z$w2n5@!c6r1t4y8u9i0o3p6s2a5d8f1g4h7j0k3l6m9')

ALLOWED_HOSTS = [
    '.vercel.app',
    'localhost',
    '127.0.0.1',
    # Add your custom domain if you have one
    # 'yourdomain.com',
]

# Database - use Vercel Postgres or external DB
if 'POSTGRES_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('POSTGRES_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Fallback to SQLite for development/testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': '/tmp/db.sqlite3',
        }
    }

# Static files for Vercel
STATIC_URL = '/static/'
STATIC_ROOT = '/tmp/staticfiles'  # Use tmp directory for serverless
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Disable static file collection in serverless environment
# Static files should be served by Vercel directly
STATICFILES_DIRS = []

# Create staticfiles directory if it doesn't exist
if not os.path.exists('/tmp/staticfiles'):
    os.makedirs('/tmp/staticfiles', exist_ok=True)

# Media files (for file uploads) - use tmp for serverless
MEDIA_URL = '/media/'
MEDIA_ROOT = '/tmp/media'

# Create media directory if it doesn't exist
if not os.path.exists('/tmp/media'):
    os.makedirs('/tmp/media', exist_ok=True)

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Disable some Django features that don't work well in serverless
USE_TZ = True
USE_I18N = True
USE_L10N = True

# Logging for Vercel
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Middleware - ensure WhiteNoise is properly positioned
if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware') 