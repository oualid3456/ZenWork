from rest_framework import serializers
from .models import Leave, Schedule, DemandeEmploiDuTemps


class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"


class DemandeEmploiDuTempsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeEmploiDuTemps
        fields = "__all__"
