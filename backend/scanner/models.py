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
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    job_title = models.CharField(max_length=200, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='business_cards/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name 