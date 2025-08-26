// src/components/CaseCreator/utils.js

/**
 * Calculate age from birth date
 * @param {string} birthDate - Date string in YYYY-MM-DD format
 * @returns {number|string} Age in years or empty string if no birthDate
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return '';
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get all editable zones from template schema
 * @param {Object} template - Template object with schema
 * @returns {Array} Array of editable zones
 */
export const getEditableZones = (template) => {
  const zones = [];
  
  if (!template?.schema) return zones;
  
  // Process global settings
  if (template.schema.global) {
    Object.entries(template.schema.global).forEach(([key, config]) => {
      zones.push({
        id: `global.${key}`,
        path: `global.${key}`,
        label: config.label || key,
        type: config.type || 'text',
        ...config
      });
    });
  }
  
  // Process page settings
  if (template.schema.pages) {
    Object.entries(template.schema.pages).forEach(([page, sections]) => {
      Object.entries(sections).forEach(([key, config]) => {
        if (typeof config === 'object' && config.type) {
          zones.push({
            id: `pages.${page}.${key}`,
            path: `pages.${page}.${key}`,
            label: config.label || key,
            type: config.type || 'text',
            ...config
          });
        }
      });
    });
  }
  
  // Process sections if they exist
  if (template.schema.sections) {
    Object.entries(template.schema.sections).forEach(([section, fields]) => {
      Object.entries(fields).forEach(([key, config]) => {
        if (typeof config === 'object' && config.type) {
          zones.push({
            id: `sections.${section}.${key}`,
            path: `sections.${section}.${key}`,
            label: config.label || key,
            type: config.type || 'text',
            ...config
          });
        }
      });
    });
  }
  
  return zones;
};

/**
 * Initialize customizations based on template zones
 * @param {Object} template - Template object
 * @returns {Object} Initial customizations object
 */
export const initializeCustomizations = (template) => {
  if (!template) return {};
  
  const zones = getEditableZones(template);
  const initialCustomizations = {};
  
  zones.forEach(zone => {
    // Set path-based value with defaults
    const keys = zone.path.split('.');
    let current = initialCustomizations;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = zone.default || '';
  });
  
  return initialCustomizations;
};

/**
 * Get value from nested object using dot notation path
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path (e.g., 'pages.home.title')
 * @returns {*} Value at path or undefined
 */
export const getValueByPath = (obj, path) => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value;
};

/**
 * Set value in nested object using dot notation path
 * @param {Object} obj - Target object (will be mutated)
 * @param {string} path - Dot notation path
 * @param {*} value - Value to set
 * @returns {Object} Modified object
 */
export const setValueByPath = (obj, path, value) => {
  const keys = path.split('.');
  const newObj = { ...obj };
  let current = newObj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  return newObj;
};

/**
 * Group zones by section
 * @param {Array} zones - Array of zone objects
 * @returns {Object} Zones grouped by section
 */
export const groupZonesBySection = (zones) => {
  return zones.reduce((acc, zone) => {
    if (!acc[zone.section]) acc[zone.section] = [];
    acc[zone.section].push(zone);
    return acc;
  }, {});
};

/**
 * Validate required fields
 * @param {Object} caseData - Case data object
 * @returns {Object} Errors object with field names as keys
 */
export const validateRequiredFields = (caseData) => {
  const errors = {};
  
  // Always required fields
  if (!caseData.first_name) errors.first_name = 'Required';
  if (!caseData.last_name) errors.last_name = 'Required';
  if (!caseData.crime_type) errors.crime_type = 'Required';
  
  // Conditional requirements based on crime type
  if (caseData.crime_type === 'missing' && !caseData.last_seen_date) {
    errors.last_seen_date = 'Required for missing persons';
  }
  
  if (caseData.crime_type === 'homicide' && !caseData.date_of_death) {
    errors.date_of_death = 'Required for homicides';
  }
  
  return errors;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number string
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX if US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Sanitize subdomain input
 * @param {string} input - User input for subdomain
 * @returns {string} Sanitized subdomain
 */
export const sanitizeSubdomain = (input) => {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '');
};

/**
 * Read file as data URL
 * @param {File} file - File object
 * @returns {Promise<string>} Promise resolving to data URL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parse API error response
 * @param {Error} error - Error object from API call
 * @returns {string} Human-readable error message
 */
export const parseAPIError = (error) => {
  let errorMessage = 'An error occurred. ';
  
  if (error.response?.data) {
    if (typeof error.response.data === 'object') {
      const errors = Object.entries(error.response.data);
      if (errors.length > 0) {
        errorMessage = errors.map(([field, msgs]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        ).join('; ');
      }
    } else if (typeof error.response.data === 'string') {
      errorMessage = error.response.data;
    }
  } else {
    errorMessage += error.message || 'Unknown error occurred.';
  }
  
  return errorMessage;
};