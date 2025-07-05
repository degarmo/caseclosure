from django.contrib import admin
from .models import Tip

@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):
    list_display = ['victim','anonymous','created_at','approved']
    list_filter  = ['approved','anonymous']
    actions      = ['mark_approved']

    def mark_approved(self, request, queryset):
        queryset.update(approved=True)
    mark_approved.short_description = "Approve selected tips"
