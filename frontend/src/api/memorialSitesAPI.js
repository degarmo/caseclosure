// api/memorialSitesAPI.js
import api from './config';

/**
 * Memorial Sites API methods
 * Subdomain checking, site publishing, site management
 */
const memorialSitesAPI = {
  /**
   * Check if a subdomain is available
   */
  checkSubdomain: async (subdomain) => {
    const response = await api.get('/sites/sites/check_subdomain/', {
      params: { subdomain }
    });
    return response.data.available;
  },

  /**
   * Publish a memorial site by updating subdomain and visibility
   */
  publishSite: async (siteId, { subdomain, is_public = true }) => {
    const response = await api.patch(`/sites/sites/${siteId}/`, {
      subdomain,
      is_public
    });
    return response.data;
  },
  
  /**
   * Get site details
   */
  getSite: (siteId) => api.get(`/sites/sites/${siteId}/`),
  
  /**
   * List all sites
   */
  listSites: (params) => api.get('/sites/sites/', { params }),
  
  /**
   * Create a new site
   */
  createSite: (data) => api.post('/sites/sites/', data),
  
  /**
   * Update site details
   */
  updateSite: (siteId, data) => api.patch(`/sites/sites/${siteId}/`, data),
  
  /**
   * Delete a site
   */
  deleteSite: (siteId) => api.delete(`/sites/sites/${siteId}/`),
};

// Backward compatibility exports
const checkSubdomain = memorialSitesAPI.checkSubdomain;
const publishMemorialSite = memorialSitesAPI.publishSite;

// Named exports
export { 
  memorialSitesAPI,
  checkSubdomain,
  publishMemorialSite
};

// Default export
export default memorialSitesAPI;