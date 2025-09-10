// @/utils/imageUtils.js

/**
 * Get a safe image URL with fallback
 * @param {string} url - The image URL
 * @param {string} type - Type of image (avatar, hero, gallery)
 * @returns {string} Safe image URL
 */
export const getSafeImageUrl = (url, type = 'default') => {
  // If no URL provided, return placeholder
  if (!url) {
    return getPlaceholderImage(type);
  }
  
  // Check if it's a valid URL
  if (isValidImageUrl(url)) {
    return url;
  }
  
  // Check if it's a relative path that needs base URL
  if (url.startsWith('/')) {
    // Assuming your images are served from your Django backend
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${baseUrl}${url}`;
  }
  
  // Return placeholder for invalid URLs
  return getPlaceholderImage(type);
};

/**
 * Check if URL is valid
 * @param {string} url 
 * @returns {boolean}
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Check for data URLs
  if (url.startsWith('data:')) return true;
  
  // Check for blob URLs
  if (url.startsWith('blob:')) return true;
  
  // Check for HTTP(S) URLs
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Check for relative URLs
  if (url.startsWith('/')) return true;
  
  return false;
};

/**
 * Get placeholder image based on type
 * @param {string} type 
 * @returns {string}
 */
export const getPlaceholderImage = (type) => {
  const placeholders = {
    avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23e2e8f0"/%3E%3Ccircle cx="200" cy="150" r="50" fill="%2394a3b8"/%3E%3Cellipse cx="200" cy="280" rx="80" ry="60" fill="%2394a3b8"/%3E%3C/svg%3E',
    hero: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2364748b;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%231e293b;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="800" fill="url(%23grad)"/>%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white"%3EImage Coming Soon%3C/text%3E%3C/svg%3E',
    gallery: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Crect x="150" y="150" width="100" height="100" fill="%23d1d5db"/%3E%3C/svg%3E',
    default: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b"%3ENo Image%3C/text%3E%3C/svg%3E'
  };
  
  return placeholders[type] || placeholders.default;
};

/**
 * Handle image error event
 * @param {Event} event 
 * @param {string} type 
 */
export const handleImageError = (event, type = 'default') => {
  event.target.onerror = null; // Prevent infinite loop
  event.target.src = getPlaceholderImage(type);
};