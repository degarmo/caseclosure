from django.shortcuts import render, get_object_or_404
from sites.models import MemorialSite

class SubdomainMemorialMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # remove port if any
        # Only intercept *.caseclosure.org, not admin/api
        if host.endswith('.caseclosure.org') and not host.startswith('www.'):
            subdomain = host.rsplit('.caseclosure.org', 1)[0]
            if subdomain and request.path == "/":
                memorial = MemorialSite.objects.filter(subdomain=subdomain, is_public=True).first()
                if memorial:
                    # Render a template for the memorial site
                    return render(request, "memorials/memorial_view.html", {"memorial": memorial})
        return self.get_response(request)
