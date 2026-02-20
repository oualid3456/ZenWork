# Intégration PsychoBot dans le projet Django
==========================================

## 1. Copier le dossier psychobot/
Place le dossier `psychobot/` dans `Backend/` à côté de `rh_management/` :

```
Backend/
  config/          ← dossier Django existant
  rh_management/   ← app existante
  psychobot/       ← ✅ nouveau dossier à coller ici
  manage.py
```

## 2. Modifier Backend/config/settings.py

Ajoute ces lignes :

```python
# Dans INSTALLED_APPS, ajoute :
INSTALLED_APPS = [
    ...
    'rh_management',
    'psychobot',       # ← ajoute cette ligne
]

# En bas du fichier, ajoute :
GEMINI_API_KEY = "AIzaSyCAMOuEhHToFmH9jpc2r7LuhG7r6ILXG90"
```

## 3. Modifier Backend/config/urls.py

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # ... tes urls existantes ...
    path('psychobot/', include('psychobot.urls', namespace='psychobot')),  # ← ajoute
]
```

## 4. Créer et appliquer les migrations

```bash
cd Backend
python manage.py makemigrations psychobot
python manage.py migrate
```

## 5. Lancer le serveur

```bash
python manage.py runserver
```

## Endpoints disponibles

| Méthode | URL                                    | Description                        |
|---------|----------------------------------------|------------------------------------|
| POST    | /psychobot/questionnaire/              | Soumettre un questionnaire         |
| GET     | /psychobot/alertes/                    | Voir toutes les alertes (RH)       |
| POST    | /psychobot/chat/demarrer/              | Démarrer une session de chat       |
| POST    | /psychobot/chat/<id>/                  | Envoyer un message au PsychoBot   |
| GET     | /psychobot/chat/<id>/historique/       | Voir l'historique d'une session    |

## Exemple de test avec curl (ou Postman)

### Soumettre un questionnaire
```bash
curl -X POST http://localhost:8000/psychobot/questionnaire/ \
  -H "Content-Type: application/json" \
  -b "sessionid=TON_SESSION_ID" \
  -d '{
    "niveau_stress_sur_10": 8,
    "qualite_sommeil": "Très mauvaise, insomnies.",
    "charge_de_travail": "Complètement dépassé par les délais.",
    "sentiment_isolement": "Oui, je gère tout seul.",
    "commentaire_libre": "Je vais craquer."
  }'
```

### Démarrer un chat
```bash
curl -X POST http://localhost:8000/psychobot/chat/demarrer/ \
  -b "sessionid=TON_SESSION_ID"
```

### Envoyer un message
```bash
curl -X POST http://localhost:8000/psychobot/chat/1/ \
  -H "Content-Type: application/json" \
  -b "sessionid=TON_SESSION_ID" \
  -d '{"message": "Je me sens très fatigué."}'
```
