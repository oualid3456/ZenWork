from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveViewSet, ScheduleViewSet, DemandeEmploiDuTempsViewSet

router = DefaultRouter()
router.register("leaves", LeaveViewSet)
router.register("schedules", ScheduleViewSet)
router.register("demandes-changement-horaire", DemandeEmploiDuTempsViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
