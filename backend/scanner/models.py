from django.db import models
from django.core.validators import MinLengthValidator
from django.utils import timezone
from datetime import timedelta

class UserProfile(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    password = models.CharField(max_length=255)  # Note: In production, always hash passwords
    is_verified = models.BooleanField(default=False, help_text="Whether email is verified")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}"

class OTPVerification(models.Model):
    """Model to store OTP codes for email verification during registration"""
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    password_hash = models.CharField(max_length=255)  # Store hashed password temporarily
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['email', 'otp_code']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.email} - {'Used' if self.is_used else 'Active'}"
    
    def is_expired(self):
        """Check if OTP has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if OTP is valid (not used and not expired)"""
        return not self.is_used and not self.is_expired()
    
    @classmethod
    def cleanup_expired(cls):
        """Remove expired OTP records"""
        expired_count = cls.objects.filter(expires_at__lt=timezone.now()).delete()[0]
        return expired_count
    
    @classmethod
    def generate_otp(cls, email, first_name, last_name, phone, password_hash, expires_in_minutes=10):
        """Generate a new OTP for email verification"""
        import random
        
        # Generate 6-digit OTP
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Clean up any existing OTPs for this email
        cls.objects.filter(email=email).delete()
        
        # Create new OTP
        otp = cls.objects.create(
            email=email,
            otp_code=otp_code,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            password_hash=password_hash,
            expires_at=timezone.now() + timedelta(minutes=expires_in_minutes)
        )
        
        return otp

class BusinessCard(models.Model):
    CARD_TYPE_CHOICES = [
        ('regular', 'Regular Business Card'),
        ('qr_business_card', 'QR Code Business Card'),
        ('dual_side', 'Dual-Side Business Card'),
    ]
    
    # Personal Information
    name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Contact Information
    email = models.EmailField(blank=True, null=True)
    email_secondary = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    mobile_secondary = models.CharField(max_length=20, blank=True, null=True)
    landline = models.CharField(max_length=20, blank=True, null=True)
    fax = models.CharField(max_length=20, blank=True, null=True)
    
    # Company/Organization Information
    company = models.CharField(max_length=200, blank=True, null=True)
    company_full_name = models.CharField(max_length=300, blank=True, null=True)
    department = models.CharField(max_length=200, blank=True, null=True)
    job_title = models.CharField(max_length=200, blank=True, null=True)
    job_title_secondary = models.CharField(max_length=200, blank=True, null=True)
    
    # Digital Presence
    website = models.URLField(blank=True, null=True)
    website_secondary = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    skype = models.CharField(max_length=100, blank=True, null=True)
    
    # Address Information
    address = models.TextField(blank=True, null=True)
    street_address = models.CharField(max_length=300, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Additional Business Information
    industry = models.CharField(max_length=200, blank=True, null=True)
    services = models.TextField(blank=True, null=True)
    specialization = models.TextField(blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    awards = models.TextField(blank=True, null=True)
    
    # Card Images
    image_front = models.ImageField(upload_to='business_cards/front/', blank=True, null=True)
    image_back = models.ImageField(upload_to='business_cards/back/', blank=True, null=True)
    image = models.ImageField(upload_to='business_cards/', blank=True, null=True)  # Keep for backward compatibility
    
    # Extracted Text Data
    front_side_text = models.TextField(blank=True, null=True, help_text="Raw OCR text from front side")
    back_side_text = models.TextField(blank=True, null=True, help_text="Raw OCR text from back side")
    
    # QR Code Data
    qr_code_data = models.TextField(blank=True, null=True)
    qr_code_type = models.CharField(max_length=50, blank=True, null=True)
    
    # Language and Regional Information
    primary_language = models.CharField(max_length=50, blank=True, null=True)
    secondary_language = models.CharField(max_length=50, blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)
    
    # Additional Fields
    notes = models.TextField(blank=True, null=True)
    tags = models.CharField(max_length=500, blank=True, null=True, help_text="Comma-separated tags")
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low Priority'),
        ('medium', 'Medium Priority'),
        ('high', 'High Priority'),
        ('urgent', 'Urgent')
    ], default='medium')
    
    # Scanning Metadata
    type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES, default='regular')
    scan_confidence = models.FloatField(default=0.0, help_text="OCR confidence score (0-100)")
    scan_method = models.CharField(max_length=50, blank=True, null=True, help_text="OCR method used")
    processing_time = models.FloatField(default=0.0, help_text="Time taken to process in seconds")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Verification and Quality
    is_verified = models.BooleanField(default=False, help_text="Whether the data has been manually verified")
    needs_review = models.BooleanField(default=False, help_text="Whether this card needs manual review")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company']),
            models.Index(fields=['name']),
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"{self.name} - {self.company}" if self.company else self.name
    
    def get_full_name(self):
        """Get properly formatted full name"""
        if self.first_name and self.last_name:
            middle = f" {self.middle_name}" if self.middle_name else ""
            return f"{self.first_name}{middle} {self.last_name}"
        return self.name
    
    def get_primary_contact(self):
        """Get the primary contact method"""
        return self.email or self.mobile or "No contact info"
    
    def get_all_phones(self):
        """Get all phone numbers as a list"""
        phones = []
        if self.mobile:
            phones.append(('Mobile', self.mobile))
        if self.mobile_secondary:
            phones.append(('Mobile 2', self.mobile_secondary))
        if self.landline:
            phones.append(('Landline', self.landline))
        if self.fax:
            phones.append(('Fax', self.fax))
        return phones
    
    def get_all_emails(self):
        """Get all email addresses as a list"""
        emails = []
        if self.email:
            emails.append(('Primary', self.email))
        if self.email_secondary:
            emails.append(('Secondary', self.email_secondary))
        return emails
    
    def get_social_media(self):
        """Get all social media links"""
        social = {}
        if self.linkedin:
            social['LinkedIn'] = self.linkedin
        if self.twitter:
            social['Twitter'] = self.twitter
        if self.facebook:
            social['Facebook'] = self.facebook
        if self.instagram:
            social['Instagram'] = self.instagram
        if self.skype:
            social['Skype'] = self.skype
        return social

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