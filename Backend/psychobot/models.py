from django.db import models
from django.contrib.auth.models import User


class QuestionnaireReponse(models.Model):
    """Stocke les réponses hebdomadaires d'un employé."""
    employe         = models.ForeignKey(User, on_delete=models.CASCADE, related_name="questionnaires")
    employe_id_ext  = models.CharField(max_length=100, blank=True)   # ex: "EMP_Rayane_H"
    departement     = models.CharField(max_length=100, blank=True)
    date_soumission = models.DateField()
    semaine         = models.DateField()                              # lundi de la semaine

    # Champs questionnaire
    niveau_stress_sur_10 = models.IntegerField()
    qualite_sommeil      = models.TextField()
    charge_de_travail    = models.TextField()
    sentiment_isolement  = models.TextField()
    commentaire_libre    = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employe", "semaine")
        ordering = ["-date_soumission"]

    def __str__(self):
        return f"{self.employe.username} — {self.semaine}"

    def to_reponses_dict(self) -> dict:
        """Retourne les réponses au format attendu par Gemini."""
        return {
            "niveau_stress_sur_10": self.niveau_stress_sur_10,
            "qualite_sommeil":      self.qualite_sommeil,
            "charge_de_travail":    self.charge_de_travail,
            "sentiment_isolement":  self.sentiment_isolement,
            "commentaire_libre":    self.commentaire_libre,
        }


class AlerteBurnout(models.Model):
    """Résultat de l'analyse Gemini pour un questionnaire."""
    NIVEAUX = [("low", "Faible"), ("medium", "Modéré"), ("high", "Élevé")]

    questionnaire = models.OneToOneField(
        QuestionnaireReponse, on_delete=models.CASCADE, related_name="alerte"
    )
    niveau  = models.CharField(max_length=10, choices=NIVEAUX)
    score   = models.IntegerField()
    raisons = models.JSONField(default=list)
    analyse_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-analyse_le"]

    def __str__(self):
        return f"[{self.niveau.upper()}] {self.questionnaire.employe.username} — score {self.score}"


class SessionChat(models.Model):
    """Session de conversation avec PsychoBot."""
    employe       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions_chat")
    questionnaire = models.ForeignKey(
        QuestionnaireReponse, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="sessions_chat"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    active     = models.BooleanField(default=True)

    def __str__(self):
        return f"Session {self.id} — {self.employe.username}"


class MessageChat(models.Model):
    """Un message dans une session de chat."""
    ROLES = [("user", "Employé"), ("assistant", "PsychoBot")]

    session   = models.ForeignKey(SessionChat, on_delete=models.CASCADE, related_name="messages")
    role      = models.CharField(max_length=10, choices=ROLES)
    contenu   = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.role}] Session {self.session_id}"
