from rest_framework import serializers
from .models import Leave, Schedule, Profile, DemandeChangement, Planning


# Serializers pour SQLite (Leave & Schedule)
class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = "__all__"


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = "__all__"


# Serializers pour PostgreSQL (Profile, DemandeChangement, Planning)
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["id"]


class DemandeChangementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeChangement
        fields = "__all__"


class PlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planning
        fields = "__all__"
