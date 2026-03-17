# core/middleware.py
import logging

logger = logging.getLogger(__name__)


class SubdomainCaseMiddleware:
    """
    Middleware that extracts subdomain from the request host and attaches it
    to the request object. The React SPA handles rendering — this middleware
    just makes the subdomain available to Django views/API endpoints.

    Expected flow:
      1. User visits https://john-smith.caseclosure.org
      2. Wildcard DNS routes *.caseclosure.org to the server
      3. This middleware extracts 'john-smith' and sets request.subdomain
      4. The React SPA calls GET /api/cases/by-subdomain/john-smith/
      5. React renders the memorial template with the case data

    For local dev, supports *.localhost subdomains (e.g., john-smith.localhost:5173)
    """

    # Subdomains that should NOT be treated as case subdomains
    RESERVED_SUBDOMAINS = {'www', 'app', 'api', 'admin', 'mail', 'ftp', 'staging'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0].lower()
        subdomain = None

        # Production: *.caseclosure.org
        if host.endswith('.caseclosure.org'):
            subdomain = host.rsplit('.caseclosure.org', 1)[0]
        # Production alt: *.caseclosure.com
        elif host.endswith('.caseclosure.com'):
            subdomain = host.rsplit('.caseclosure.com', 1)[0]
        # Local dev: *.localhost
        elif host.endswith('.localhost'):
            subdomain = host.rsplit('.localhost', 1)[0]

        # Filter out reserved subdomains
        if subdomain and subdomain in self.RESERVED_SUBDOMAINS:
            subdomain = None

        # Attach to request for use by views
        request.subdomain = subdomain

        if subdomain:
            logger.debug(f"Subdomain detected: {subdomain} (host: {host})")

        return self.get_response(request)
