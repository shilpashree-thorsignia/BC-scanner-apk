from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables with explicit path
try:
    from dotenv import load_dotenv
    env_path = BASE_DIR / '.env'
    load_dotenv(env_path)
    print(f"🔧 Loading .env from: {env_path}")
    print(f"🔑 API Key loaded: {'Yes' if os.environ.get('GOOGLE_GEMINI_API_KEY') else 'No'}")
except ImportError:
    print("⚠️ python-dotenv not installed")
    pass
except Exception as e:
    print(f"❌ Error loading .env: {e}")

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-k8#mq3v&x9p7z$w2n5@!c6r1t4y8u9i0o3p6s2a5d8f1g4h7j0k3l6m9')

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['*']

# Gemini AI Configuration
GOOGLE_GEMINI_API_KEY = os.environ.get('GOOGLE_GEMINI_API_KEY')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'scanner',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True  # Only for development

ROOT_URLCONF = 'core.urls'

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

WSGI_APPLICATION = 'core.wsgi.application'

# Database configuration - use Railway PostgreSQL if available, otherwise MySQL
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Parse PostgreSQL URL for Railway
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    # Fallback to MySQL configuration
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'bc_scanner_db',
            'USER': 'root',  
            'PASSWORD': 'MySQL',  
            'HOST': 'localhost', 
            'PORT': '3306', 
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"
            }
        }
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

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email Configuration - Fallback when no EmailConfig exists
# These settings will be used when no EmailConfig is configured in the database
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Gmail SMTP Configuration (you can change to other providers)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').lower() == 'true'

# Default sender email credentials - using knowledgeseeker238@gmail.com for OTP emails
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'knowledgeseeker238@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'wfnkfipubofrbtnw')

# Default FROM email address for OTP emails
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Business Card Scanner <knowledgeseeker238@gmail.com>')

# Email timeout (in seconds)
EMAIL_TIMEOUT = 60

# Print email configuration status
print(f"📧 Email Host: {EMAIL_HOST}:{EMAIL_PORT}")
print(f"📧 Email User: {EMAIL_HOST_USER}")
print(f"📧 Default From: {DEFAULT_FROM_EMAIL}")
print(f"📧 TLS: {EMAIL_USE_TLS}, SSL: {EMAIL_USE_SSL}") 