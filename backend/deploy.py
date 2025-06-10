#!/usr/bin/env python3
"""
Deployment script for Vercel
This script helps with setting up the Django app for Vercel deployment
"""

import os
import sys
import subprocess
import secrets

def generate_secret_key():
    """Generate a secure secret key for Django"""
    return secrets.token_urlsafe(50)

def check_requirements():
    """Check if all required packages are installed"""
    required_packages = [
        'django',
        'djangorestframework',
        'django-cors-headers',
        'psycopg2-binary',
        'dj-database-url',
        'python-decouple',
        'whitenoise',
        'pillow',
        'opencv-python-headless',
        'pytesseract',
        'pyzbar',
        'numpy'
    ]
    
    print("Checking required packages...")
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} (missing)")
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("\nAll required packages are installed!")
    return True

def create_env_file():
    """Create .env file with secure defaults"""
    env_file = '.env'
    
    if os.path.exists(env_file):
        print(f"{env_file} already exists. Skipping creation.")
        return
    
    secret_key = generate_secret_key()
    
    env_content = f"""# Django Configuration
SECRET_KEY={secret_key}
DEBUG=False
DJANGO_SETTINGS_MODULE=core.settings_production

# Domain Configuration (update with your Vercel domain)
DOMAIN=your-app-name.vercel.app

# Database Configuration (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway

# Email Configuration (optional - for automated notifications)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password

# External Services
TESSERACT_CMD=/usr/bin/tesseract

# Logging
DJANGO_LOG_LEVEL=INFO
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"Created {env_file} with secure defaults")
    print("Please update the configuration with your actual values!")

def collect_static():
    """Collect static files"""
    print("Collecting static files...")
    try:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings_production'
        subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=True)
        print("✓ Static files collected successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error collecting static files: {e}")
        return False
    return True

def run_migrations():
    """Run database migrations"""
    print("Running database migrations...")
    try:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings_production'
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("✓ Migrations completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error running migrations: {e}")
        return False
    return True

def test_deployment():
    """Test the deployment configuration"""
    print("Testing deployment configuration...")
    try:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings_production'
        subprocess.run([sys.executable, 'manage.py', 'check', '--deploy'], check=True)
        print("✓ Deployment configuration is valid")
    except subprocess.CalledProcessError as e:
        print(f"✗ Deployment configuration issues: {e}")
        return False
    return True

def main():
    """Main deployment script"""
    print("🚀 Vercel Deployment Setup for Django Business Card Scanner")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("❌ Error: manage.py not found. Please run this script from the Django project root.")
        sys.exit(1)
    
    steps = [
        ("Checking requirements", check_requirements),
        ("Creating environment file", create_env_file),
        ("Collecting static files", collect_static),
        ("Running migrations", run_migrations),
        ("Testing deployment", test_deployment),
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        if not step_func():
            print(f"❌ Failed at: {step_name}")
            sys.exit(1)
    
    print("\n🎉 Deployment setup completed successfully!")
    print("\nNext steps for Vercel deployment:")
    print("1. Install Vercel CLI: npm i -g vercel")
    print("2. Login to Vercel: vercel login")
    print("3. Deploy: vercel --prod")
    print("4. Set environment variables in Vercel dashboard")
    print("5. Update DOMAIN in your environment variables")
    print("\nFor more details, see the README or documentation.")

if __name__ == "__main__":
    main() 