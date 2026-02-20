from django.urls import path
from . import views

app_name = "psychobot"

urlpatterns = [
    # Questionnaire
    path("questionnaire/",          views.soumettre_questionnaire, name="soumettre_questionnaire"),

    # Alertes (vue RH)
    path("alertes/",                views.liste_alertes,           name="liste_alertes"),

    # Chat
    path("chat/demarrer/",          views.demarrer_session,        name="demarrer_session"),
    path("chat/<int:session_id>/",  views.envoyer_message_chat,    name="envoyer_message_chat"),
    path("chat/<int:session_id>/historique/", views.historique_chat, name="historique_chat"),
]
