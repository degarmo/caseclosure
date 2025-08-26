// src/components/CaseCreator/services/caseAPI.js

import api from "@/api/axios";

/**
 * Prepare case payload for API - UPDATED for new model structure
 * @param {Object} caseData - Raw case data from form
 * @param {Object} selectedTemplate - Selected template object
 * @param {Object} customizations - Template customizations
 * @returns {Object} Formatted payload for API
 */

// Fixed prepareCasePayload function - removed fields that don't exist in the model

export const prepareCasePayload = (caseData, selectedTemplate, customizations) => {
  const payload = {
    // Basic case information
    case_title: caseData.case_title || `${caseData.first_name} ${caseData.last_name}`.trim() || 'Untitled Case',
    first_name: caseData.first_name || '',
    middle_name: caseData.middle_name || '',
    last_name: caseData.last_name || '',
    nickname: caseData.nickname || '',
    
    // Template configuration
    template_id: selectedTemplate?.id || 'beacon',
    template_version: selectedTemplate?.version || '1.0.0',
    template_data: {
      customizations: customizations || {},
      metadata: {
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
        editor_version: '1.0.0'
      }
    },
    
    // Case type and description
    case_type: caseData.case_type || 'missing',
    description: caseData.description || caseData.incident_description || '',
    
    // Dates - only include fields that exist in the model
    date_of_birth: caseData.date_of_birth || null,
    date_of_death: caseData.date_of_death || null,
    date_missing: caseData.date_missing || null,
    incident_date: caseData.incident_date || null,
    
    // Physical description
    age: caseData.age ? parseInt(caseData.age) : null,
    height_feet: caseData.height_feet ? parseInt(caseData.height_feet) : null,
    height_inches: caseData.height_inches ? parseInt(caseData.height_inches) : null,
    weight: caseData.weight ? parseInt(caseData.weight) : null,
    race: caseData.race || '',
    sex: caseData.sex || '',
    hair_color: caseData.hair_color || '',
    eye_color: caseData.eye_color || '',
    distinguishing_features: caseData.distinguishing_features || '',
    
    // Investigation details
    case_number: caseData.case_number || '',
    investigating_agency: caseData.investigating_agency || caseData.investigating_department || '',
    detective_name: caseData.detective_name || '',
    detective_phone: caseData.detective_phone || '',
    detective_email: caseData.detective_email || '',
    
    // Location information
    incident_location: caseData.incident_location || '',
    last_seen_location: caseData.last_seen_location || '',
    
    // Reward information
    reward_amount: caseData.reward_amount ? parseFloat(caseData.reward_amount) : null,
    reward_details: caseData.reward_details || '',
    
    // Domain configuration (if provided)
    subdomain: caseData.subdomain || '',
    custom_domain: caseData.custom_domain || '',
    
    // Publishing settings
    is_public: caseData.is_public || false,
    is_disabled: false,
  };
  
  // Remove null/undefined values to avoid validation errors
  Object.keys(payload).forEach(key => {
    if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
      delete payload[key];
    }
  });
  
  // Clean up nested template_data if empty
  if (payload.template_data) {
    if (!payload.template_data.customizations || Object.keys(payload.template_data.customizations).length === 0) {
      payload.template_data.customizations = {};
    }
  }
  
  console.log('Prepared payload:', JSON.stringify(payload, null, 2));
  
  return payload;
};

/**
 * Create a new case
 * @param {Object} caseData - Case data
 * @param {Object} selectedTemplate - Selected template
 * @param {Object} customizations - Template customizations
 * @returns {Promise<Object>} API response data
 */
export const createCase = async (caseData, selectedTemplate, customizations) => {
  const payload = prepareCasePayload(caseData, selectedTemplate, customizations);
  
  console.log('Creating case with payload:', payload);
  
  try {
    const response = await api.post('cases/', payload);
    console.log('Case created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating case:', error.response?.data || error);
    throw error;
  }
};

/**
 * Update an existing case
 * @param {string|number} caseId - Case ID
 * @param {Object} caseData - Case data
 * @param {Object} selectedTemplate - Selected template
 * @param {Object} customizations - Template customizations
 * @returns {Promise<Object>} API response data
 */
export const updateCase = async (caseId, caseData, selectedTemplate, customizations) => {
  const payload = prepareCasePayload(caseData, selectedTemplate, customizations);
  
  console.log('Updating case with payload:', payload);
  
  try {
    const response = await api.patch(`cases/${caseId}/`, payload);
    console.log('Case updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating case:', error.response?.data || error);
    throw error;
  }
};

