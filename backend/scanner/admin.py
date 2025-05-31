from django.contrib import admin
from .models import BusinessCard
 
@admin.register(BusinessCard)
class BusinessCardAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'mobile', 'created_at')
    search_fields = ('name', 'email', 'mobile')
    readonly_fields = ('created_at',) 