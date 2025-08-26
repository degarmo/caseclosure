# cases/admin.py - Updated to work with new model fields

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Case, 
    SpotlightPost, 
    TemplateRegistry, 
    CasePhoto, 
    DeploymentLog
)


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    # Updated list_display to use correct field names
    list_display = (
        'id', 
        'display_victim_name',  # Custom method to show full name
        'case_title',           # Changed from 'name' to 'case_title'
        'incident_date',
        'reward_amount', 
        'is_public', 
        'deployment_status',    # Changed from 'domain_status' to 'deployment_status'
        'is_disabled',
        'view_site_link'        # Added link to view deployed site
    )
    
    # Updated list_filter with correct field names
    list_filter = (
        'is_public', 
        'is_disabled', 
        'deployment_status',    # Changed from 'domain_status'
        'case_type',           # Added case type filter
        'template_id',         # Added template filter
        'ssl_status',          # Added SSL status filter
        'created_at'           # Added date filter
    )
    
    # Updated search_fields with correct field names
    search_fields = (
        'first_name',          # Search by first name
        'last_name',           # Search by last name
        'case_title',          # Changed from 'name'
        'case_number', 
        'description',
        'subdomain',           # Added subdomain search
        'custom_domain'        # Added custom domain search
    )
    
    # Organize fields in the admin form
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'user',
                'case_title',
                ('first_name', 'middle_name', 'last_name'),
                'nickname',
                ('date_of_birth', 'date_of_death', 'date_missing'),
                'primary_photo'
            )
        }),
        ('Case Details', {
            'fields': (
                'case_type',
                'case_number',
                ('incident_date', 'incident_location'),
                'last_seen_location',
                'description'
            )
        }),
        ('Physical Description', {
            'fields': (
                ('age', 'sex', 'race'),
                ('height_feet', 'height_inches', 'weight'),
                ('hair_color', 'eye_color'),
                'distinguishing_features'
            ),
            'classes': ('collapse',)  # Collapsible section
        }),
        ('Investigation', {
            'fields': (
                'investigating_agency',
                ('detective_name', 'detective_phone', 'detective_email'),
                ('reward_amount', 'reward_details')
            )
        }),
        ('Template & Customization', {
            'fields': (
                ('template_id', 'template_version'),
                'template_data'  # JSON field for customizations
            ),
            'classes': ('collapse',)
        }),
        ('Deployment & Domain', {
            'fields': (
                ('subdomain', 'custom_domain'),
                ('deployment_status', 'ssl_status'),
                'deployment_url',
                'last_deployed_at',
                'deployment_error',
                'render_service_id'
            )
        }),
        ('Publishing Settings', {
            'fields': (
                ('is_public', 'is_disabled'),
                ('created_at', 'updated_at')
            )
        })
    )
    
    # Make timestamps read-only
    readonly_fields = (
        'created_at', 
        'updated_at', 
        'last_deployed_at',
        'deployment_url',
        'render_service_id',
        'deployment_error'
    )
    
    # Customize how the admin form looks
    save_on_top = True
    list_per_page = 25
    
    # Custom method to display victim's full name
    def display_victim_name(self, obj):
        """Display the victim's full name"""
        return obj.get_display_name()
    display_victim_name.short_description = 'Victim Name'
    display_victim_name.admin_order_field = 'last_name'  # Allow sorting
    
    # Custom method to show link to deployed site
    def view_site_link(self, obj):
        """Show link to view the deployed website"""
        url = obj.get_full_url()
        if url:
            return format_html(
                '<a href="{}" target="_blank">View Site ↗</a>',
                url
            )
        return '-'
    view_site_link.short_description = 'Website'
    
    # Custom admin actions
    actions = ['make_public', 'make_private', 'deploy_selected']
    
    def make_public(self, request, queryset):
        """Action to make cases public"""
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} cases made public.')
    make_public.short_description = 'Make selected cases public'
    
    def make_private(self, request, queryset):
        """Action to make cases private"""
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} cases made private.')
    make_private.short_description = 'Make selected cases private'
    
    def deploy_selected(self, request, queryset):
        """Action to deploy selected cases"""
        for case in queryset:
            if case.subdomain or case.custom_domain:
                case.deployment_status = 'deploying'
                case.save()
                # TODO: Trigger actual deployment
        self.message_user(request, f'Deployment initiated for selected cases.')
    deploy_selected.short_description = 'Deploy selected cases'