/**
 * Save case (create or update)
 * @param {Object} params - Parameters object
 * @param {string|number|null} params.caseId - Existing case ID or null for new case
 * @param {Object} params.caseData - Case data
 * @param {Object} params.selectedTemplate - Selected template
 * @param {Object} params.customizations - Template customizations
 * @returns {Promise<Object>} API response data
 */
export const saveCase = async ({ caseId, caseData, selectedTemplate, customizations }) => {
  if (caseId) {
    return updateCase(caseId, caseData, selectedTemplate, customizations);
  } else {
    return createCase(caseData, selectedTemplate, customizations);
  }
};

/**
 * Save only customizations (NEW endpoint)
 * @param {string|number} caseId - Case ID
 * @param {Object} customizations - Template customizations
 * @returns {Promise<Object>} API response data
 */
export const saveCustomizations = async (caseId, customizations) => {
  try {
    const response = await api.post(`cases/${caseId}/save_customizations/`, {
      customizations
    });
    console.log('Customizations saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving customizations:', error.response?.data || error);
    throw error;
  }
};

/**
 * Update a specific template section (NEW)
 * @param {string|number} caseId - Case ID
 * @param {string} section - Section name (e.g., 'hero', 'timeline')
 * @param {Object} data - Section data
 * @returns {Promise<Object>} API response data
 */
export const updateTemplateSection = async (caseId, section, data) => {
  try {
    const response = await api.post(`cases/${caseId}/update_template_section/`, {
      section,
      data
    });
    console.log(`Section ${section} updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating section ${section}:`, error.response?.data || error);
    throw error;
  }
};

/**
 * Deploy a case website (UPDATED)
 * @param {string|number} caseId - Case ID
 * @param {Object} domainConfig - Domain configuration
 * @returns {Promise<Object>} API response data
 */
export const deployCaseWebsite = async (caseId, domainConfig = {}) => {
  try {
    const response = await api.post(`cases/${caseId}/deploy/`, {
      subdomain: domainConfig.subdomain || '',
      custom_domain: domainConfig.custom_domain || ''
    });
    console.log('Website deployment initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deploying website:', error.response?.data || error);
    throw error;
  }
};

/**
 * Check deployment status (NEW)
 * @param {string|number} caseId - Case ID
 * @returns {Promise<Object>} Deployment status data
 */
export const checkDeploymentStatus = async (caseId) => {
  try {
    const response = await api.get(`cases/${caseId}/deployment_status/`);
    return response.data;
  } catch (error) {
    console.error('Error checking deployment status:', error.response?.data || error);
    throw error;
  }
};

/**
 * Get case by ID
 * @param {string|number} caseId - Case ID
 * @returns {Promise<Object>} Case data
 */
