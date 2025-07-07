// src/utils/getSubdomain.js
export default function getSubdomain() {
  const host = window.location.hostname;
  const parts = host.split(".");
  // e.g., "dron4.caseclosure.org" → ["dron4", "caseclosure", "org"]
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
}
