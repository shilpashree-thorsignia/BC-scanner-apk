import os
import dj_database_url
from .settings import *

# Vercel serverless settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-here')

ALLOWED_HOSTS = [
    '.vercel.app',
    'localhost',
    '127.0.0.1',
]

# Database - use Vercel Postgres or external DB
if 'POSTGRES_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('POSTGRES_URL'),
            conn_max_age=600,
        )
    }

# Static files for Vercel
STATIC_URL = '/static/'
STATIC_ROOT = 'staticfiles'

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# Middleware
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware') 