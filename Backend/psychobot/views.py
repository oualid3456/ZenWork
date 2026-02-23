import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import connection

# Import de tes services IA (les fonctions Gemini du fichier services.py)
from .services import (
    compute_burnout_score, 
    chat_with_gemini, 
    update_score_from_chat, 
    determine_level,
    build_context_prefix
)

# ─────────────────────────────────────────────
# 1) REQUÊTES SQL SUPABASE (LECTURE / ÉCRITURE)
# ─────────────────────────────────────────────

def _get_reponses_questionnaire(questionnaire_id):
    """Va chercher les réponses de l'employé directement dans la table psychobot_questionnaireresponse."""
    with connection.cursor() as cursor:
        # Note : adapte la clause WHERE selon comment est lié ton questionnaire_id à cette table
        cursor.execute(
            """
            SELECT niveau_stress_sur_10, qualite_sommeil, charge_de_travail, 
                   sentiment_isolement, commentaire_libre
            FROM psychobot_questionnaireresponse
            WHERE id = %s 
            """,
            [questionnaire_id]
        )
        row = cursor.fetchone()
        if row:
            return {
                "niveau_stress_sur_10": row[0],
                "qualite_sommeil": row[1],
                "charge_de_travail": row[2],
                "sentiment_isolement": row[3],
                "commentaire_libre": row[4]
            }
        return None

def _upsert_alerte_burnout(questionnaire_id, niveau, score, raisons):
    """
    Insère l'alerte dans psychobot_alerteburnout. 
    On utilise un ON CONFLICT pour mettre à jour si l'alerte existe déjà (ex: après le chat).
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO psychobot_alerteburnout (questionnaire_id, niveau, score, raisons, analyse_le)
            VALUES (%s, %s, %s, %s::jsonb, NOW())
            ON CONFLICT (questionnaire_id) 
            DO UPDATE SET 
                niveau = EXCLUDED.niveau,
                score = EXCLUDED.score,
                raisons = EXCLUDED.raisons,
                analyse_le = NOW()
            RETURNING id;
            """,
            [questionnaire_id, niveau, score, json.dumps(raisons)]
        )
        return cursor.fetchone()[0]


# ─────────────────────────────────────────────
# 2) VUES / ENDPOINTS API POUR LE FRONTEND
# ─────────────────────────────────────────────

@csrf_exempt
@require_POST
def analyze_questionnaire(request):
    """
    Déclenché par le front après soumission du questionnaire.
    1. Lit l'ID du questionnaire.
    2. Récupère les données en BDD.
    3. Calcule le score IA initial et génère l'alerte en BDD.
    """
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié (supabase_user_id manquant)"}, status=401)

    data = json.loads(request.body)
    questionnaire_id = data.get("questionnaire_id")

    if not questionnaire_id:
        return JsonResponse({"error": "questionnaire_id manquant"}, status=400)

    # 1. Lecture en base de données
    reponses = _get_reponses_questionnaire(questionnaire_id)
    if not reponses:
        return JsonResponse({"error": "Questionnaire introuvable en BDD"}, status=404)

    # 2. Analyse IA avec Gemini
    result = compute_burnout_score(reponses)
    score_initial = result["score"]
    niveau_initial = determine_level(score_initial)
    raisons_initiales = result["raisons"]

    # 3. Sauvegarde immédiate de l'alerte initiale
    alerte_id = _upsert_alerte_burnout(questionnaire_id, niveau_initial, score_initial, raisons_initiales)
    
    return JsonResponse({
        "alerte_id": alerte_id,
        "score_initial": score_initial,
        "niveau": niveau_initial,
        "raisons": raisons_initiales
    })


@csrf_exempt
@require_POST
def send_chat_message(request):
    """Gère l'échange en temps réel avec Gemini."""
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié"}, status=401)

    data = json.loads(request.body)
    history = data.get("history", [])
    user_message = data.get("message", "")
    questionnaire_id = data.get("questionnaire_id")
    
    prefix = ""
    # Injecte le contexte caché de la BDD pour le TOUT PREMIER message du chat
    if len(history) == 1 and questionnaire_id:
        reponses = _get_reponses_questionnaire(questionnaire_id)
        if reponses:
            prefix = build_context_prefix(reponses)
    
    bot_response = chat_with_gemini(history, user_message, prefix)
    
    return JsonResponse({"response": bot_response})


@csrf_exempt
@require_POST
def close_chat_session(request):
    """
    À la fin du chat :
    1. Reçoit l'historique complet.
    2. Met à jour le score (en rendant les raisons vagues/anonymes).
    3. Met à jour la table psychobot_alerteburnout.
    """
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié"}, status=401)

    data = json.loads(request.body)
    history = data.get("history", [])
    questionnaire_id = data.get("questionnaire_id")
    initial_score = data.get("score_initial", 0)
    initial_raisons = data.get("raisons_initiales", [])

    if not questionnaire_id:
        return JsonResponse({"error": "questionnaire_id manquant"}, status=400)

    # Analyse de la conversation pour anonymiser et ajuster le score
    new_data = update_score_from_chat(history, initial_score, initial_raisons)
    score_final = new_data["score"]
    raisons_vagues = new_data["raisons"] 
    niveau_final = determine_level(score_final)

    # Mise à jour de l'alerte en BDD avec le nouveau score et les raisons vagues
    _upsert_alerte_burnout(questionnaire_id, niveau_final, score_final, raisons_vagues)

    return JsonResponse({
        "status": "Session clôturée et base mise à jour",
        "score_final": score_final,
        "niveau_final": niveau_final,
        "raisons_anonymisees": raisons_vagues
    })