


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



3. Partie Dashboard



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


iii.  AnswerInput


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



8. Partie Paramètre






Réalisé par
- Mohamed ALDYAB
- Oualid FELKAOUI
- Abderrahim HERMEZ
- Lilia AIT-MOKHTAR
- Rayane HEBBACHE
- Nassim ICHCHOU 