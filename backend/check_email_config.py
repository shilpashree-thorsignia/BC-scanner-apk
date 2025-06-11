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

def main():
    print("🔍 Email Configuration Analysis")
    print("=" * 50)
    
    # Check if any email config exists
    config = EmailConfig.objects.first()
    
    if not config:
        print("❌ No email configuration found")
        return
    
    print(f"📧 Current Email Configuration:")
    print(f"   Host: {config.smtp_host}")
    print(f"   Port: {config.smtp_port}")
    print(f"   Method: {config.get_connection_method()}")
    print(f"   From: {config.sender_email}")
    print(f"   To: {config.recipient_email}")
    print(f"   Enabled: {config.is_enabled}")
    print()
    
    # Debug info
    debug_info = config.get_debug_info()
    print("🔧 Debug Information:")
    for key, value in debug_info.items():
        print(f"   {key}: {value}")
    print()
    
    # Analysis
    print("📊 Analysis:")
    if config.smtp_port == '465':
        print("   ✅ Port 465 detected - will use SMTP_SSL (Direct SSL)")
        print("   💡 This is correct for webmail servers like thorsignia.in")
    elif config.smtp_port == '587':
        print("   ✅ Port 587 detected - will use SMTP + STARTTLS")
        print("   💡 This is correct for Gmail and similar providers")
    else:
        print(f"   ⚠️  Port {config.smtp_port} - will use basic SMTP")
    
    print()
    
    # Common issues for webmail
    if 'thorsignia.in' in config.smtp_host:
        print("🌐 Webmail Server Detected (thorsignia.in)")
        print("   Common issues and solutions:")
        print("   1. Check if emails are going to spam/junk folder")
        print("   2. Verify sender email authentication settings")
        print("   3. Check if SMTP server requires specific authentication")
        print("   4. Verify recipient email is correct: ammu.sv726390@gmail.com")
        print("   5. Some webmail servers have delivery delays")
        print()
        print("🔍 Troubleshooting steps:")
        print("   - Test with Gmail config first to confirm fix works")
        print("   - Check webmail server documentation for SMTP settings")
        print("   - Consider checking server firewall/port restrictions")

if __name__ == "__main__":
    main() 