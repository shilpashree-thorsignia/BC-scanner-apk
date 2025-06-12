#!/bin/bash

# Vercel build script for Django backend
echo "🔧 Starting Django build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --settings=core.vercel_settings

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --settings=core.vercel_settings

echo "✅ Build process completed successfully!" 