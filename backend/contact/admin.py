from django.contrib import admin
from .models import ContactInquiry, Tip


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'inquiry_type', 'status', 'submitted_at']
    list_filter = ['inquiry_type', 'status', 'submitted_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['id', 'submitted_at', 'created_at', 'updated_at', 'user_agent']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('id', 'name', 'email', 'phone')
        }),
        ('Inquiry Details', {
            'fields': ('inquiry_type', 'subject', 'message', 'case_reference')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('submitted_at', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):
    list_display = ['case', 'urgency', 'is_anonymous', 'status', 'submitted_at']
    list_filter = ['urgency', 'is_anonymous', 'status', 'submitted_at']
    search_fields = ['tip_content', 'submitter_name', 'submitter_email']
    readonly_fields = ['id', 'submitted_at', 'created_at', 'updated_at', 'user_agent']
    
    fieldsets = (
        ('Case Information', {
            'fields': ('id', 'case')
        }),
        ('Submitter Information', {
            'fields': ('is_anonymous', 'submitter_name', 'submitter_email', 'submitter_phone')
        }),
        ('Tip Details', {
            'fields': ('tip_content', 'urgency')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('submitted_at', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )