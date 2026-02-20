from rest_framework import viewsets
from .models import Leave, Schedule, DemandeEmploiDuTemps
from .serializers import (
    LeaveSerializer,
    ScheduleSerializer,
    DemandeEmploiDuTempsSerializer,
)


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


class DemandeEmploiDuTempsViewSet(viewsets.ModelViewSet):
    queryset = DemandeEmploiDuTemps.objects.all()
    serializer_class = DemandeEmploiDuTempsSerializer
