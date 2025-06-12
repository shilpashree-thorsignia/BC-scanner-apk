from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.core.management import execute_from_command_line
import sys

def health_check(request):
    """Simple health check endpoint for Vercel deployment"""
    try:
        # Check if database tables exist
        from scanner.models import UserProfile
        UserProfile.objects.first()  # This will fail if table doesn't exist
        
        return JsonResponse({
            'status': 'healthy',
            'message': 'Backend API is running successfully',
            'version': '1.0.0',
            'database': 'connected'
        })
    except Exception as e:
        # Database tables don't exist, try to create them
        try:
            from django.core.management import call_command
            call_command('migrate', verbosity=0, interactive=False)
            
            return JsonResponse({
                'status': 'healthy',
                'message': 'Backend API is running successfully - Database initialized',
                'version': '1.0.0',
                'database': 'initialized'
            })
        except Exception as migration_error:
            return JsonResponse({
                'status': 'warning',
                'message': 'Backend API is running but database needs setup',
                'version': '1.0.0',
                'database': 'error',
                'error': str(migration_error)
            })

def run_migrations(request):
    """Temporary endpoint to run database migrations"""
    if request.method == 'POST':
        try:
            # Run migrations
            from django.core.management import call_command
            call_command('migrate', verbosity=1, interactive=False)
            return JsonResponse({
                'status': 'success',
                'message': 'Migrations completed successfully'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'Migration failed: {str(e)}'
            }, status=500)
    else:
        return JsonResponse({
            'status': 'info',
            'message': 'Send POST request to run migrations'
        })
 
urlpatterns = [
    path('', health_check, name='health_check'),  # Root endpoint
    path('health/', health_check, name='health'),  # Health check endpoint
    path('migrate/', run_migrations, name='migrate'),  # Temporary migration endpoint
    path('admin/', admin.site.urls),
    path('api/', include('scanner.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 