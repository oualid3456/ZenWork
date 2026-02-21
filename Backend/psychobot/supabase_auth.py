import json
from functools import wraps
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse


def _get_bearer_token(request):
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def _fetch_supabase_user(access_token):
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None, "Configuration Supabase manquante (SUPABASE_URL / SUPABASE_ANON_KEY)."

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    req = Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "apikey": settings.SUPABASE_ANON_KEY,
        },
        method="GET",
    )

    try:
        with urlopen(req, timeout=8) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload), None
    except HTTPError as exc:
        if exc.code in (401, 403):
            return None, "Token invalide ou expire."
        return None, f"Erreur Supabase Auth ({exc.code})."
    except URLError:
        return None, "Impossible de joindre Supabase Auth."
    except Exception:
        return None, "Erreur inattendue pendant la verification du token."


def supabase_login_required(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        token = _get_bearer_token(request)
        if not token:
            return JsonResponse({"erreur": "Authorization Bearer token requis."}, status=401)

        supabase_user, err = _fetch_supabase_user(token)
        if err:
            return JsonResponse({"erreur": err}, status=401)

        supabase_id = supabase_user.get("id")
        email = supabase_user.get("email", "")
        if not supabase_id:
            return JsonResponse({"erreur": "Utilisateur Supabase invalide."}, status=401)

        username = f"sb_{supabase_id}"
        user, _ = User.objects.get_or_create(username=username, defaults={"email": email})

        if email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])

        request.user = user
        request.supabase_user_id = supabase_id
        request.supabase_user = supabase_user

        return view_func(request, *args, **kwargs)

    return _wrapped
