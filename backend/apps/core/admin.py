from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    list_display = ['email', 'username', 'native_language', 'target_language', 'is_staff']
    list_filter = ['is_staff', 'is_superuser', 'native_language', 'target_language']
    search_fields = ['email', 'username']
    ordering = ['-date_joined']
