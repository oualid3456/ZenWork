from django.shortcuts import render
<<<<<<< HEAD
from .models import Leave

def dashboard_rh(request):
    # Récupérer tous les congés "En attente" pour le manager RH
    leaves_to_approve = Leave.objects.filter(status='En attente')
    return render(request, 'rh/dashboard.html', {'leaves': leaves_to_approve})
=======
from .models import Planning


def dashboard_rh(request):
    plannings_to_approve = Planning.objects.filter(
        type_planning='CONGE',
        source='DEMANDE'
    )


    return render(request, 'rh/dashboard.html', {
        'plannings': plannings_to_approve
    }
    )
>>>>>>> a9afc24bece49ba51b6feff6f2776ce7cc475fa0
