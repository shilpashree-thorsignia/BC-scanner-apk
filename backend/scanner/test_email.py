from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def test_email(request):
    """Test email delivery for debugging"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        
        data = json.loads(request.body)
        email = data.get('email', 'test@example.com')
        
        # Test SMTP connection
        smtp_config = {
            'smtp_host': 'smtp.gmail.com',
            'smtp_port': 587,
            'sender_email': 'knowledgeseeker238@gmail.com',
            'sender_password': 'wfnkfipubofrbtnw'
        }
        
        msg = MIMEText(f"Test email from Vercel serverless function")
        msg['From'] = smtp_config['sender_email']
        msg['To'] = email
        msg['Subject'] = "Test Email from BC Scanner"
        
        with smtplib.SMTP(smtp_config['smtp_host'], smtp_config['smtp_port'], timeout=30) as server:
            server.starttls()
            server.login(smtp_config['sender_email'], smtp_config['sender_password'])
            server.send_message(msg)
        
        return JsonResponse({
            'success': True,
            'message': f'Test email sent successfully to {email}',
            'smtp_host': smtp_config['smtp_host'],
            'smtp_port': smtp_config['smtp_port']
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'message': 'Email test failed'
        }, status=500) 