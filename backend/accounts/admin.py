# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUser, AccountRequest, UserProfile

# Custom User Admin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'first_name', 'last_name', 'phone_verified', 'account_type']
    list_filter = ['account_type', 'phone_verified']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Contact Info', {'fields': ('phone', 'phone_verified')}),
        ('Verification', {'fields': ('account_type', 'city', 'state')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )
    
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

# Account Request Admin
@admin.register(AccountRequest)
class AccountRequestAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 
        'email', 
        'phone', 
        'status', 
        'submitted_at',
        'quick_actions'
    ]
    list_filter = ['status', 'submitted_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    readonly_fields = ['submitted_at', 'verification_code']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'description')
        }),
        ('Verification', {
            'fields': ('supporting_links',)
        }),
        ('Status', {
            'fields': ('status', 'rejection_reason', 'submitted_at', 'reviewed_at', 'reviewed_by')
        }),
        ('Verification Code', {
            'fields': ('verification_code', 'verification_sent_at'),
            'classes': ('collapse',)
        })
    )
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Name'
    
    def quick_actions(self, obj):
        if obj.status == 'pending':
            return 'Awaiting Review'
        elif obj.status == 'approved':
            return '✅ Approved'
        elif obj.status == 'rejected':
            return '❌ Rejected'
        return obj.status
    quick_actions.short_description = 'Quick Status'
    
    actions = ['approve_and_notify', 'reject_with_reason']
    
    def approve_and_notify(self, request, queryset):
        """Approve selected requests and send notification"""
        approved_count = 0
        
        for account_request in queryset.filter(status='pending'):
            account_request.status = 'approved'
            account_request.reviewed_by = request.user
            account_request.reviewed_at = timezone.now()
            account_request.save()
            
            # Send approval email
            send_mail(
                subject='CaseClosure Account Approved - Action Required',
                message=f"""
Hello {account_request.first_name},

Your CaseClosure account request has been approved!

Next Steps:
1. Visit: {settings.SITE_URL}/verify-account/
2. Enter your email: {account_request.email}
3. We'll text a verification code to: {account_request.phone}
4. Create your password and complete setup

This link expires in 48 hours.

If you have questions, reply to this email.

Thank you for trusting CaseClosure with your case.

The CaseClosure Team
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[account_request.email],
                fail_silently=False,
            )
            
            approved_count += 1
        
        self.message_user(
            request, 
            f"✅ {approved_count} account(s) approved and notified"
        )
    
    approve_and_notify.short_description = "✅ Approve and send notification email"
    
    def reject_with_reason(self, request, queryset):
        """Reject with a reason"""
        rejected_count = queryset.filter(status='pending').update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
            rejection_reason='Does not meet verification requirements'
        )
        
        self.message_user(
            request,
            f"❌ {rejected_count} account(s) rejected"
        )
    
    reject_with_reason.short_description = "❌ Reject selected requests"

# User Profile Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user_email',
        'get_display_name',  # Changed from 'display_name' to 'get_display_name'
        'account_type',
        'phone_verified',
        'current_cases',
        'created_at'
    ]
    list_filter = ['account_type', 'phone_verified', 'identity_verified']
    search_fields = ['user__email', 'phone', 'user__first_name', 'user__last_name']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    
    def get_display_name(self, obj):
        """Get display name for the admin list"""
        if hasattr(obj, 'display_name'):
            return obj.display_name
        elif obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username or obj.user.email
    get_display_name.short_description = 'Display Name'