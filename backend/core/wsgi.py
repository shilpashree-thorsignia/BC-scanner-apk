import os
from django.core.wsgi import get_wsgi_application

# Use production settings with PostgreSQL support
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.production_settings')

application = get_wsgi_application()

# Vercel expects 'app'
app = application 