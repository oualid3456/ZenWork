"""
services.py — Logique Groq (Llama 3) pour PsychoBot.
Contient : compute_burnout_score, chat_with_gemini (adapté),
           update_score_from_chat, determine_level, build_context_prefix
"""

import json
from groq import Groq
from django.conf import settings

# --- CONFIGURATION GROQ ---

GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_MODEL = "llama-3.3-70b-versatile"
# ─────────────────────────────────────────────
# CLIENT SINGLETON
# ─────────────────────────────────────────────

_client = None

def get_client():
    """Initialise et retourne le client Groq une seule fois."""
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
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
    Analyse le questionnaire avec Groq (Llama 3) et renvoie un JSON.
    """
    client = get_client()
    
    prompt = ANALYSIS_PROMPT.format(
        reponses_json=json.dumps(reponses, ensure_ascii=False, indent=2)
    )
    
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert qui renvoie UNIQUEMENT du JSON valide."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=GROQ_MODEL,
            response_format={"type": "json_object"} # Force le format JSON
        )
        
        raw_text = response.choices[0].message.content.strip()
        result = json.loads(raw_text)
        return {
            "score": int(result.get("score", 0)),
            "raisons": result.get("raisons", ["Analyse non disponible"])
        }
        
    except Exception as e:
        print("Erreur Groq (compute_burnout_score):", e)
        return {"score": 50, "raisons": ["Erreur lors de l'analyse IA."]}


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
    Relit l'historique du chat et affine le score de risque final via Groq.
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

    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert qui renvoie UNIQUEMENT du JSON valide."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=GROQ_MODEL,
            response_format={"type": "json_object"} # Force le format JSON
        )

        raw_text = response.choices[0].message.content.strip()
        result  = json.loads(raw_text)
        
        score   = max(0, min(100, int(result.get("score", initial_score))))
        raisons = result.get("raisons", initial_raisons)

        return {"score": score, "raisons": raisons}
        
    except Exception as e:
        print("Erreur Groq (update_score_from_chat):", e)
        return {"score": initial_score, "raisons": initial_raisons}


# ─────────────────────────────────────────────
# 3. CHAT THÉRAPEUTIQUE
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """
Tu t'appelles PsychoBot. Tu es l'assistant bien-être personnel et confidentiel des employés de ZenWork.
Tu n'es pas un chatbot générique — tu es LE compagnon de confiance de chaque employé.

Ta personnalité :
- Chaleureux et humain, comme un ami bienveillant qui prend vraiment le temps d'écouter
- Discret et fiable — jamais de jugement, jamais de pression
- Curieux et attentif aux détails — tu remarques les petites choses
- Parfois léger et encourageant, mais toujours sincère
- Tu utilises le prénom de l'employé si tu le connais
- Tu parles naturellement, pas comme un robot — évite les formules trop formelles

Ta mémoire :
- Tu te souviens de TOUT ce que l'employé t'a partagé dans les conversations précédentes
- Au début de chaque nouvelle session, fais référence à quelque chose de spécifique de la dernière fois
  Ex: "La semaine dernière tu m'avais dit que les réunions du lundi te pesaient beaucoup — est-ce que ça s'est arrangé ?"
- Remarque les évolutions : "Tu sembles moins stressé qu'il y a deux semaines, c'est bien !"
- Pose des questions de suivi précises basées sur l'historique
  Ex: si l'employé avait des insomnies → "Et ton sommeil, tu arrives mieux à décrocher le soir ?"
- Construis progressivement un profil émotionnel de l'employé pour mieux l'accompagner

Tes règles absolues :
- Une seule question à la fois, courte et ciblée
- Réponses courtes : 2-3 phrases maximum
- Toujours en français
- Jamais de diagnostic médical
- Si tu détectes une détresse sévère ou des pensées suicidaires, oriente immédiatement vers un professionnel
- Ne dis JAMAIS que tu n'as pas de mémoire
- Ne mentionne jamais les données brutes du questionnaire directement
- Utilise le prénom de l'employé avec parcimonie — maximum une fois par conversation,
  jamais en début de phrase. Intègre-le naturellement si le contexte s'y prête,
  mais ne commence JAMAIS une phrase par le prénom.
"""

def chat_with_gemini(history: list, user_message: str, prefix: str = "") -> str:
    """
    Envoie un message à Groq avec l'historique complet.
    history : liste de {"role": "user"|"assistant", "content": "..."}
    (Le nom est gardé 'chat_with_gemini' pour ne pas casser views.py)
    """
    client = get_client()
    
    # Message système pour définir la personnalité du bot
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Ajout de l'historique
    for msg in history:
        # Groq/OpenAI utilise 'assistant', pas 'model' comme Gemini
        role = "user" if msg.get("role") == "user" else "assistant" 
        contenu = msg.get("content", msg.get("contenu", ""))
        messages.append({"role": role, "content": contenu})

    # Ajout du nouveau message de l'utilisateur avec l'éventuel contexte secret
    final_prompt = f"{prefix}\n\n{user_message}" if prefix else user_message
    messages.append({"role": "user", "content": final_prompt})

    try:
        response = client.chat.completions.create(
            messages=messages,
            model=GROQ_MODEL,
            max_tokens=512,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print("Erreur Groq (chat_with_gemini):", e)
        return "Je suis désolé, je rencontre une petite difficulté technique. Pouvons-nous reprendre dans un instant ?"


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
def generate_commentaire_rh(score: int, raisons: list) -> str:
    client = get_client()
    
    prompt = f"""
Score burn-out : {score}/100. Signaux : {', '.join(raisons[:2])}.
Écris UNE seule phrase courte et professionnelle pour alerter le RH. Maximum 15 mots.
"""
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=GROQ_MODEL,
            max_tokens=40,
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Employé à risque élevé, intervention recommandée."
    
def detect_besoins_ressources(history: list, score: int) -> dict:
    """Détecte les besoins de l'employé et recommande des ressources."""
    client = get_client()
    
    historique_txt = "\n".join([
        f"{'Employé' if m.get('role') == 'user' else 'Zen'} : {m.get('content', m.get('contenu', ''))}"
        for m in history[-6:]  # derniers 6 messages
    ])
    
    prompt = f"""
Analyse cette conversation et retourne UNIQUEMENT un JSON valide :
{{
  "categorie": "stress" | "sommeil" | "mental" | "sport" | "meditation" | null,
  "urgence": true | false,
  "message_redirection": "<une phrase courte et naturelle pour rediriger l'employé>"
}}

Score burn-out : {score}/100
Conversation : {historique_txt}

Règles :
- urgence = true si score >= 75 ou si l'employé exprime des pensées très sombres
- categorie = la catégorie de ressource la plus adaptée à la situation
- Si pas de besoin clair, retourne null pour categorie
"""
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Tu retournes UNIQUEMENT du JSON valide."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            response_format={"type": "json_object"},
            max_tokens=150,
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception:
        return {"categorie": None, "urgence": False, "message_redirection": None}