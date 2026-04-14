ZenWork

1. Partie Login

La partie Login du projet est regroupée dans un dossier Login contenant des composants React permettant aux utilisateurs de se connecter soit en tant qu’employé, soit en tant que RH.

i. Login

Le composant Login est la page principale du site, elle est la première à apparaître lorsqu’on rentre sur l’application web.

Elle permet à l’utilisateur de choisir son espace de connexion parmi employé ou RH, la connexion est gérée dans EmployeeLogin ou RhLogin en fonction de l’espace que l’on a sélectionné.

Si l’on n’a pas de compte, on peut cliquer sur un lien en dessous de la zone d’authentification pour en créer un.

ii. RhLogin

Ce composant permet aux utilisateurs ayant le rôle RH uniquement de se connecter à l’application. Il fait partie de la page Login et s’affiche uniquement lorsque l’espace RH est sélectionné.

La connexion se fait via un email et un mot de passe, une fois ses infos rentrées, on fait un fetch avec la base de données pour vérifier que les infos correspondent bien avec ceux présente dans la base.

iii. EmployeeLogin

Composant identique à RhLogin à la différence près qu’il s’applique aux employés et non au RH.

2. Partie Register

Cette partie de projet est dédié à la création de compte que ce soit employé ou RH.

i. Register

Ce composant permet à l’utilisateur de remplir le formulaire suivant:

- une adresse mail
- un mot de passe qui respecte les conditions suivantes:
  - au moins une majuscule
  - au moins une minuscule
  - au moins un chiffre
  - au moins un caractère spécial parmi !, @, #, $, %, ^, &, 
  - au moins dix caractères
- un nom
- un prénom
- si l’on souhaite créer un compte en tant qu’employé ou RH

Une fois, ce formulaire remplit, on envoie ses informations vers la base de données via un fetch afin de créer un nouvel utilisateur (c’est avec ces informations que l’on décide s’il on peut se connecter ou non dans Login).

Lors de la création du compte, un id unique est automatiquement généré pour l’utilisateur pour l’identifier dans les autres pages du site (ex. dans Questionnaire voir qui a répondu au questionnaire).

3. Partie Dashboard
  Ce composant affiche une vue differente selon le role :

- version RH
- version employe

Le role vient de profile?.role.

Si le role est RH, le dashboard affiche plutot des infos globales :

- nombre d'employes
- questionnaires actifs
- reponses totales
- alertes ouvertes
- demandes en attente
- moyenne de risque IA

Si le role n'est pas RH, on est cote employe et le dashboard affiche plutot des infos personnelles :

- questionnaires completes
- questionnaire actif
- alertes ouvertes de l'utilisateur
- demandes en attente
- dernier score IA
- moyenne des scores IA

Les tables utilisees sont surtout :

- profiles
- questionnaire
- reponse_questionnaire
- alerte_burnout
- session_ia
- demande_changement

4. Partie Forum
5. Partie Ressource
6. Partie Questionnaire

La partie Questionnaire du projet est regroupée dans un dossier Questionnaire contenant des composants React, elle se compose principalement d’un module permettant de créer un questionnaire et d’un autre permettant d’y répondre.

i. StartQuestionnaire

Il s’agit d’un composant React permettant aux RH uniquement de lancer un questionnaire auquel les employés pourront répondre. Ils ont deux options: utiliser le questionnaire par défaut fourni par l’application ou créer leur propre questionnaire personnalisé.

Les questions sont stockées dans une liste d’objets, chacun contenant:

- l’intitulé de la question
- son type de réponse parmi
  - émoji du moins expressif au plus expressif
  - de 1 à 10
  - oui/non
  - texte (pour laisser l’utilisateur répondre plus librement)
- s’il s’agit d’une question optionnelle ou non
- un indicateur de validation (utiliser lors la création de questionnaire personnalisés pour vérifier que les questions sont correctement remplies)

Nous utilisons une variable pour savoir quoi envoyer vers la base de données en fonction de s’il s’agit d’un questionnaire personnalisé ou non, si c’est le cas, on permet à la RH de rentrer ses questions et de les envoyer sinon on envoie les questions par défaut qui sont codées en dur.

Pour tout cela, on fait un fetch vers la base de données pour vérifier si un questionnaire est lancé, via l’attribut de type booléen active de la table questionnaire, si oui, on peut l’arrêter (les employés ne pourront plus y répondre) en mettant cet attribut à FALSE sinon on peut en lancer un.

Une fois que le questionnaire est créé, on peut le lancer, cela revient à envoyer vers la base de données un fichier JSON du tableau contenant toutes les questions.