export const getCaseById = async (caseId) => {
  try {
    const response = await api.get(`cases/${caseId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching case:', error.response?.data || error);
    throw error;
  }
};

/**
 * Get user's cases
 * @returns {Promise<Array>} Array of cases
 */
export const getMyCases = async () => {
  try {
    const response = await api.get('cases/my_cases/');
    return response.data;
  } catch (error) {
    console.error('Error fetching cases:', error.response?.data || error);
    throw error;
  }
};

/**
 * Get case statistics (NEW)
 * @returns {Promise<Object>} Statistics data
 */
export const getCaseStats = async () => {
  try {
    const response = await api.get('cases/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error.response?.data || error);
    throw error;
  }
};

/**
 * Delete case
 * @param {string|number} caseId - Case ID
 * @returns {Promise<void>}
 */
export const deleteCase = async (caseId) => {
  try {
    await api.delete(`cases/${caseId}/`);
    console.log('Case deleted successfully');
  } catch (error) {
    console.error('Error deleting case:', error.response?.data || error);
    throw error;
  }
};

/**
 * Upload case media file
 * @param {string|number} caseId - Case ID
 * @param {File} file - File to upload
 * @param {string} fieldName - Field name for the file
 * @returns {Promise<Object>} API response data
 */
export const uploadCaseMedia = async (caseId, file, fieldName) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  try {
    const response = await api.patch(`cases/${caseId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Media uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading media:', error.response?.data || error);
    throw error;
  }
};

// ============================================
// TEMPLATE MANAGEMENT (NEW)
// ============================================

/**
 * Get available templates
 * @returns {Promise<Array>} Array of templates
 */
export const getTemplates = async () => {
  try {
    const response = await api.get('templates/');
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error.response?.data || error);
    throw error;
  }
};

/**
 * Get template schema
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Template schema
 */
export const getTemplateSchema = async (templateId) => {
  try {
    const response = await api.get(`templates/${templateId}/schema/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template schema:', error.response?.data || error);
    throw error;
  }
};

/**
 * Compare templates
 * @returns {Promise<Array>} Template comparison data
 */
export const compareTemplates = async () => {
  try {
    const response = await api.get('templates/compare/');
    return response.data;
  } catch (error) {
    console.error('Error comparing templates:', error.response?.data || error);
    throw error;
  }
};

// ============================================
// SPOTLIGHT POSTS (NEW)
// ============================================

/**
 * Get spotlight posts for a case
 * @param {string|number} caseId - Case ID
 * @returns {Promise<Array>} Array of posts
 */
export const getSpotlightPosts = async (caseId) => {
  try {
    const response = await api.get('spotlight-posts/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching spotlight posts:', error.response?.data || error);
    throw error;
  }
};

/**
 * Create spotlight post
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Created post
 */
export const createSpotlightPost = async (postData) => {
  try {
    const response = await api.post('spotlight-posts/', postData);
    console.log('Spotlight post created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating spotlight post:', error.response?.data || error);
    throw error;
  }
};

/**
 * Update spotlight post
 * @param {string} postId - Post ID
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Updated post
 */
export const updateSpotlightPost = async (postId, postData) => {
  try {
    const response = await api.patch(`spotlight-posts/${postId}/`, postData);
    console.log('Spotlight post updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating spotlight post:', error.response?.data || error);
    throw error;
  }
};

/**
 * Publish spotlight post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Published post
 */
export const publishSpotlightPost = async (postId) => {
  try {
    const response = await api.post(`spotlight-posts/${postId}/publish/`);
    console.log('Spotlight post published:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error publishing spotlight post:', error.response?.data || error);
    throw error;
  }
};

/**
 * Schedule spotlight post
 * @param {string} postId - Post ID
 * @param {string} scheduledFor - ISO datetime string
 * @returns {Promise<Object>} Scheduled post
 */
export const scheduleSpotlightPost = async (postId, scheduledFor) => {
  try {
    const response = await api.post(`spotlight-posts/${postId}/schedule/`, {
      scheduled_for: scheduledFor
    });
    console.log('Spotlight post scheduled:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling spotlight post:', error.response?.data || error);
    throw error;
  }
};

/**
 * Delete spotlight post
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const deleteSpotlightPost = async (postId) => {
  try {
    await api.delete(`spotlight-posts/${postId}/`);
    console.log('Spotlight post deleted');
  } catch (error) {
    console.error('Error deleting spotlight post:', error.response?.data || error);
    throw error;
  }
};

// ============================================
// CASE PHOTOS (NEW)
// ============================================

/**
 * Get case photos
 * @param {string|number} caseId - Case ID
 * @returns {Promise<Array>} Array of photos
 */
export const getCasePhotos = async (caseId) => {
  try {
    const response = await api.get('case-photos/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching case photos:', error.response?.data || error);
    throw error;
  }
};

/**
 * Upload case photo
 * @param {string|number} caseId - Case ID
 * @param {File} file - Photo file
 * @param {string} caption - Photo caption
 * @returns {Promise<Object>} Uploaded photo data
 */
export const uploadCasePhoto = async (caseId, file, caption = '') => {
  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('image', file);
  formData.append('caption', caption);
  formData.append('is_public', true);
  
  try {
    const response = await api.post('case-photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Photo uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading photo:', error.response?.data || error);
    throw error;
  }
};

/**
 * Reorder case photos
 * @param {string|number} caseId - Case ID
 * @param {Array<string>} photoIds - Ordered array of photo IDs
 * @returns {Promise<Object>} Response data
 */
export const reorderCasePhotos = async (caseId, photoIds) => {
  try {
    const response = await api.post('case-photos/reorder/', {
      case_id: caseId,
      photo_ids: photoIds
    });
    console.log('Photos reordered successfully');
    return response.data;
  } catch (error) {
    console.error('Error reordering photos:', error.response?.data || error);
    throw error;
  }
};

/**
 * Delete case photo
 * @param {string} photoId - Photo ID
 * @returns {Promise<void>}
 */
export const deleteCasePhoto = async (photoId) => {
  try {
    await api.delete(`case-photos/${photoId}/`);
    console.log('Photo deleted successfully');
  } catch (error) {
    console.error('Error deleting photo:', error.response?.data || error);
    throw error;
  }
};

// ============================================
// DEPLOYMENT LOGS (NEW)
// ============================================

/**
 * Get deployment logs for a case
 * @param {string|number} caseId - Case ID
 * @returns {Promise<Array>} Array of deployment logs
 */
export const getDeploymentLogs = async (caseId) => {
  try {
    const response = await api.get('deployment-logs/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching deployment logs:', error.response?.data || error);
    throw error;
  }
};