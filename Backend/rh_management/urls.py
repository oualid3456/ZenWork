from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeaveViewSet,
    ScheduleViewSet,
    ProfileViewSet,
    DemandeChangementViewSet,
    PlanningViewSet,
)

router = DefaultRouter()
# SQLite
router.register("leaves", LeaveViewSet)
router.register("schedules", ScheduleViewSet)
# PostgreSQL
router.register("profiles", ProfileViewSet)
router.register("demandes", DemandeChangementViewSet)
router.register("plannings", PlanningViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
