from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_completed', 'created_at']   # columns shown in the list
    list_filter  = ['is_completed']                   # filter sidebar
    search_fields = ['title']                         # search bar
    list_editable = ['is_completed']                  # toggle directly from the list