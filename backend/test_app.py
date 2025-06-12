from django.http import JsonResponse

def handler(request):
    """Simple test handler for Vercel"""
    return JsonResponse({
        'status': 'success',
        'message': 'Django is working on Vercel!',
        'path': request.path
    }) 