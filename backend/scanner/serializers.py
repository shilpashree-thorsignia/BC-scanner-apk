from rest_framework import serializers
from .models import BusinessCard, UserProfile, EmailConfig
from django.conf import settings
from django.contrib.auth.hashers import make_password
import re

class BusinessCardSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_front_url = serializers.SerializerMethodField()
    image_back_url = serializers.SerializerMethodField()

    class Meta:
        model = BusinessCard
        fields = [
            'id', 
            'name', 
            'first_name',
            'last_name',
            'middle_name',
            'email', 
            'email_secondary',
            'mobile', 
            'mobile_secondary',
            'landline',
            'fax',
            'company',
            'company_full_name',
            'department',
            'job_title',
            'job_title_secondary',
            'website',
            'website_secondary',
            'linkedin',
            'twitter',
            'facebook',
            'instagram',
            'skype',
            'address',
            'street_address',
            'city',
            'state',
            'postal_code',
            'country',
            'industry',
            'services',
            'specialization',
            'certifications',
            'awards',
            'notes',
            'tags',
            'priority',
            'image',
            'image_front',
            'image_back',
            'image_url',
            'image_front_url',
            'image_back_url',
            'front_side_text',
            'back_side_text',
            'qr_code_data',
            'qr_code_type',
            'primary_language',
            'secondary_language',
            'timezone',
            'type',
            'scan_confidence',
            'scan_method',
            'processing_time',
            'is_verified',
            'needs_review',
            'created_at',
            'updated_at',
            'is_deleted',
            'deleted_at'
        ]
        read_only_fields = ('image_url', 'image_front_url', 'image_back_url', 'deleted_at', 'created_at', 'updated_at')
    
    def validate_website(self, value):
        """Validate and normalize website URL"""
        if not value or value.strip() == '':
            return ''
        
        # Clean the value
        website = value.strip()
        
        # If it's already a valid URL, return as is
        if website.startswith(('http://', 'https://')):
            return website
        
        # If it starts with www., add https://
        if website.startswith('www.'):
            return f'https://{website}'
        
        # If it looks like a domain (contains a dot), add https://www.
        if '.' in website and not website.startswith(('http://', 'https://', 'www.')):
            return f'https://www.{website}'
        
        # If it doesn't look like a URL, return empty string
        return ''
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_image_front_url(self, obj):
        if obj.image_front:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_front.url)
            return obj.image_front.url
        return None
    
    def get_image_back_url(self, obj):
        if obj.image_back:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_back.url)
            return obj.image_back.url
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'password', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }
    
    def validate_email(self, value):
        if UserProfile.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def create(self, validated_data):
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class EmailConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfig
        fields = [
            'id',
            'is_enabled',
            'sender_email',
            'sender_password',
            'recipient_email',
            'smtp_host',
            'smtp_port',
            'email_subject',
            'email_template',
            'created_at',
            'updated_at'
        ]
        extra_kwargs = {
            'sender_password': {'write_only': True},  # Don't return password in responses
        }
    
    def validate_smtp_port(self, value):
        """Validate SMTP port is a valid number"""
        try:
            port = int(value)
            if port < 1 or port > 65535:
                raise serializers.ValidationError("Port must be between 1 and 65535")
            return value
        except ValueError:
            raise serializers.ValidationError("Port must be a valid number")
    
    def validate_sender_email(self, value):
        """Validate sender email format"""
        if not value:
            raise serializers.ValidationError("Sender email is required when enabled")
        return value.lower()
    
    def validate_recipient_email(self, value):
        """Validate recipient email format"""
        if not value:
            raise serializers.ValidationError("Recipient email is required when enabled")
        return value.lower()
    
    def validate(self, attrs):
        """Cross-field validation"""
        if attrs.get('is_enabled', False):
            required_fields = ['sender_email', 'sender_password', 'recipient_email']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({
                        field: f"{field.replace('_', ' ').title()} is required when email automation is enabled"
                    })
        return attrs