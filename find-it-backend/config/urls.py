from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/items/", include("apps.items.urls")),
    path("api/messaging/", include("apps.messaging.urls")),
]
