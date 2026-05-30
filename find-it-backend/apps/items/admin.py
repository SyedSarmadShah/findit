from django.contrib import admin

from .models import Item, ItemClaim


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("title", "item_type", "status", "owner", "created_at")
    list_filter = ("item_type", "status", "created_at")
    search_fields = ("title", "description", "category", "location")


@admin.register(ItemClaim)
class ItemClaimAdmin(admin.ModelAdmin):
    list_display = ("item", "claimant", "finder", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("item__title", "claimant__email", "finder__email")
