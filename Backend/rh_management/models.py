from django.db import models
from django.contrib.auth.models import User
import uuid

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)# id : uuid (clé prmaire)
    
    # user_id : integer (Lien vers auth_user.id)
    # db_column='user_id' car Django cherche par défaut 'user_id_id' du coup on le force
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id')
    
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    
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