@admin.register(SpotlightPost)
class SpotlightPostAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'case',
        'status',
        'published_at',
        'is_pinned',
        'view_count',
        'created_at'
    )
    list_filter = (
        'status',
        'is_pinned',
        'published_at',
        'created_at'
    )
    search_fields = (
        'title',
        'content',
        'excerpt',
        'case__case_title'
    )
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Post Information', {
            'fields': (
                'case',
                'title',
                'slug',
                'excerpt',
                'content'
            )
        }),
        ('Media', {
            'fields': (
                'featured_image',
                'image_gallery'
            )
        }),
        ('Publishing', {
            'fields': (
                'status',
                ('published_at', 'scheduled_for'),
                'is_pinned',
                'view_count'
            )
        }),
        ('SEO', {
            'fields': ('meta_description',),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('view_count', 'published_at')


@admin.register(TemplateRegistry)
class TemplateRegistryAdmin(admin.ModelAdmin):
    list_display = (
        'template_id',
        'name',
        'version',
        'is_active',
        'is_premium',
        'created_at'
    )
    list_filter = (
        'is_active',
        'is_premium',
        'created_at'
    )
    search_fields = (
        'template_id',
        'name',
        'description'
    )
    
    fieldsets = (
        ('Template Information', {
            'fields': (
                'template_id',
                'name',
                'description',
                'version'
            )
        }),
        ('Configuration', {
            'fields': (
                'schema',
                'components',
                'features'
            )
        }),
        ('Images', {
            'fields': (
                'preview_image',
                'thumbnail_image'
            )
        }),
        ('Settings', {
            'fields': (
                'is_active',
                'is_premium'
            )
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CasePhoto)
class CasePhotoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'case',
        'caption',
        'is_public',
        'order',
        'uploaded_at',
        'thumbnail'
    )
    list_filter = (
        'is_public',
        'uploaded_at'
    )
    search_fields = (
        'caption',
        'case__case_title'
    )
    list_editable = ('order', 'is_public')
    
    def thumbnail(self, obj):
        """Show thumbnail of the image"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    thumbnail.short_description = 'Preview'


@admin.register(DeploymentLog)
class DeploymentLogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'case',
        'action',
        'status',
        'started_at',
        'completed_at',
        'duration_seconds',
        'status_badge'
    )
    list_filter = (
        'status',
        'action',
        'started_at'
    )
    search_fields = (
        'case__case_title',
        'error_message',
        'render_deploy_id'
    )
    date_hierarchy = 'started_at'
    
    fieldsets = (
        ('Deployment Information', {
            'fields': (
                'case',
                'action',
                'status',
                'render_deploy_id'
            )
        }),
        ('Timing', {
            'fields': (
                'started_at',
                'completed_at',
                'duration_seconds'
            )
        }),
        ('Details', {
            'fields': (
                'details',
                'error_message'
            )
        })
    )
    
    readonly_fields = (
        'started_at',
        'completed_at',
        'duration_seconds'
    )
    
    def status_badge(self, obj):
        """Show status with color coding"""
        colors = {
            'success': 'green',
            'failed': 'red',
            'started': 'blue',
            'in_progress': 'orange'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        """Deployment logs should not be manually created"""
        return False


# Customize admin site header and title
admin.site.site_header = "Case Closure Admin"
admin.site.site_title = "Case Closure"
admin.site.index_title = "Welcome to Case Closure Administration"