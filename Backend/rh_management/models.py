import uuid
from django.db import models
from django.contrib.auth.models import User


# =============================================================================
# Modèles Django (SQLite) - Leave & Schedule
# =============================================================================


class Leave(models.Model):
    """Gestion des congés"""

    TYPES = [("CP", "Congés Payés"), ("RTT", "RTT"), ("SICK", "Maladie")]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, default="En attente")

    def __str__(self):
        return f"{self.user.username} - {self.type}"


class Schedule(models.Model):
    """Forum d'échange et planning"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_tradable = models.BooleanField(default=False)

    def __str__(self):
        return f"Planning de {self.user.username} ({self.start_time})"


# =============================================================================
# Modèles PostgreSQL (Supabase) - Profile, DemandeChangement, Planning
# =============================================================================


class Profile(models.Model):
    """Table profiles (utilisateurs Supabase)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    class Meta:
        db_table = "profiles"
        managed = False

    def __str__(self):
        return str(self.id)


class DemandeChangement(models.Model):
    """Table demande_changement"""

    TYPE_CHOICES = [
        ("CONGE", "Congé"),
        ("HORAIRE", "Horaire"),
        ("ECHANGE", "Échange"),
    ]
    STATUT_CHOICES = [
        ("EN_ATTENTE", "En attente"),
        ("ACCEPTEE", "Acceptée"),
        ("REFUSEE", "Refusée"),
    ]

    id = models.BigAutoField(primary_key=True)
    utilisateur = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        db_column="utilisateur_id",
        related_name="demandes",
    )
    type_demande = models.CharField(max_length=20, choices=TYPE_CHOICES)
    motif = models.TextField(blank=True, null=True)
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default="EN_ATTENTE"
    )
    valide_par = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        db_column="valide_par",
        related_name="demandes_validees",
        blank=True,
        null=True,
    )
    date_traitement = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "demande_changement"
        managed = False

    def __str__(self):
        return f"{self.type_demande} - {self.utilisateur_id} ({self.statut})"


class Planning(models.Model):
    """Table planning"""

    id = models.BigAutoField(primary_key=True)
    utilisateur = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        db_column="utilisateur_id",
        related_name="plannings",
    )
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    commentaire = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "planning"
        managed = False

    def __str__(self):
        return f"Planning {self.utilisateur_id}: {self.date_debut} → {self.date_fin}"
