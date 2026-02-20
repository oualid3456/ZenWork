from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Leave, Schedule, Profile, DemandeChangement, Planning
from .serializers import (
    LeaveSerializer,
    ScheduleSerializer,
    ProfileSerializer,
    DemandeChangementSerializer,
    PlanningSerializer,
)


# ViewSets pour SQLite (Leave & Schedule)
class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


# ViewSets pour PostgreSQL (Profile, DemandeChangement, Planning)
class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class DemandeChangementViewSet(viewsets.ModelViewSet):
    queryset = DemandeChangement.objects.all()
    serializer_class = DemandeChangementSerializer

    @action(detail=True, methods=["post"])
    def accepter(self, request, pk=None):
        demande = self.get_object()
        valideur_id = request.data.get("valide_par")

        demande.statut = "ACCEPTEE"
        demande.valide_par_id = valideur_id
        demande.date_traitement = timezone.now()
        demande.save()

        return Response({"status": "Demande acceptée"})

    @action(detail=True, methods=["post"])
    def refuser(self, request, pk=None):
        demande = self.get_object()
        valideur_id = request.data.get("valide_par")

        demande.statut = "REFUSEE"
        demande.valide_par_id = valideur_id
        demande.date_traitement = timezone.now()
        demande.save()

        return Response({"status": "Demande refusée"})


class PlanningViewSet(viewsets.ModelViewSet):
    queryset = Planning.objects.all()
    serializer_class = PlanningSerializer
