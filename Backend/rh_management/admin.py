from django.contrib import admin
from .models import Profile, DemandeChangement, Planning, Leave, Schedule

admin.site.site_header = "Gestion RH - Administration"


@admin.register(DemandeChangement)
class DemandeChangementAdmin(admin.ModelAdmin):
    list_display = ("id", "utilisateur", "type_demande", "statut", "created_at")
    list_filter = ("statut", "type_demande")
    search_fields = ("utilisateur__id",)


@admin.register(Planning)
class PlanningAdmin(admin.ModelAdmin):
    list_display = ("id", "utilisateur", "date_debut", "date_fin")
    search_fields = ("utilisateur__id",)


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    # Colonnes du tableau (on utilise les champs sûrs)
    list_display = ("user", "type", "start_date", "status")
    # Filtres sur le côté
    list_filter = ("status", "type")
    # Barre de recherche
    search_fields = ("user__username",)


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    # Colonnes du tableau pour le planning
    list_display = ("user", "start_time", "end_time")
    # Barre de recherche
    search_fields = ("user__username",)
