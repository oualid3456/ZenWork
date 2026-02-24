from django.shortcuts import render
from .models import Leave

def dashboard_rh(request):
    # Récupérer tous les congés "En attente" pour le manager RH
    leaves_to_approve = Leave.objects.filter(status='En attente')
    return render(request, 'rh/dashboard.html', {'leaves': leaves_to_approve})