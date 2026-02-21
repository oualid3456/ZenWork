import json
from datetime import date, timedelta

from .supabase_auth import supabase_login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.utils.decorators import method_decorator

from .models import QuestionnaireReponse, AlerteBurnout, SessionChat, MessageChat
from .gemini_service import (
    analyser_questionnaire,
    determine_niveau,
    build_context_prefix,
    envoyer_message,
)


def lundi_semaine_courante() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


# ─────────────────────────────────────────────
# QUESTIONNAIRE
# ─────────────────────────────────────────────

@csrf_exempt
@supabase_login_required
@require_POST
def soumettre_questionnaire(request):
    """
    POST /psychobot/questionnaire/
    Body JSON :
    {
      "niveau_stress_sur_10": 8,
      "qualite_sommeil": "...",
      "charge_de_travail": "...",
      "sentiment_isolement": "...",
      "commentaire_libre": "..."
    }
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"erreur": "JSON invalide."}, status=400)

    semaine = lundi_semaine_courante()

    if QuestionnaireReponse.objects.filter(employe=request.user, semaine=semaine).exists():
        return JsonResponse(
            {"erreur": "Questionnaire déjà soumis cette semaine."},
            status=400
        )

    # Validation champs obligatoires
    champs = ["niveau_stress_sur_10", "qualite_sommeil", "charge_de_travail", "sentiment_isolement"]
    for champ in champs:
        if champ not in data:
            return JsonResponse({"erreur": f"Champ manquant : {champ}"}, status=400)

    q = QuestionnaireReponse.objects.create(
        employe              = request.user,
        employe_id_ext       = data.get("employe_id", ""),
        departement          = data.get("departement", ""),
        date_soumission      = date.today(),
        semaine              = semaine,
        niveau_stress_sur_10 = data["niveau_stress_sur_10"],
        qualite_sommeil      = data["qualite_sommeil"],
        charge_de_travail    = data["charge_de_travail"],
        sentiment_isolement  = data["sentiment_isolement"],
        commentaire_libre    = data.get("commentaire_libre", ""),
    )

    # Analyse Gemini immédiate
    try:
        reponses = q.to_reponses_dict()
        resultat = analyser_questionnaire(reponses)
        niveau   = determine_niveau(resultat["score"])

        if niveau:
            AlerteBurnout.objects.create(
                questionnaire = q,
                niveau        = niveau,
                score         = resultat["score"],
                raisons       = resultat["raisons"],
            )

        return JsonResponse({
            "message":  "Questionnaire soumis et analysé.",
            "score":    resultat["score"],
            "niveau":   niveau,
            "raisons":  resultat["raisons"],
        }, status=201)

    except Exception as e:
        return JsonResponse({
            "message": "Questionnaire soumis. Analyse IA échouée.",
            "erreur":  str(e),
        }, status=201)


# ─────────────────────────────────────────────
# ALERTES (vue RH)
# ─────────────────────────────────────────────

@supabase_login_required
@require_GET
def liste_alertes(request):
    """
    GET /psychobot/alertes/
    Retourne toutes les alertes + exporte alerts_output.json
    """
    alertes = AlerteBurnout.objects.select_related(
        "questionnaire", "questionnaire__employe"
    ).all()

    data = []
    for a in alertes:
        data.append({
            "employe_id":  a.questionnaire.employe.username,
            "departement": a.questionnaire.departement,
            "date":        a.questionnaire.date_soumission.isoformat(),
            "niveau":      a.niveau,
            "score":       a.score,
            "raisons":     a.raisons,
            "analyse_le":  a.analyse_le.isoformat(),
        })

    # Export fichier JSON (comme la version console)
    _exporter_alertes_json(data)

    return JsonResponse({
        "total_alertes": len(data),
        "alertes":       data,
    })


def _exporter_alertes_json(alertes: list):
    from django.conf import settings
    import os
    from datetime import datetime

    output = {
        "exporte_le":    datetime.now().isoformat(),
        "total_alertes": len(alertes),
        "alertes":       alertes,
    }
    path = os.path.join(settings.BASE_DIR, "alerts_output.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────

@csrf_exempt
@supabase_login_required
@require_POST
def demarrer_session(request):
    """
    POST /psychobot/chat/demarrer/
    Crée une session et retourne le message de bienvenue de PsychoBot.
    """
    semaine = lundi_semaine_courante()
    questionnaire = QuestionnaireReponse.objects.filter(
        employe=request.user, semaine=semaine
    ).first()

    session = SessionChat.objects.create(
        employe       = request.user,
        questionnaire = questionnaire,
    )

    bienvenue = (
        "Bonjour ! J'ai pris connaissance de votre questionnaire de cette semaine. "
        "Comment vous sentez-vous en ce moment ?"
        if questionnaire else
        "Bonjour ! Je suis PsychoBot. Comment vous sentez-vous aujourd'hui ?"
    )

    MessageChat.objects.create(session=session, role="assistant", contenu=bienvenue)

    return JsonResponse({
        "session_id": session.id,
        "message":    bienvenue,
    }, status=201)


@csrf_exempt
@supabase_login_required
@require_POST
def envoyer_message_chat(request, session_id):
    """
    POST /psychobot/chat/<session_id>/
    Body JSON : {"message": "..."}
    """
    try:
        session = SessionChat.objects.get(id=session_id, employe=request.user, active=True)
    except SessionChat.DoesNotExist:
        return JsonResponse({"erreur": "Session introuvable."}, status=404)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"erreur": "JSON invalide."}, status=400)

    message_user = data.get("message", "").strip()
    if not message_user:
        return JsonResponse({"erreur": "Message vide."}, status=400)

    # Sauvegarde message utilisateur
    MessageChat.objects.create(session=session, role="user", contenu=message_user)

    # Historique existant (sans le message qu'on vient d'ajouter)
    historique = list(
        session.messages.order_by("timestamp")
               .values("role", "contenu")[:-1]
    )

    # Contexte questionnaire injecté uniquement sur le 1er message utilisateur
    premier_message_user = not any(m["role"] == "user" for m in historique)
    context_prefix = ""
    if premier_message_user and session.questionnaire:
        context_prefix = build_context_prefix(session.questionnaire.to_reponses_dict())

    try:
        reponse_bot = envoyer_message(historique, message_user, context_prefix)
    except Exception as e:
        return JsonResponse({"erreur": f"Erreur Gemini : {e}"}, status=500)

    MessageChat.objects.create(session=session, role="assistant", contenu=reponse_bot)

    return JsonResponse({"reponse": reponse_bot})


@supabase_login_required
@require_GET
def historique_chat(request, session_id):
    """
    GET /psychobot/chat/<session_id>/historique/
    """
    try:
        session = SessionChat.objects.get(id=session_id, employe=request.user)
    except SessionChat.DoesNotExist:
        return JsonResponse({"erreur": "Session introuvable."}, status=404)

    messages = list(
        session.messages.order_by("timestamp").values("role", "contenu", "timestamp")
    )
    return JsonResponse({"messages": messages})