ii. Questionnaire

Il s’agit également d’un composant React permettant aux employés uniquement cette fois-ci de répondre aux questionnaires lancés par les RH.

Pour cela, nous vérifions d’abord si un questionnaire est lancé c’est-à-dire vérifier dans la table questionnaire si l’attribut active est à TRUE pour l’id correspondant passé en prop. Si un questionnaire est lancé, alors on propose à l’employé de répondre au questionnaire s’il n’a pas encore répondu et dans le cas contraire il ne peut plus y répondre sinon on affiche le composant React NoQuestionnaire qu’on détaillera un peu plus tard.

Lorsqu’un employé répond au questionnaire, les questions s’affichent une à une, cet affichage est géré par le composant React AnswerInput que l’on verra juste après. L’employé a la possibilité de revenir une ou plusieurs questions en arrière pour changer sa ou ses réponse s’il le souhaite. Il est à noter qu’avant de répondre au questionnaire, le nombre de questions est indiqué à l’employé et que tout au long du questionnaire une barre de progression est affichée néanmoins s’il le souhaite, l’employé peut quitter à tout moment le questionnaire et revenir le recommencer une prochaine fois du moment qu’il ne l’a pas encore terminé.

Une fois que l’on a fini de répondre au questionnaire, on effectue un fetch pour envoyer chaque question associée à sa réponse au format JSON à la base de données. C’est de ce dernier que l’on vérifie si un employé a déjà répondu à un questionnaire ou non pour lui en empêcher l’accès.

iii. AnswerInput

Ce composant React est là pour gérer l’affichage/rendu des questions et est utilisé par Questionnaire.

L’affichage des questions dépend du type de la question :

- émoji: cinq boutons avec un émoji du moins expressif au plus expressif
- de 1 à 10: une petite zone de texte dans laquelle on peut rentrer uniquement un nombre entre 1 et 10 compris
- oui/non: deux boutons, l’un pour oui, l’autre pour non
- texte: une zone de texte assez large avec une certaine limite de caractère quand même

Mais également de si elle est optionnel ou non, dans ce cas-là on laisse la possibilité de passer la question.

Elle stocke les couples (question, réponse) dans une variable qu’elle renverra au composant Questionnaire pour qu’il puisse l’envoyer à la base de données.

iv. NoQuestionnaire

Ce composant a uniquement pour vocation d’afficher « Il n'y a pas de questionnaire disponible pour le moment ». Il est utilisé par Questionnaire lorsqu’aucun questionnaire n’est lancé.

7. Partie Psychobot

La partie Psychobot du projet est regroupée dans un dossier Psychobot contenant des composants React côté frontend et une application Django côté backend. Elle se compose d'un module d'analyse de questionnaire, d'un chat thérapeutique et d'un système de détection de burn-out.

i. Architecture générale
Le Psychobot repose sur deux couches :

Frontend : composants React qui affichent le chat et communiquent avec le backend via des appels fetch.
Backend Django (dossier psychobot/) : trois endpoints REST qui font appel au modèle Llama 3 via l'API Groq pour analyser les réponses et générer des messages personnalisés.

L'authentification entre le frontend et le backend est gérée par un middleware Django (middleware.py) qui vérifie le JWT Supabase transmis dans le header Authorization: Bearer <token> et injecte l'UUID de l'utilisateur dans chaque requête.

ii. Analyse du questionnaire
Une fois qu'un employé a soumis ses réponses au questionnaire, le frontend appelle l'endpoint POST /psychobot/questionnaire/ en transmettant le questionnaire_id.
Le backend récupère alors les réponses depuis la table reponse_questionnaire et les transmet au modèle IA. Les réponses peuvent être de plusieurs formats : emojis (😟 😐 😊), valeurs numériques de 1 à 10, oui/non, ou texte libre.
Le modèle retourne un score de 0 à 100 ainsi qu'une liste de signaux détectés. À partir de ce score, un niveau de risque est déterminé :

0–34 : aucun signal préoccupant
35–54 : léger, à surveiller
55–74 : modéré, intervention recommandée
75–100 : sévère, attention immédiate

Un message court à la troisième personne est ensuite généré par l'IA et stocké dans le champ commentaire_rh de la table alerte_burnout.

