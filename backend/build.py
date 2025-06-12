#!/usr/bin/env python
"""
Build script for Vercel deployment
This script handles any initialization tasks needed for the Django app
"""

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.vercel_settings')
    django.setup()

def create_directories():
    """Create necessary directories"""
    directories = [
        '/tmp/staticfiles',
        '/tmp/media',
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        else:
            print(f"📁 Directory exists: {directory}")

def collect_static():
    """Collect static files if needed"""
    try:
        from django.core.management import call_command
        call_command('collectstatic', '--noinput', verbosity=1)
        print("✅ Static files collected successfully")
    except Exception as e:
        print(f"⚠️ Static files collection skipped: {e}")

def main():
    """Main build function"""
    print("🔧 Starting Vercel build process...")
    
    # Setup Django
    setup_django()
    
    # Create directories
    create_directories()
    
    # Collect static files
    collect_static()
    
    print("✅ Build process completed!")

if __name__ == '__main__':
    main() 