#!/usr/bin/env python
"""
Database initialization script for Vercel deployment
This script ensures the database is properly set up with all required tables
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.conf import settings

def init_database():
    """Initialize the database with all required tables"""
    try:
        # Set up Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')
        django.setup()
        
        # Run migrations
        print("🔄 Running database migrations...")
        execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
        print("✅ Database migrations completed successfully")
        
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1) 