iii. Chat
L'employé peut ensuite ouvrir une session de chat avec PsychoBot. Chaque message est envoyé via POST /psychobot/chat/message/ avec l'historique complet de la conversation.
Au premier message de la session, le backend injecte discrètement dans le contexte les données clés du questionnaire (niveau de stress, charge de travail, isolement, humeur) sans les mentionner directement, afin que PsychoBot puisse personnaliser ses réponses de façon naturelle. Le prénom de l'employé est également récupéré depuis la table profiles.
Le backend réinjecte aussi les 10 derniers messages des conversations précédentes (table historique_chat) pour donner à PsychoBot une mémoire entre les sessions.
Après chaque message, le backend analyse la conversation pour détecter les besoins de l'employé et recommande une catégorie de ressource parmi : stress, sommeil, mental, sport, méditation.

iv. Clôture de session
Lorsque l'employé ferme le chat, le frontend appelle POST /psychobot/chat/fermer/. Le backend relit l'intégralité de la conversation et affine le score initial grâce au modèle IA, qui peut détecter des éléments aggravants ou rassurants non visibles dans le questionnaire seul.
Le score final et un résumé anonymisé sont stockés dans la table session_ia. Si le score dépasse 60, une nouvelle entrée est créée dans alerte_burnout avec un message généré par l'IA, visible par le RH dans la section Activité récente du Dashboard.
L'historique complet de la session est sauvegardé dans historique_chat pour les sessions futures.

8. Partie Paramètre

Accessible via le menu latéral ou l'icône avatar (route `/profile/:id`), ce composant permet à tout utilisateur de gérer son compte. Il fetch la table `profiles` (`id`, `role`, `nom`, `prenom`, `service`, `date_embauche`) et expose deux sections :

i. Mon compte — modification du mot de passe (min. 10 caractères, confirmation requise) via `supabase.auth.updateUser`. Email affiché en lecture seule.

ii. Informations personnelles — mise à jour de `nom`, `prenom`, `service`, `date_embauche` via `UPDATE` sur `profiles`. Le rôle est en lecture seule (modifiable uniquement par un RH depuis la page Employés).

9. Page Employés (RH uniquement)

Protégé par `RhSecuredRoute`, accessible via `/employees` ou le bouton « Voir les employés » du Dashboard RH. Affiche tous les profils de la table `profiles` triés par nom (colonnes : Nom, Prénom, Service, Date d'embauche, Rôle).

Un bouton « Modifier » par ligne ouvre un formulaire inline pour mettre à jour `nom`, `prenom`, `service`, `date_embauche` et `role` (EMPLOYE / RH) via `UPDATE` sur `profiles`. Un seul employé est modifiable à la fois ; les autres boutons sont désactivés le temps de l'édition.

10. Partie Notifications

Intégré dans `DashboardLayout`, le système est accessible via l'icône de cloche en haut à droite. Un badge rouge indique le nombre de notifications non lues (`SELECT COUNT` sur `notifications` où `user_id` et `is_read = false`, rafraîchi à chaque ouverture du panneau).

Un clic sur la cloche ouvre un popup listant les 100 dernières notifications (`type`, `title`, `body`, date, statut lu/non lu). Les non lues sont mises en évidence ; cliquer dessus les marque comme lues (`UPDATE is_read = true`). Un bouton « Tout marquer comme lu » traite toutes les non lues en une seule requête.

Pour les alertes burnout, le champ `body` identifie l'employé concerné (nom, prénom, niveau d'urgence). Le RH retrouve ces mêmes alertes dans la section « Activité récente » du Dashboard avec le nom de l'employé et le statut (`NOUVEAU`, `EN_COURS`, `TRAITE`), puis peut accéder au profil complet via `/employees`.

Tables : `notifications` (`id`, `user_id`, `type`, `title`, `body`, `is_read`, `created_at`) et `alerte_burnout`.f

11. Partie Feedback
  Cette page sert a afficher les retours IA issus des sessions PsychoBot de l'utilisateur connecte.

On recupere dans Supabase :

- id
- resume_anonymise
- score_risque
- created_at

Depuis la table :

- session_ia

On filtre avec :

- utilisateur_id = user.id

Donc normalement chaque employe ne voit que ses propres retours.

### Ce qui s'affiche

La page affiche :

- le nombre total de sessions chargees
- la date de la derniere session
- une petite "astuce du jour"
- la liste des retours ecrits

Si resume_anonymise est vide, un texte par defaut est affiche pour ne pas laisser une carte vide.

### Rafraichissement temps reel

Comme pour le dashboard, il y a un channel Supabase qui ecoute les changements de la table session_ia pour l'utilisateur courant.

Des qu'une session est ajoutee ou modifiee, la liste peut se mettre a jour automatiquement.

Réalisé par

- Mohamed ALDYAB
- Oualid FELKAOUI
- Abderrahim HERMEZ
- Lylia AIT-MOKHTAR
- Rayane HEBBACHE
- Nassim ICHCHOU