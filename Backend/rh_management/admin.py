from django.contrib import admin
from .models import Leave, Schedule, Profile

@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    # On affiche le nom de l'employé (via le profil) et le service
    list_display = ('get_employee_nom', 'get_employee_service', 'type', 'start_date', 'status')
    list_filter = ('status', 'type')

    def get_employee_nom(self, obj):
        return obj.employee.nom
    get_employee_nom.short_description = 'Nom Employé'

    def get_employee_service(self, obj):
        return obj.employee.service
    get_employee_service.short_description = 'Service'

admin.site.register(Schedule)
# On enregistre Profile en lecture seule si tu veux juste vérifier les infos
admin.site.register(Profile)