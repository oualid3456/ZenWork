from django.db import models
from django.contrib.auth.models import User


# Gestion des congés
class Leave(models.Model):
    TYPES = [("CP", "Congés Payés"), ("RTT", "RTT"), ("SICK", "Maladie")]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, default="En attente")

    def __str__(self):
        # Affiche nom employé et type de congé
        return f"{self.user.username} - {self.type}"


class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_tradable = models.BooleanField(default=False)

    def __str__(self):
        # Affiche nom employé et heure de début
        return f"Planning de {self.user.username} ({self.start_time})"


class DemandeEmploiDuTemps(models.Model):
    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("approuve", "Approuvé"),
        ("refuse", "Refusé"),
    ]
    employe = models.ForeignKey(User, on_delete=models.CASCADE)
    date_demandee = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    motif = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default="en_attente"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Demande de {self.employe.username} pour le {self.date_demandee}"
