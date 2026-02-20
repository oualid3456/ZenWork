"""
Service Gemini pour PsychoBot.
Contient l'analyse burn-out ET le chat thérapeutique.
"""

import json
from django.conf import settings
from google import genai
from google.genai import types

GEMINI_MODEL = "gemini-2.0-flash"

# ─────────────────────────────────────────────
# CLIENT SINGLETON
# ─────────────────────────────────────────────

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ─────────────────────────────────────────────
# ANALYSE BURN-OUT
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


def analyser_questionnaire(reponses: dict) -> dict:
    """
    Envoie les réponses à Gemini et retourne {"score": int, "raisons": list[str]}.
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

    # Nettoyage des backticks si présents
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result  = json.loads(raw)
    score   = max(0, min(100, int(result.get("score", 0))))
    raisons = result.get("raisons", result.get("reasons", []))

    return {"score": score, "raisons": raisons}


def determine_niveau(score: int) -> str | None:
    if score >= 70: return "high"
    if score >= 45: return "medium"
    if score >= 20: return "low"
    return None


# ─────────────────────────────────────────────
# CHAT THÉRAPEUTIQUE
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


def build_context_prefix(reponses: dict) -> str:
    """Contexte injecté discrètement dans le 1er message de la session."""
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


def envoyer_message(historique: list[dict], message_user: str, context_prefix: str = "") -> str:
    """
    historique : liste de {"role": "user"|"assistant", "contenu": "..."}
    Retourne la réponse texte de PsychoBot.
    """
    client   = get_client()
    contents = []

    for msg in historique:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(types.Content(
            role=role,
            parts=[types.Part(text=msg["contenu"])]
        ))

    prompt = f"{context_prefix}{message_user}" if context_prefix else message_user
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
