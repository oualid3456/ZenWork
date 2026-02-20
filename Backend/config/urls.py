from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("psychobot/", include("psychobot.urls", namespace="psychobot")),
    path("api/", include("rh_management.urls")),
]
