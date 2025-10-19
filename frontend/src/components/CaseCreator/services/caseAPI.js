// src/components/CaseCreator/services/caseAPI.js

import api from "@/api/axios";

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
    
    console.log('[caseAPI] Image uploaded to Cloudinary:', response.data);
    return response.data.url; // This is now a Cloudinary URL, not base64!
    
  } catch (error) {
    console.error('[caseAPI] Error uploading image:', error);
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
  console.log('=== PREPARING CASE PAYLOAD ===');
  console.log('Input caseData:', caseData);
  console.log('crime_type from form:', caseData.crime_type);
  console.log('case_type from form:', caseData.case_type);
  console.log('incident_city from form:', caseData.incident_city);
  console.log('incident_state from form:', caseData.incident_state);
  
  // Determine the correct case type - prioritize crime_type from the form
  let determinedCaseType = null;
  
  // Check multiple possible field names
  if (caseData.crime_type) {
    determinedCaseType = caseData.crime_type;
    console.log('✓ Using crime_type:', determinedCaseType);
  } else if (caseData.case_type) {
    determinedCaseType = caseData.case_type;
    console.log('✓ Using case_type:', determinedCaseType);
  } else if (caseData.type) {
    determinedCaseType = caseData.type;
    console.log('✓ Using type:', determinedCaseType);
  } else {
    determinedCaseType = 'missing'; // Default fallback
    console.log('⚠ No case type found, defaulting to:', determinedCaseType);
  }
  
  // Validate and log the final case type
  console.log('FINAL CASE TYPE DETERMINED:', determinedCaseType);
  if (determinedCaseType === 'homicide') {
    console.log('✅ CONFIRMED: This is a HOMICIDE case');
  } else if (determinedCaseType === 'missing') {
    console.log('✅ CONFIRMED: This is a MISSING PERSON case');
  } else {
    console.log('✅ CONFIRMED: Case type is:', determinedCaseType);
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
    console.log('Note: victim_photo file detected but will be handled separately');
  }

  // Final validation log
  console.log('=== FINAL PAYLOAD ===');
  console.log('Payload case_type:', payload.case_type);
  console.log('Payload crime_type:', payload.crime_type);
  console.log('Payload incident_city:', payload.incident_city);
  console.log('Payload incident_state:', payload.incident_state);
  console.log('Full payload:', JSON.stringify(payload, null, 2));
  console.log('=== END PAYLOAD PREPARATION ===');
  
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
    console.log('[caseAPI] Victim photo uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error uploading victim photo:', error.response?.data || error);
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
    
    console.log('[caseAPI] Creating case with case_type:', payload.case_type);
    console.log('[caseAPI] Creating case with location:', {
      city: payload.incident_city,
      state: payload.incident_state
    });
    console.log('[caseAPI] Full payload being sent:', payload);
    
    const response = await api.post('cases/', payload);
    
    console.log('[caseAPI] Create case response:', {
      status: response.status,
      data: response.data,
      case_type_in_response: response.data?.case_type,
      crime_type_in_response: response.data?.crime_type,
      incident_city_in_response: response.data?.incident_city,
      incident_state_in_response: response.data?.incident_state,
      headers: response.headers
    });
    
    // Verify the case type was saved correctly
    if (response.data) {
      const savedCaseType = response.data.case_type || response.data.crime_type || response.data.type;
      if (savedCaseType !== payload.case_type) {
        console.error('⚠️ WARNING: Case type mismatch!');
        console.error('Sent:', payload.case_type);
        console.error('Received:', savedCaseType);
        console.error('This indicates a backend issue - the backend is not saving the case type correctly');
      } else {
        console.log('✅ Case type saved correctly as:', savedCaseType);
      }
      
      // Verify location fields were saved
      if (payload.incident_city && !response.data.incident_city) {
        console.error('⚠️ WARNING: City was not saved!');
      }
      if (payload.incident_state && !response.data.incident_state) {
        console.error('⚠️ WARNING: State was not saved!');
      }
    }
    
    // Ensure we have data
    if (!response.data || !response.data.id) {
      console.error('[caseAPI] No data in response');
      throw new Error('No data returned from server');
    }
    
    const createdCase = response.data;
    console.log('[caseAPI] Case created successfully:', createdCase);
    
    // Step 3: Upload the victim photo if provided
    if (imageFile && imageFile instanceof File) {
      console.log('[caseAPI] Uploading victim photo for case:', createdCase.id);
      
      try {
        const photoResult = await uploadVictimPhoto(createdCase.id, imageFile);
        console.log('[caseAPI] Photo uploaded successfully:', photoResult);
        
        // Optionally merge photo data into case response
        createdCase.victim_photo_url = photoResult.image;
      } catch (photoError) {
        console.error('[caseAPI] Failed to upload photo, but case was created:', photoError);
        // Don't throw - case was created successfully, photo upload is secondary
      }
    }
    
    return createdCase;
    
  } catch (error) {
    console.error('[caseAPI] Error creating case:', {
      message: error.message,
      response: error.response,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    });
    
    // Log specific field errors if they exist
    if (error.response?.data) {
      if (error.response.data.case_type) {
        console.error('Backend error for case_type field:', error.response.data.case_type);
      }
      if (error.response.data.crime_type) {
        console.error('Backend error for crime_type field:', error.response.data.crime_type);
      }
      if (error.response.data.incident_city) {
        console.error('Backend error for incident_city field:', error.response.data.incident_city);
      }
      if (error.response.data.incident_state) {
        console.error('Backend error for incident_state field:', error.response.data.incident_state);
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
  
  console.log('[caseAPI] Creating draft with case type:', draftCaseType);
  
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

  console.log('[caseAPI] Draft payload:', payload);

  try {
    const response = await api.post('cases/draft/', payload);
    console.log('[caseAPI] Draft created with case_type:', response.data?.case_type);
    
    const createdDraft = response.data;
    
    // Optionally upload image even for draft
    if (imageFile && createdDraft.id) {
      try {
        const photoResult = await uploadVictimPhoto(createdDraft.id, imageFile);
        createdDraft.victim_photo_url = photoResult.image;
      } catch (photoError) {
        console.log('[caseAPI] Draft created but photo upload failed:', photoError);
      }
    }
    
    return createdDraft;
  } catch (error) {
    // If draft endpoint doesn't exist, fall back to regular create
    if (error.response?.status === 404) {
      console.log('[caseAPI] Draft endpoint not found, using regular create');
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
    
    console.log('[caseAPI] Updating case:', caseId);
    console.log('[caseAPI] Update payload case_type:', payload.case_type);
    console.log('[caseAPI] Update payload location:', {
      city: payload.incident_city,
      state: payload.incident_state
    });
    console.log('[caseAPI] Full update payload:', payload);
    
    const response = await api.patch(`cases/${caseId}/`, payload);
    
    console.log('[caseAPI] Update response:', response.data);
    
    // Verify the case type was updated correctly
    if (response.data) {
      const savedCaseType = response.data.case_type || response.data.crime_type || response.data.type;
      if (savedCaseType !== payload.case_type) {
        console.error('⚠️ WARNING: Case type mismatch after update!');
        console.error('Sent:', payload.case_type);
        console.error('Received:', savedCaseType);
      } else {
        console.log('✅ Case type updated correctly to:', savedCaseType);
      }
      
      // Verify location fields were updated
      console.log('✅ Location updated:', {
        city: response.data.incident_city,
        state: response.data.incident_state
      });
    }
    
    const updatedCase = response.data;
    
    // Step 3: Upload new victim photo if provided
    if (imageFile && imageFile instanceof File) {
      console.log('[caseAPI] Uploading new victim photo for case:', caseId);
      
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
      } catch (photoError) {
        console.error('[caseAPI] Failed to update photo:', photoError);
      }
    }
    
    return updatedCase;
    
  } catch (error) {
    console.error('[caseAPI] Error updating case:', error.response?.data || error);
    throw error;
  }
};

/**
 * Save case (create or update) - Main entry point WITH image support
 */
export const saveCase = async ({ caseId, caseData, selectedTemplate, customizations, isDraft = false, isEdit = false }) => {
  console.log('[caseAPI] saveCase called:', {
    hasCaseId: !!caseId,
    hasImage: !!caseData.victim_photo,
    imageType: caseData.victim_photo?.type,
    caseId,
    isDraft,
    isEdit,
    templateId: selectedTemplate?.id,
    caseType: caseData.crime_type || caseData.case_type,
    location: {
      city: caseData.incident_city,
      state: caseData.incident_state
    },
    rawCaseData: caseData
  });

  try {
    let result;
    
    if (caseId || isEdit) {
      result = await updateCase(caseId, caseData, selectedTemplate, customizations);
    } else if (isDraft) {
      result = await createDraftCase(caseData, selectedTemplate);
    } else {
      result = await createCase(caseData, selectedTemplate, customizations);
    }
    
    console.log('[caseAPI] saveCase result:', result);
    console.log('[caseAPI] Saved case type:', result?.case_type || result?.crime_type);
    console.log('[caseAPI] Saved location:', {
      city: result?.incident_city,
      state: result?.incident_state
    });
    
    if (!result || !result.id) {
      throw new Error('Save operation did not return a valid case ID');
    }
    
    return result;
  } catch (error) {
    console.error('[caseAPI] saveCase error:', error);
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
    console.log('[caseAPI] Customizations saved:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error saving customizations:', error.response?.data || error);
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
    console.log(`[caseAPI] Section ${section} updated:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[caseAPI] Error updating section ${section}:`, error.response?.data || error);
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
    console.log('[caseAPI] Deployment initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error deploying website:', error.response?.data || error);
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
    console.error('[caseAPI] Error checking deployment status:', error.response?.data || error);
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
    console.log('[caseAPI] Fetched case:', response.data);
    console.log('[caseAPI] Fetched case type:', response.data?.case_type || response.data?.crime_type);
    console.log('[caseAPI] Fetched location:', {
      city: response.data?.incident_city,
      state: response.data?.incident_state
    });
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error fetching case:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching cases:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching stats:', error.response?.data || error);
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
    console.log('[caseAPI] Case deleted successfully');
  } catch (error) {
    console.error('[caseAPI] Error deleting case:', error.response?.data || error);
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

  console.warn('[caseAPI] uploadCaseMedia is deprecated. Use uploadVictimPhoto or uploadCasePhoto instead.');
  
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
    console.log('[caseAPI] Media uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error uploading media:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching templates:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching template schema:', error.response?.data || error);
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
    console.error('[caseAPI] Error comparing templates:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching spotlight posts:', error.response?.data || error);
    throw error;
  }
};

/**
 * Create spotlight post
 */
export const createSpotlightPost = async (postData) => {
  try {
    const response = await api.post('spotlight-posts/', postData);
    console.log('[caseAPI] Spotlight post created:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error creating spotlight post:', error.response?.data || error);
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
    console.log('[caseAPI] Spotlight post updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error updating spotlight post:', error.response?.data || error);
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
    console.log('[caseAPI] Spotlight post published:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error publishing spotlight post:', error.response?.data || error);
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
    console.log('[caseAPI] Spotlight post scheduled:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error scheduling spotlight post:', error.response?.data || error);
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
    console.log('[caseAPI] Spotlight post deleted');
  } catch (error) {
    console.error('[caseAPI] Error deleting spotlight post:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching case photos:', error.response?.data || error);
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
    console.log('[caseAPI] Photo uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error uploading photo:', error.response?.data || error);
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
    console.log('[caseAPI] Photos reordered successfully');
    return response.data;
  } catch (error) {
    console.error('[caseAPI] Error reordering photos:', error.response?.data || error);
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
    console.log('[caseAPI] Photo deleted successfully');
  } catch (error) {
    console.error('[caseAPI] Error deleting photo:', error.response?.data || error);
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
    console.error('[caseAPI] Error fetching deployment logs:', error.response?.data || error);
    throw error;
  }
};