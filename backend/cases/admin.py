from django.contrib import admin
from .models import Case

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'victim_name', 'name', 'incident_date',
        'reward_amount', 'is_public', 'domain_status', 'is_disabled'
    )
    list_filter = ('is_public', 'is_disabled', 'domain_status')
    search_fields = ('victim_name', 'name', 'case_number', 'description')
