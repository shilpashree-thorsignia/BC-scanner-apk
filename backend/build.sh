#!/bin/bash

# Build script for Vercel

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=core.vercel_settings

echo "Running database migrations..."
python manage.py migrate --settings=core.vercel_settings

echo "Build complete!" 