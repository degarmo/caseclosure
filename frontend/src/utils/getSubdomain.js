// src/utils/getSubdomain.js

/**
 * Extract memorial subdomain from the current hostname.
 * Returns null if this is the main site (www, app, etc.) or not a subdomain.
 *
 * Supported patterns:
 *   john-smith.caseclosure.org     → "john-smith"
 *   john-smith.caseclosure.com     → "john-smith"
 *   john-smith.localhost           → "john-smith"  (local dev)
 *   caseclosure.org                → null (main site)
 *   www.caseclosure.org            → null (main site)
 *   caseclosure-frontend.onrender.com → null (Render deployment)
 *   localhost                      → null
 */

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'ftp', 'staging',
  'caseclosure', 'caseclosure-frontend', 'caseclosure-backend',
]);

export default function getSubdomain() {
  const host = window.location.hostname.toLowerCase();
  const parts = host.split('.');

  // Local dev: john-smith.localhost
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0];
    return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
  }

  // Production: john-smith.caseclosure.org or john-smith.caseclosure.com
  if (parts.length === 3) {
    const [sub, domain, tld] = parts;

    // Only treat as memorial subdomain on caseclosure.org/com
    if (domain === 'caseclosure' && (tld === 'org' || tld === 'com')) {
      return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
    }
  }

  // Custom domain: anything that isn't a known platform domain
  // e.g., remembering-john.org would resolve here
  // This is for future custom domain support
  if (
    parts.length >= 2 &&
    !host.includes('localhost') &&
    !host.includes('caseclosure') &&
    !host.includes('onrender.com') &&
    !host.includes('127.0.0.1')
  ) {
    // Custom domains are treated as memorial sites
    // The TemplateRenderer will try to look up by custom_domain
    return '__custom_domain__';
  }

  return null;
}
