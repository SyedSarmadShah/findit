from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ("email",)
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    search_fields = ("email", "full_name")
    fieldsets = DjangoUserAdmin.fieldsets + (("Profile", {"fields": ("full_name", "role")}),)
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (("Profile", {"fields": ("full_name", "role")}),)
