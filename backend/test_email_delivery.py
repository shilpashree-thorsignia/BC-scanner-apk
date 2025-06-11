#!/usr/bin/env python
import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from scanner.models import EmailConfig
from scanner.views import EmailService
import time

def test_gmail_config():
    """Test with Gmail configuration to confirm SMTP fix works"""
    print("🔍 Testing Gmail Configuration...")
    
    # Create temporary Gmail config
    gmail_config = EmailConfig(
        smtp_host='smtp.gmail.com',
        smtp_port='587',
        sender_email='knowledgeseeker238@gmail.com',
        sender_password='wfnkfipubofrbtnw',  # App password from settings
        recipient_email='ammu.sv726390@gmail.com',
        is_enabled=True
    )
    
    result = EmailService.send_email(
        config=gmail_config,
        subject='🧪 Test Email - Gmail Configuration',
        message='''
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #4CAF50;">✅ Gmail Test Email</h2>
            <p>This email was sent using <strong>Gmail SMTP (port 587)</strong> to test if the SMTP connection fix is working.</p>
            <p><strong>Time:</strong> ''' + time.strftime('%Y-%m-%d %H:%M:%S') + '''</p>
            <p>If you receive this email, the SMTP fix is working correctly!</p>
        </body>
        </html>
        ''',
        recipient_email='ammu.sv726390@gmail.com'
    )
    
    return result

def test_webmail_config():
    """Test with current webmail configuration"""
    print("🔍 Testing Webmail Configuration...")
    
    config = EmailConfig.objects.first()
    if not config:
        return {'success': False, 'message': 'No email configuration found'}
    
    result = EmailService.send_email(
        config=config,
        subject='🧪 Test Email - Webmail Configuration',
        message='''
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #FF5722;">📧 Webmail Test Email</h2>
            <p>This email was sent using <strong>''' + config.smtp_host + ''' (port ''' + config.smtp_port + ''')</strong></p>
            <p><strong>From:</strong> ''' + config.sender_email + '''</p>
            <p><strong>Time:</strong> ''' + time.strftime('%Y-%m-%d %H:%M:%S') + '''</p>
            <p><strong>Connection Method:</strong> ''' + config.get_connection_method() + '''</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <h3>If you don't receive this email, check:</h3>
                <ul>
                    <li>📁 <strong>Spam/Junk folder</strong> (most common issue)</li>
                    <li>🔐 Webmail server authentication settings</li>
                    <li>⏱️ Email delivery delays (can take 5-15 minutes)</li>
                    <li>🌐 Firewall or server restrictions</li>
                </ul>
            </div>
        </body>
        </html>
        ''',
        recipient_email='ammu.sv726390@gmail.com'
    )
    
    return result

def main():
    print("📧 Email Delivery Test Suite")
    print("=" * 50)
    
    # Test 1: Gmail Configuration
    print("\n🧪 TEST 1: Gmail SMTP (Port 587)")
    gmail_result = test_gmail_config()
    if gmail_result['success']:
        print("   ✅ Gmail test email sent successfully!")
        print("   📧 Check ammu.sv726390@gmail.com inbox")
    else:
        print(f"   ❌ Gmail test failed: {gmail_result['message']}")
    
    print("\n" + "-" * 30)
    
    # Test 2: Webmail Configuration
    print("\n🧪 TEST 2: Webmail SMTP (Port 465)")
    webmail_result = test_webmail_config()
    if webmail_result['success']:
        print("   ✅ Webmail test email sent successfully!")
        print("   📧 Check ammu.sv726390@gmail.com inbox AND spam folder")
        print("   ⏱️  Webmail delivery may take 5-15 minutes")
    else:
        print(f"   ❌ Webmail test failed: {webmail_result['message']}")
    
    print("\n" + "=" * 50)
    print("📊 Summary:")
    print(f"Gmail (Port 587): {'✅ Working' if gmail_result['success'] else '❌ Failed'}")
    print(f"Webmail (Port 465): {'✅ Sent' if webmail_result['success'] else '❌ Failed'}")
    
    if gmail_result['success'] and webmail_result['success']:
        print("\n🎉 Both email methods are working!")
        print("💡 If webmail emails don't arrive, check spam folder and wait 15 minutes")
    elif gmail_result['success']:
        print("\n✅ SMTP fix confirmed working with Gmail")
        print("⚠️  Webmail delivery needs investigation")
    else:
        print("\n❌ Issues found with email system")

if __name__ == "__main__":
    main() 