from django.db import models
<<<<<<< HEAD
from django.contrib.auth.models import User
import uuid

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)# id : uuid (clé prmaire)
    
    # user_id : integer (Lien vers auth_user.id)
    # db_column='user_id' car Django cherche par défaut 'user_id_id' du coup on le force
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id')
    
=======
import uuid


# =========================
# PROFILE (table: profiles)
# =========================
import uuid

class Profile(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

>>>>>>> a9afc24bece49ba51b6feff6f2776ce7cc475fa0
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
<<<<<<< HEAD
    
    date_embauche = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False    # empeche django de refaire la table
        db_table = 'profiles' # Nom table sur Supabase

# Gestion des congés
class Leave(models.Model):
    # On lie chaque congé à un profil (UUID)
    employee = models.ForeignKey(Profile, on_delete=models.CASCADE)
    
    type = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=100, default='En attente')

    def __str__(self):
        return f"Congé de {self.employee.nom}"

#suivi planning
class Schedule(models.Model):
    employee = models.ForeignKey(Profile, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_tradable = models.BooleanField(default=False)
=======

    date_embauche = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'profiles'
# =========================
# PLANNING (table: planning)
# =========================
class Planning(models.Model):

    TYPE_CHOICES = [
        ('TRAVAIL', 'Travail'),
        ('CONGE', 'Congé'),
        ('REPOS', 'Repos'),
        ('ABSENT', 'Absent'),
    ]

    SOURCE_CHOICES = [
        ('MANUEL', 'Manuel'),
        ('DEMANDE', 'Demande'),
    ]

    id = models.BigAutoField(primary_key=True)

    utilisateur = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        db_column='utilisateur_id',
        related_name='plannings'
    )

    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    commentaire = models.TextField(null=True, blank=True)

    type_planning = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES
    )

    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    def __str__(self):
        return f"{self.type_planning} - {self.date_debut}"

    class Meta:
        managed = False
        db_table = 'planning'


# ======================================
# PLANNING EMPLOYEES (table relation)
# ======================================
class PlanningEmployee(models.Model):

    planning = models.ForeignKey(
        Planning,
        on_delete=models.CASCADE,
        db_column='planning_id',
        related_name='employees'
    )

    utilisateur = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        db_column='utilisateur_id',
        related_name='assigned_plannings'
    )

    created_at = models.DateTimeField()

    def __str__(self):
        return f"{self.utilisateur} → Planning {self.planning.id}"

    class Meta:
        managed = False
        db_table = 'planning_employees'
>>>>>>> a9afc24bece49ba51b6feff6f2776ce7cc475fa0
