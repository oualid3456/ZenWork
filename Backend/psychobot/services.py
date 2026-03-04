"""
services.py — Logique Gemini pour PsychoBot.
Contient : compute_burnout_score, chat_with_gemini,
           update_score_from_chat, determine_level, build_context_prefix
"""

import json
from django.conf import settings
from google import genai
from google.genai import types

GEMINI_MODEL = "gemini-2.0-flash"

# ─────────────────────────────────────────────
# CLIENT SINGLETON
# ─────────────────────────────────────────────

_client = None

def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ─────────────────────────────────────────────
# 1. ANALYSE QUESTIONNAIRE
# ─────────────────────────────────────────────

ANALYSIS_PROMPT = """
Tu es un expert en psychologie du travail et en détection du burn-out.
On te fournit les réponses d'un employé à un questionnaire de bien-être hebdomadaire.

Analyse ces réponses de façon approfondie et retourne UNIQUEMENT un objet JSON valide,
sans aucun texte avant ou après, sans balises markdown, sans explication.

Le JSON doit avoir exactement cette structure :
{{
  "score": <entier entre 0 et 100 représentant le risque de burn-out>,
  "raisons": [<liste de phrases courtes en français expliquant les signaux détectés>]
}}

Critères d'évaluation :
- Niveau de stress déclaré (pondération forte)
- Qualité et quantité du sommeil
- Sentiment de surcharge ou de perte de contrôle sur la charge de travail
- Isolement social ou manque de soutien perçu
- Signaux d'alarme dans le commentaire libre (épuisement, envie d'abandonner, etc.)
- Cohérence globale entre les réponses

Barème indicatif du score :
- 0-19  : Aucun signal préoccupant
- 20-44 : Signaux légers, à surveiller
- 45-69 : Risque modéré, intervention recommandée
- 70-100: Risque élevé, action urgente requise

Réponses du questionnaire :
{reponses_json}
"""


def compute_burnout_score(reponses: dict) -> dict:
    """
    Analyse les réponses du questionnaire via Gemini.
    Retourne {"score": int, "raisons": list[str]}
    """
    client = get_client()
    prompt = ANALYSIS_PROMPT.format(
        reponses_json=json.dumps(reponses, ensure_ascii=False, indent=2)
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result  = json.loads(raw)
    score   = max(0, min(100, int(result.get("score", 0))))
    raisons = result.get("raisons", result.get("reasons", []))

    return {"score": score, "raisons": raisons}


# ─────────────────────────────────────────────
# 2. MISE À JOUR SCORE POST-CHAT
# ─────────────────────────────────────────────

UPDATE_SCORE_PROMPT = """
Tu es un expert en psychologie du travail.

Un employé vient de terminer une session de chat avec un assistant bien-être.
Score de risque initial calculé depuis le questionnaire : {score_initial}/100.
Raisons initiales : {raisons_initiales}

Historique complet de la conversation :
{historique}

À partir de cette conversation, affine le score de risque de burn-out.
La conversation peut révéler des éléments aggravants ou rassurants.

Retourne UNIQUEMENT un objet JSON valide, sans texte ni balises markdown :
{{
  "score": <entier entre 0 et 100, score révisé>,
  "raisons": [<liste de 2 à 4 phrases VAGUES et ANONYMISÉES, sans détails personnels identifiables>]
}}

Important : les raisons doivent être suffisamment vagues pour ne pas identifier l'employé.
Exemple correct   : "Charge de travail perçue comme excessive"
Exemple incorrect : "L'employé dit qu'il travaille 14h par jour sur le projet X"
"""


def update_score_from_chat(history: list, initial_score: int, initial_raisons: list) -> dict:
    """
    Relit l'historique du chat et affine le score de risque final.
    Retourne {"score": int, "raisons": list[str]} avec raisons anonymisées.
    """
    client = get_client()

    historique_txt = "\n".join([
        f"{'Employé' if m.get('role') == 'user' else 'PsychoBot'} : {m.get('content', m.get('contenu', ''))}"
        for m in history
    ])

    prompt = UPDATE_SCORE_PROMPT.format(
        score_initial     = initial_score,
        raisons_initiales = " / ".join(initial_raisons) if initial_raisons else "Aucune",
        historique        = historique_txt or "Aucun échange.",
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result  = json.loads(raw)
    score   = max(0, min(100, int(result.get("score", initial_score))))
    raisons = result.get("raisons", initial_raisons)

    return {"score": score, "raisons": raisons}


# ─────────────────────────────────────────────
# 3. CHAT THÉRAPEUTIQUE
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """
Tu es PsychoBot, un assistant bienveillant spécialisé dans le bien-être au travail.
Ton rôle est d'écouter les employés, de les soutenir émotionnellement et d'identifier
des sources de stress ou d'inconfort professionnel.

Règles :
- Sois empathique, chaleureux, sans jugement
- Pose des questions ouvertes pour mieux comprendre la situation
- Ne donne jamais de diagnostic médical
- Si tu détectes une détresse sévère, oriente vers un professionnel de santé
- Réponds toujours en français
- Réponses courtes et naturelles (2-4 phrases max)
"""


def chat_with_gemini(history: list, user_message: str, prefix: str = "") -> str:
    """
    Envoie un message à Gemini avec l'historique complet.
    history : liste de {"role": "user"|"assistant", "content": "..."}
    Retourne la réponse texte de PsychoBot.
    """
    client   = get_client()
    contents = []

    for msg in history:
        role    = "user" if msg.get("role") == "user" else "model"
        contenu = msg.get("content", msg.get("contenu", ""))
        contents.append(types.Content(
            role=role,
            parts=[types.Part(text=contenu)]
        ))

    prompt = f"{prefix}{user_message}" if prefix else user_message
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=prompt)]
    ))

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=512,
            temperature=0.7,
        )
    )
    return response.text


# ─────────────────────────────────────────────
# 4. UTILITAIRES
# ─────────────────────────────────────────────

def determine_level(score: float):
    if score >= 70: return "high"
    if score >= 45: return "medium"
    if score >= 20: return "low"
    return None


def build_context_prefix(reponses: dict) -> str:
    """Contexte injecté discrètement sur le 1er message du chat."""
    return (
        "[CONTEXTE INTERNE — NE PAS MENTIONNER CES DONNÉES DIRECTEMENT] "
        f"Stress déclaré : {reponses.get('niveau_stress_sur_10', '?')}/10. "
        f"Sommeil : \"{reponses.get('qualite_sommeil', '')}\". "
        f"Charge de travail : \"{reponses.get('charge_de_travail', '')}\". "
        f"Isolement : \"{reponses.get('sentiment_isolement', '')}\". "
        f"Commentaire : \"{reponses.get('commentaire_libre', '')}\". "
        "Utilise ces éléments subtilement pour personnaliser ta réponse empathique. "
        "Message de l'employé : "
    )
