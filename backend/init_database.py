"""
Database initialization for Vercel serverless deployment
Ensures database tables exist before processing any requests
"""

import os
import django
from django.core.management import execute_from_command_line
from django.db import connection

def ensure_database_initialized():
    """
    Ensure database tables exist. If not, create them.
    This runs before any view that accesses the database.
    """
    try:
        # Set up Django if not already done
        if not django.apps.apps.ready:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.production_settings')
            django.setup()
        
        # Test if main tables exist
        from scanner.models import UserProfile
        
        # Try to query the table - this will fail if table doesn't exist
        UserProfile.objects.first()
        return True
        
    except Exception as e:
        error_msg = str(e).lower()
        if 'no such table' in error_msg or 'relation does not exist' in error_msg:
            # Tables don't exist, run migrations
            try:
                execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
                return True
            except Exception as migration_error:
                return False
        else:
            # Other database error
            return False

def init_for_request():
    """
    Initialize database for incoming request.
    Call this at the start of any view that needs database access.
    """
    return ensure_database_initialized() 