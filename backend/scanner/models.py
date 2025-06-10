from django.db import models
from django.core.validators import MinLengthValidator

class UserProfile(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    password = models.CharField(max_length=255)  # Note: In production, always hash passwords
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}"

class BusinessCard(models.Model):
    CARD_TYPE_CHOICES = [
        ('regular', 'Regular Business Card'),
        ('qr_business_card', 'QR Code Business Card'),
    ]
    
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    job_title = models.CharField(max_length=200, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='business_cards/', blank=True, null=True)
    type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES, default='regular')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class EmailConfig(models.Model):
    is_enabled = models.BooleanField(default=False, help_text="Enable or disable automated email notifications")
    sender_email = models.EmailField(max_length=255, help_text="Email address to send notifications from")
    sender_password = models.CharField(max_length=255, help_text="App password or email account password")
    recipient_email = models.EmailField(max_length=255, help_text="Email address to receive notifications")
    smtp_host = models.CharField(max_length=255, default='smtp.gmail.com', help_text="SMTP server hostname")
    smtp_port = models.CharField(max_length=10, default='587', help_text="SMTP server port")
    email_subject = models.CharField(max_length=255, default='New Business Card Scanned', help_text="Subject line for automated emails")
    email_template = models.TextField(default='A new business card has been scanned and added to your collection.', help_text="Email message template")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Email Configuration"
        verbose_name_plural = "Email Configurations"

    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"Email Config - {status} ({self.sender_email} → {self.recipient_email})" 