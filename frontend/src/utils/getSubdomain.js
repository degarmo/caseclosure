// src/utils/getSubdomain.js
export default function getSubdomain() {
  const host = window.location.hostname;
  const parts = host.split(".");
  
  // Handle .localhost subdomains (2 parts: "4josh.localhost")
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }
  
  // Handle production subdomains (3+ parts: "4josh.caseclosure.org")
  if (parts.length > 2) {
    const subdomain = parts[0];
    // Don't treat 'www' or 'app' as memorial subdomains
    if (subdomain === 'www' || subdomain === 'app') {
      return null;
    }
    return subdomain;
  }
  
  // Handle Render deployment (might be "4josh.yourapp.onrender.com")
  // Render gives you a domain like: yourapp.onrender.com
  if (parts.length >= 3 && parts[parts.length - 2] === 'onrender') {
    return parts[0];
  }
  
  return null;
}