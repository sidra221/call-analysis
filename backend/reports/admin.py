from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('report_type', 'created_by', 'from_date', 'to_date', 'created_at')
    list_filter = ('report_type', 'created_at')

