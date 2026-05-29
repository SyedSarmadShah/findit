from django.contrib import admin

from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("title", "item_type", "status", "owner", "created_at")
    list_filter = ("item_type", "status", "created_at")
    search_fields = ("title", "description", "category", "location")
