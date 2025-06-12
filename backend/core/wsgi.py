"""
WSGI config for core project.
"""

import os

from django.core.wsgi import get_wsgi_application

# Use Vercel settings for production deployment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')

application = get_wsgi_application() 