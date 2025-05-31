from rest_framework import serializers
from .models import BusinessCard

class BusinessCardSerializer(serializers.ModelSerializer):
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
            'created_at'
        ] 