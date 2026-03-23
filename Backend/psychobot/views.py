import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import connection
 
from .services import (
    compute_burnout_score,
    chat_with_gemini,
    update_score_from_chat,
    determine_level,
    build_context_prefix,
    generate_commentaire_rh,
)
 
# ─────────────────────────────────────────────
# REQUÊTES SQL SUPABASE
# ─────────────────────────────────────────────
 
def _get_reponses_questionnaire(questionnaire_id):
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT reponse_json FROM reponse_questionnaire WHERE id = %s",
            [questionnaire_id]
        )
        row = cursor.fetchone()
        return row[0] if row else None
 
 
def _upsert_alerte_burnout(questionnaire_id, niveau, score, raisons):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO psychobot_alerteburnout (questionnaire_id, niveau, score, raisons, analyse_le)
            VALUES (%s, %s, %s, %s::jsonb, NOW())
            ON CONFLICT (questionnaire_id)
            DO UPDATE SET
                niveau     = EXCLUDED.niveau,
                score      = EXCLUDED.score,
                raisons    = EXCLUDED.raisons,
                analyse_le = NOW()
            RETURNING id
            """,
            [questionnaire_id, niveau, score, json.dumps(raisons)]
        )
        return cursor.fetchone()[0]
 
 
def _insert_session_ia(utilisateur_id, score_risque, resume_anonymise=None):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO session_ia (utilisateur_id, score_risque, resume_anonymise)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            [utilisateur_id, score_risque, resume_anonymise]
        )
        return cursor.fetchone()[0]
 
 
# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
 
@csrf_exempt
@require_POST
def analyze_questionnaire(request):
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié"}, status=401)
 
    if not utilisateur_id:
        return JsonResponse({"error": "Non authentifié"}, status=401)
 
    data             = json.loads(request.body)
    questionnaire_id = data.get("questionnaire_id")
 
    if not questionnaire_id:
        return JsonResponse({"error": "questionnaire_id manquant"}, status=400)
 
    reponses = _get_reponses_questionnaire(questionnaire_id)
    if not reponses:
        return JsonResponse({"error": "Questionnaire introuvable en BDD"}, status=404)
 
    result            = compute_burnout_score(reponses)
    score_initial     = result["score"]
    niveau_initial    = determine_level(score_initial)
    raisons_initiales = result["raisons"]
 
    alerte_id = _upsert_alerte_burnout(questionnaire_id, niveau_initial, score_initial, raisons_initiales)
 
    return JsonResponse({
        "alerte_id":     alerte_id,
        "score_initial": score_initial,
        "niveau":        niveau_initial,
        "raisons":       raisons_initiales
    })
 
 
@csrf_exempt
@require_POST
def send_chat_message(request):
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié"}, status=401)
 
    if not utilisateur_id:
        return JsonResponse({"error": "Non authentifié"}, status=401)
 
    data             = json.loads(request.body)
    history          = data.get("history", [])
    user_message     = data.get("message", "")
    questionnaire_id = data.get("questionnaire_id")
 
    prefix = ""
    if len(history) == 1 and questionnaire_id:
        reponses = _get_reponses_questionnaire(questionnaire_id)
        if reponses:
            prefix = build_context_prefix(reponses)
 
    bot_response = chat_with_gemini(history, user_message, prefix)
 
    return JsonResponse({"response": bot_response})
 
@csrf_exempt
@require_POST
def close_chat_session(request):
    try:
        utilisateur_id = request.supabase_user_id
    except AttributeError:
        return JsonResponse({"error": "Non authentifié"}, status=401)

    if not utilisateur_id:
        return JsonResponse({"error": "Non authentifié"}, status=401)

    try:
        data            = json.loads(request.body)
        history         = data.get("history", [])
        initial_score   = data.get("score_initial", 0)
        initial_raisons = data.get("raisons_initiales", [])

        new_data        = update_score_from_chat(history, initial_score, initial_raisons)
        score_final     = new_data["score"]
        raisons_finales = new_data["raisons"]
        niveau_final    = determine_level(score_final)
        resume          = " | ".join(raisons_finales) if raisons_finales else "Aucun signal."

        print(f">>> score_final : {score_final}")

        # Stocke dans session_ia
        _insert_session_ia(utilisateur_id, score_final, resume)

        # Si score dépasse 60 → alerte dans psychobot_alerteburnout
        if score_final >= 60:
            commentaire = generate_commentaire_rh(score_final, raisons_finales)
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO alerte_burnout (utilisateur_id, statut, commentaire_rh)
                    VALUES (%s, 'NOUVEAU', %s)
                    """,
                    [utilisateur_id, commentaire]
        )
        return JsonResponse({
            "status":       "Session clôturée",
            "score_final":  score_final,
            "niveau_final": niveau_final,
            "raisons":      raisons_finales,
        })

    except Exception as e:
        print(f">>> Erreur : {e}")
        return JsonResponse({"error": str(e)}, status=500)