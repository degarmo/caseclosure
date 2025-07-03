from django.http import Http404
from victims.models import Victim

class SubdomainMiddleware:
    """
    Detects the subdomain (e.g. '4joshua') from the Host header
    and loads the corresponding Victim object into request.victim.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # strip port
        parts = host.split('.')
        # expecting {sub}.caseclosure.org or custom domain
        subdomain = parts[0] if len(parts) > 2 else None

        if subdomain:
            try:
                request.victim = Victim.objects.get(subdomain=subdomain)
            except Victim.DoesNotExist:
                raise Http404("Victim case not found")
        else:
            request.victim = None

        return self.get_response(request)
