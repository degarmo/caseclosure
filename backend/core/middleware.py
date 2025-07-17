from django.shortcuts import render
from cases.models import Case  # Updated import

class SubdomainCaseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # remove port if any
        # Only intercept *.caseclosure.org, not admin/api
        if host.endswith('.caseclosure.org') and not host.startswith('www.'):
            subdomain = host.rsplit('.caseclosure.org', 1)[0]
            if subdomain and request.path == "/":
                case = Case.objects.filter(subdomain=subdomain, is_public=True).first()
                if case:
                    # Render a template for the case's public page
                    return render(request, "memorials/memorial_view.html", {"case": case})
        return self.get_response(request)
