import os
from django.core.wsgi import get_wsgi_application

# Use vercel settings that were working
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')

application = get_wsgi_application()

# Vercel expects 'app'
app = application 