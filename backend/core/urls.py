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
        # Check if database tables exist and create them if needed
        from scanner.models import UserProfile
        from django.core.management import call_command
        
        database_status = 'unknown'
        
        # Try to query the database
        try:
            UserProfile.objects.first()
            database_status = 'connected'
        except Exception as e:
            error_msg = str(e).lower()
            if 'no such table' in error_msg or 'relation does not exist' in error_msg:
                # Tables don't exist, run migrations
                try:
                    call_command('migrate', verbosity=0, interactive=False)
                    # Test again after migration
                    UserProfile.objects.first()
                    database_status = 'initialized'
                except Exception as migration_error:
                    database_status = 'error'
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Database migration failed: {str(migration_error)}',
                        'version': '1.0.0',
                        'database': database_status
                    }, status=500)
            else:
                # Other database error
                database_status = 'error'
                return JsonResponse({
                    'status': 'error',
                    'message': f'Database error: {str(e)}',
                    'version': '1.0.0',
                    'database': database_status
                }, status=500)
        
        return JsonResponse({
            'status': 'healthy',
            'message': 'Backend API is running successfully - Database ready',
            'version': '1.0.0',
            'database': database_status
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Health check failed: {str(e)}',
            'version': '1.0.0',
            'database': 'error'
        }, status=500)

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