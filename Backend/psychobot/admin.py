from django.contrib import admin
from .models import QuestionnaireReponse, AlerteBurnout, SessionChat, MessageChat


@admin.register(QuestionnaireReponse)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display  = ("employe", "departement", "date_soumission", "niveau_stress_sur_10", "semaine")
    list_filter   = ("departement", "semaine")
    search_fields = ("employe__username", "employe_id_ext")
    ordering      = ("-date_soumission",)


@admin.register(AlerteBurnout)
class AlerteAdmin(admin.ModelAdmin):
    list_display  = ("get_employe", "niveau", "score", "analyse_le")
    list_filter   = ("niveau",)
    ordering      = ("-analyse_le",)

    @admin.display(description="Employé")
    def get_employe(self, obj):
        return obj.questionnaire.employe.username


@admin.register(SessionChat)
class SessionChatAdmin(admin.ModelAdmin):
    list_display = ("employe", "created_at", "active")
    list_filter  = ("active",)


@admin.register(MessageChat)
class MessageChatAdmin(admin.ModelAdmin):
    list_display = ("session", "role", "timestamp")
    list_filter  = ("role",)
