// src/components/CaseCreator/services/caseAPI.js

import api from '@/api/config';

/**
 * Upload a generic image and return its URL
 * This is used by the CustomizationView for hero images and other customizable images
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The URL of the uploaded image
 */

export const uploadImage = async (file) => {
  if (!file) {
    throw new Error('File is required');
  }

  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await api.post('/images/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url; // This is now a Cloudinary URL, not base64!
    
  } catch (error) {
    throw error;
  }
};

/**
 * Prepare case payload for API
 * @param {Object} caseData - Raw case data from form
 * @param {Object} selectedTemplate - Selected template object
 * @param {Object} customizations - Template customizations
 * @param {Boolean} excludeFiles - Whether to exclude file fields from payload
 * @returns {Object} Formatted payload for API
 */
export const prepareCasePayload = (caseData, selectedTemplate, customizations, excludeFiles = false) => {
  // Debug logging
  
  // Determine the correct case type - prioritize crime_type from the form
  let determinedCaseType = null;
  
  // Check multiple possible field names
  if (caseData.crime_type) {
    determinedCaseType = caseData.crime_type;
  } else if (caseData.case_type) {
    determinedCaseType = caseData.case_type;
  } else if (caseData.type) {
    determinedCaseType = caseData.type;
  } else {
    determinedCaseType = 'missing'; // Default fallback
  }
  
  // Validate and log the final case type
  if (determinedCaseType === 'homicide') {
  } else if (determinedCaseType === 'missing') {
  } else {
  }
  
  // Start with required fields
  const payload = {
    // Basic case information - always required
    case_title: caseData.case_title || `${caseData.first_name || ''} ${caseData.last_name || ''}`.trim() || 'Untitled Case',
    first_name: caseData.first_name || '',
    last_name: caseData.last_name || '',
    
    // Template configuration
    template_id: selectedTemplate?.template_id || selectedTemplate?.id || 'beacon',
    template_version: selectedTemplate?.version || '1.0.0',
    template_data: {
      customizations: customizations || {},
      metadata: {
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
        editor_version: '1.0.0'
      }
    },
    
    // IMPORTANT: Set case type with all possible field names the backend might expect
    case_type: determinedCaseType,
    crime_type: determinedCaseType,  // Include both to ensure backend receives it
    type: determinedCaseType,  // Some backends use just 'type'
    
    // Publishing settings
    is_public: caseData.is_public !== undefined ? caseData.is_public : false,
    is_disabled: false,
  };

  // Add optional fields only if they have values
  const optionalFields = {
    middle_name: caseData.middle_name,
    nickname: caseData.nickname,
    description: caseData.description || caseData.incident_description,
    date_of_birth: caseData.date_of_birth,
    date_of_death: caseData.date_of_death,
    date_missing: caseData.date_missing || caseData.last_seen_date, // Handle both field names
    incident_date: caseData.incident_date,
    age: caseData.age ? parseInt(caseData.age) : null,
    height_feet: caseData.height_feet ? parseInt(caseData.height_feet) : null,
    height_inches: caseData.height_inches ? parseInt(caseData.height_inches) : null,
    weight: caseData.weight ? parseInt(caseData.weight) : null,
    race: caseData.race,
    sex: caseData.sex ? caseData.sex.toLowerCase() : '',
    hair_color: caseData.hair_color,
    eye_color: caseData.eye_color,
    distinguishing_features: caseData.distinguishing_features,
    case_number: caseData.case_number,
    investigating_agency: caseData.investigating_agency || caseData.investigating_department,
    detective_name: caseData.detective_name,
    detective_phone: caseData.detective_phone,
    detective_email: caseData.detective_email,
    
    // LOCATION FIELDS - ADDED CITY AND STATE
    incident_location: caseData.incident_location,
    incident_city: caseData.incident_city,      // NEW: City field
    incident_state: caseData.incident_state,    // NEW: State field
    
    last_seen_location: caseData.last_seen_location || caseData.last_seen_wearing,
    last_seen_date: caseData.last_seen_date,
    last_seen_time: caseData.last_seen_time,
    last_seen_wearing: caseData.last_seen_wearing,
    last_seen_with: caseData.last_seen_with,
    planned_activities: caseData.planned_activities,
    transportation_details: caseData.transportation_details,
    reward_amount: caseData.reward_amount ? parseFloat(caseData.reward_amount) : null,
    reward_details: caseData.reward_details,
    subdomain: caseData.subdomain,
    custom_domain: caseData.custom_domain,
  };

  // Add optional fields to payload only if they have truthy values
  Object.entries(optionalFields).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      payload[key] = value;
    }
  });

  // Don't include file fields in the JSON payload if excludeFiles is true
  if (!excludeFiles && caseData.victim_photo) {
  }

  // Final validation log
  
  return payload;
};

