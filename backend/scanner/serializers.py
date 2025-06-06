from rest_framework import serializers
from .models import BusinessCard
from django.conf import settings

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