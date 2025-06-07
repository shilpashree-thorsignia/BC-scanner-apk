from rest_framework import serializers
from .models import BusinessCard, UserProfile
from django.conf import settings
from django.contrib.auth.hashers import make_password

class BusinessCardSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BusinessCard
        fields = [
            'id', 
            'name', 
            'email', 
            'mobile', 
            'company',
            'job_title',
            'website',
            'address',
            'notes',
            'image',
            'image_url',
            'created_at'
        ]
        read_only_fields = ('image_url',)
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
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