/**
 * Upload victim photo as the primary case photo
 */
export const uploadVictimPhoto = async (caseId, file) => {
  if (!caseId || !file) {
    throw new Error('Case ID and file are required');
  }

  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('image', file);
  formData.append('caption', 'Primary victim photo');
  formData.append('is_primary', true);
  formData.append('is_public', true);
  formData.append('order', 0); // First photo
  
  try {
    const response = await api.post('case-photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new case WITH image upload support
 */
export const createCase = async (caseData, selectedTemplate, customizations) => {
  try {
    // Step 1: Extract the image file if present
    const imageFile = caseData.victim_photo;
    delete caseData.victim_photo; // Remove from caseData so it's not in JSON
    
    // Step 2: Create the case first without the image
    const payload = prepareCasePayload(caseData, selectedTemplate, customizations, true);
    
    
    const response = await api.post('cases/', payload);
    
    
    // Verify the case type was saved correctly
    if (response.data) {
      const savedCaseType = response.data.case_type || response.data.crime_type || response.data.type;
      if (savedCaseType !== payload.case_type) {
      } else {
      }
      
      // Verify location fields were saved
      if (payload.incident_city && !response.data.incident_city) {
      }
      if (payload.incident_state && !response.data.incident_state) {
      }
    }
    
    // Ensure we have data
    if (!response.data || !response.data.id) {
      throw new Error('No data returned from server');
    }
    
    const createdCase = response.data;
    
    // Step 3: Upload the victim photo if provided
    if (imageFile && imageFile instanceof File) {
      
      try {
        const photoResult = await uploadVictimPhoto(createdCase.id, imageFile);
        
        // Optionally merge photo data into case response
        createdCase.victim_photo_url = photoResult.image;
      } catch (photoError) {
        // Don't throw - case was created successfully, photo upload is secondary
      }
    }
    
    return createdCase;
    
  } catch (error) {
    
    // Log specific field errors if they exist
    if (error.response?.data) {
      if (error.response.data.case_type) {
      }
      if (error.response.data.crime_type) {
      }
      if (error.response.data.incident_city) {
      }
      if (error.response.data.incident_state) {
      }
    }
    
    throw error;
  }
};

/**
 * Create a draft case with minimal validation
 */
export const createDraftCase = async (caseData, selectedTemplate) => {
  // Extract image file if present
  const imageFile = caseData.victim_photo;
  delete caseData.victim_photo;
  
  // Determine case type for draft
  const draftCaseType = caseData.crime_type || caseData.case_type || 'missing';
  
  
  const payload = {
    case_title: caseData.case_title || 'Untitled Case',
    first_name: caseData.first_name || '',
    last_name: caseData.last_name || '',
    template_id: selectedTemplate?.template_id || selectedTemplate?.id || 'beacon',
    template_version: selectedTemplate?.version || '1.0.0',
    template_data: {
      customizations: {},
      metadata: {
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
        editor_version: '1.0.0'
      }
    },
    // Include all possible case type fields
    case_type: draftCaseType,
    crime_type: draftCaseType,
    type: draftCaseType,
    // Include location fields
    incident_city: caseData.incident_city || '',
    incident_state: caseData.incident_state || '',
    is_public: false,
    is_disabled: false,
    is_draft: true  // Flag for backend to skip validation
  };


  try {
    const response = await api.post('cases/draft/', payload);
    
    const createdDraft = response.data;
    
    // Optionally upload image even for draft
    if (imageFile && createdDraft.id) {
      try {
        const photoResult = await uploadVictimPhoto(createdDraft.id, imageFile);
        createdDraft.victim_photo_url = photoResult.image;
      } catch (e) {
      // silently handled
      }
    }
    
    return createdDraft;
  } catch (error) {
    // If draft endpoint doesn't exist, fall back to regular create
    if (error.response?.status === 404) {
      // Restore image file for regular create
      caseData.victim_photo = imageFile;
      return createCase(caseData, selectedTemplate, {});
    }
    throw error;
  }
};

/**
 * Update an existing case WITH image upload support
 */
export const updateCase = async (caseId, caseData, selectedTemplate, customizations) => {
  try {
    // Step 1: Extract the image file if present
    const imageFile = caseData.victim_photo;
    delete caseData.victim_photo; // Remove from caseData
    
    // Step 2: Update the case data
    const payload = prepareCasePayload(caseData, selectedTemplate, customizations, true);
    
    
    const response = await api.patch(`cases/${caseId}/`, payload);
    
    
    // Verify the case type was updated correctly
    if (response.data) {
      const savedCaseType = response.data.case_type || response.data.crime_type || response.data.type;
      if (savedCaseType !== payload.case_type) {
      } else {
      }
      
      // Verify location fields were updated
    }
    
    const updatedCase = response.data;
    
    // Step 3: Upload new victim photo if provided
    if (imageFile && imageFile instanceof File) {
      
      try {
        // First, delete existing primary photo if it exists
        const existingPhotos = await getCasePhotos(caseId);
        const primaryPhoto = existingPhotos.find(p => p.is_primary);
        if (primaryPhoto) {
          await deleteCasePhoto(primaryPhoto.id);
        }
        
        // Upload new photo
        const photoResult = await uploadVictimPhoto(caseId, imageFile);
        updatedCase.victim_photo_url = photoResult.image;
      } catch (e) {
      // silently handled
      }
    }
    
    return updatedCase;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Save case (create or update) - Main entry point WITH image support
 */
export const saveCase = async ({ caseId, caseData, selectedTemplate, customizations, isDraft = false, isEdit = false }) => {

  try {
    let result;
    
    if (caseId || isEdit) {
      result = await updateCase(caseId, caseData, selectedTemplate, customizations);
    } else if (isDraft) {
      result = await createDraftCase(caseData, selectedTemplate);
    } else {
      result = await createCase(caseData, selectedTemplate, customizations);
    }
    
    
    if (!result || !result.id) {
      throw new Error('Save operation did not return a valid case ID');
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Save only customizations
 */
export const saveCustomizations = async (caseId, customizations) => {
  if (!caseId) {
    throw new Error('Case ID is required to save customizations');
  }

  try {
    const response = await api.post(`cases/${caseId}/save_customizations/`, {
      customizations
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a specific template section
 */
export const updateTemplateSection = async (caseId, section, data) => {
  try {
    const response = await api.post(`cases/${caseId}/update_template_section/`, {
      section,
      data
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Deploy a case website
 */
export const deployCaseWebsite = async (caseId, domainConfig = {}) => {
  if (!caseId) {
    throw new Error('Case ID is required for deployment');
  }

  try {
    const response = await api.post(`cases/${caseId}/deploy/`, {
      subdomain: domainConfig.subdomain || '',
      custom_domain: domainConfig.custom_domain || ''
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check deployment status
 */
export const checkDeploymentStatus = async (caseId) => {
  try {
    const response = await api.get(`cases/${caseId}/deployment_status/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get case by ID
 */
export const getCaseById = async (caseId) => {
  if (!caseId) {
    throw new Error('Case ID is required');
  }

  try {
    const response = await api.get(`cases/${caseId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's cases
 */
export const getMyCases = async () => {
  try {
    const response = await api.get('cases/my_cases/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get case statistics
 */
export const getCaseStats = async () => {
  try {
    const response = await api.get('cases/stats/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete case
 */
export const deleteCase = async (caseId) => {
  if (!caseId) {
    throw new Error('Case ID is required');
  }

  try {
    await api.delete(`cases/${caseId}/`);
  } catch (error) {
    throw error;
  }
};

/**
 * Upload case media file (deprecated - use uploadVictimPhoto instead)
 */
export const uploadCaseMedia = async (caseId, file, fieldName) => {
  if (!caseId || !file || !fieldName) {
    throw new Error('Case ID, file, and field name are required');
  }

  
  // For backward compatibility, redirect to appropriate function
  if (fieldName === 'victim_photo') {
    return uploadVictimPhoto(caseId, file);
  }
  
  // Generic media upload
  const formData = new FormData();
  formData.append(fieldName, file);
  
  try {
    const response = await api.patch(`cases/${caseId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

/**
 * Get available templates
 */
export const getTemplates = async () => {
  try {
    const response = await api.get('templates/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get template schema
 */
export const getTemplateSchema = async (templateId) => {
  if (!templateId) {
    throw new Error('Template ID is required');
  }

  try {
    const response = await api.get(`templates/${templateId}/schema/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Compare templates
 */
export const compareTemplates = async () => {
  try {
    const response = await api.get('templates/compare/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// SPOTLIGHT POSTS
// ============================================

/**
 * Get spotlight posts for a case
 */
export const getSpotlightPosts = async (caseId) => {
  try {
    const response = await api.get('spotlight-posts/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create spotlight post
 */
export const createSpotlightPost = async (postData) => {
  try {
    const response = await api.post('spotlight-posts/', postData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update spotlight post
 */
export const updateSpotlightPost = async (postId, postData) => {
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    const response = await api.patch(`spotlight-posts/${postId}/`, postData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Publish spotlight post
 */
export const publishSpotlightPost = async (postId) => {
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    const response = await api.post(`spotlight-posts/${postId}/publish/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Schedule spotlight post
 */
export const scheduleSpotlightPost = async (postId, scheduledFor) => {
  if (!postId || !scheduledFor) {
    throw new Error('Post ID and schedule time are required');
  }

  try {
    const response = await api.post(`spotlight-posts/${postId}/schedule/`, {
      scheduled_for: scheduledFor
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete spotlight post
 */
export const deleteSpotlightPost = async (postId) => {
  if (!postId) {
    throw new Error('Post ID is required');
  }

  try {
    await api.delete(`spotlight-posts/${postId}/`);
  } catch (error) {
    throw error;
  }
};

// ============================================
// CASE PHOTOS
// ============================================

/**
 * Get case photos
 */
export const getCasePhotos = async (caseId) => {
  try {
    const response = await api.get('case-photos/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload case photo (generic photo upload)
 */
export const uploadCasePhoto = async (caseId, file, caption = '') => {
  if (!caseId || !file) {
    throw new Error('Case ID and file are required');
  }

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
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reorder case photos
 */
export const reorderCasePhotos = async (caseId, photoIds) => {
  if (!caseId || !photoIds) {
    throw new Error('Case ID and photo IDs are required');
  }

  try {
    const response = await api.post('case-photos/reorder/', {
      case_id: caseId,
      photo_ids: photoIds
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete case photo
 */
export const deleteCasePhoto = async (photoId) => {
  if (!photoId) {
    throw new Error('Photo ID is required');
  }

  try {
    await api.delete(`case-photos/${photoId}/`);
  } catch (error) {
    throw error;
  }
};

// ============================================
// DEPLOYMENT LOGS
// ============================================

/**
 * Get deployment logs for a case
 */
export const getDeploymentLogs = async (caseId) => {
  try {
    const response = await api.get('deployment-logs/', {
      params: { case_id: caseId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};