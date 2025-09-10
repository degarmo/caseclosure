// @/components/CaseCreator/views/CustomizationView/utils/validationHelpers.js

/**
 * Validate case data before saving
 * @param {Object} caseData - Case data to validate
 * @returns {Object} Validation result
 */
export const validateCaseData = (caseData = {}) => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!caseData.first_name) {
    errors.push('First name is required');
  }
  
  if (!caseData.last_name) {
    errors.push('Last name is required');
  }
  
  if (!caseData.case_type && !caseData.crime_type) {
    errors.push('Case type is required');
  }
  
  // Conditional required fields
  if (caseData.case_type === 'missing' && !caseData.date_missing) {
    warnings.push('Missing date is recommended for missing person cases');
  }
  
  if (caseData.case_type === 'homicide' && !caseData.incident_date && !caseData.date_of_death) {
    warnings.push('Incident date or date of death is recommended for homicide cases');
  }
  
  // Recommended fields
  if (!caseData.primary_photo) {
    warnings.push('Primary photo is recommended for better visibility');
  }
  
  if (!caseData.date_of_birth) {
    warnings.push('Date of birth helps with identification');
  }
  
  if (!caseData.description) {
    warnings.push('A description helps provide context');
  }
  
  if (!caseData.case_number) {
    warnings.push('Case number is recommended');
  }
  
  // Validate email format if provided
  if (caseData.contact_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(caseData.contact_email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Validate phone format if provided
  if (caseData.contact_phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(caseData.contact_phone)) {
      errors.push('Invalid phone number format');
    }
  }
  
  // Validate reward amount if provided
  if (caseData.reward_amount) {
    const amount = parseFloat(caseData.reward_amount);
    if (isNaN(amount) || amount < 0) {
      errors.push('Reward amount must be a positive number');
    }
    if (amount > 1000000) {
      warnings.push('Reward amount seems unusually high');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate subdomain format
 * @param {string} subdomain - Subdomain to validate
 * @returns {Object} Validation result
 */
export const validateSubdomain = (subdomain) => {
  const errors = [];
  
  if (!subdomain) {
    return { valid: false, errors: ['Subdomain is required'] };
  }
  
  // Check length
  if (subdomain.length < 3) {
    errors.push('Subdomain must be at least 3 characters');
  }
  
  if (subdomain.length > 50) {
    errors.push('Subdomain must be less than 50 characters');
  }
  
  // Check format - only lowercase letters, numbers, and hyphens
  const validFormat = /^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$/;
  if (!validFormat.test(subdomain)) {
    errors.push('Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)');
  }
  
  // Check for reserved subdomains
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'test', 'dev', 'staging'];
  if (reserved.includes(subdomain.toLowerCase())) {
    errors.push(`"${subdomain}" is a reserved subdomain`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Validate custom domain format
 * @param {string} domain - Domain to validate
 * @returns {Object} Validation result
 */
export const validateCustomDomain = (domain) => {
  const errors = [];
  
  if (!domain) {
    // Custom domain is optional, so no domain is valid
    return { valid: true, errors: [], warnings: [] };
  }
  
  // Clean the domain
  const cleanDomain = domain.trim().toLowerCase();
  
  // Check for common mistakes
  if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
    errors.push('Domain should not include http:// or https://');
  }
  
  if (cleanDomain.endsWith('/')) {
    errors.push('Domain should not end with a slash');
  }
  
  if (cleanDomain.includes(' ')) {
    errors.push('Domain cannot contain spaces');
  }
  
  // Basic domain format validation
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(cleanDomain)) {
    errors.push('Invalid domain format (example: example.com or subdomain.example.com)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Validate customizations structure
 * @param {Object} customizations - Customizations object to validate
 * @returns {Object} Validation result
 */
export const validateCustomizations = (customizations) => {
  const errors = [];
  const warnings = [];
  
  if (!customizations || typeof customizations !== 'object') {
    errors.push('Invalid customizations format');
    return { valid: false, errors, warnings };
  }
  
  // Check for required customization sections
  if (customizations.global && typeof customizations.global !== 'object') {
    errors.push('Invalid global customizations');
  }
  
  if (customizations.pages && typeof customizations.pages !== 'object') {
    errors.push('Invalid page customizations');
  }
  
  if (!customizations.metadata) {
    warnings.push('Metadata is missing');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    minWidth = 200,
    minHeight = 200,
    maxWidth = 4000,
    maxHeight = 4000
  } = options;
  
  const errors = [];
  const warnings = [];
  
  if (!file) {
    return { valid: false, errors: ['No file provided'], warnings };
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkDimensions: async () => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const dimensionErrors = [];
          const dimensionWarnings = [];
          
          if (img.width < minWidth || img.height < minHeight) {
            dimensionErrors.push(`Image must be at least ${minWidth}x${minHeight}px`);
          }
          
          if (img.width > maxWidth || img.height > maxHeight) {
            dimensionErrors.push(`Image must be no larger than ${maxWidth}x${maxHeight}px`);
          }
          
          resolve({
            valid: dimensionErrors.length === 0,
            errors: dimensionErrors,
            warnings: dimensionWarnings,
            dimensions: {
              width: img.width,
              height: img.height
            }
          });
        };
        
        img.onerror = () => {
          resolve({
            valid: false,
            errors: ['Failed to load image'],
            warnings: [],
            dimensions: null
          });
        };
        
        img.src = URL.createObjectURL(file);
      });
    }
  };
};

/**
 * Validate color format
 * @param {string} color - Color value to validate
 * @returns {Object} Validation result
 */
export const validateColor = (color) => {
  const errors = [];
  const warnings = [];
  
  if (!color) {
    return { valid: true, errors, warnings }; // Color is optional
  }
  
  // Check hex format
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
  
  if (!hexRegex.test(color) && !rgbRegex.test(color) && !rgbaRegex.test(color)) {
    errors.push('Invalid color format. Use hex (#RRGGBB), rgb(), or rgba()');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export const validateURL = (url) => {
  const errors = [];
  const warnings = [];
  
  if (!url) {
    return { valid: true, errors, warnings }; // URL is optional
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use http or https protocol');
    }
  } catch (error) {
    errors.push('Invalid URL format');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate social media links
 * @param {Object} links - Social media links object
 * @returns {Object} Validation result
 */
export const validateSocialMediaLinks = (links = {}) => {
  const errors = [];
  const warnings = [];
  
  const socialPatterns = {
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/,
    twitter: /^https?:\/\/(www\.)?(twitter|x)\.com\/.+/,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/
  };
  
  for (const [platform, url] of Object.entries(links)) {
    if (url) {
      // Check if URL is valid
      const urlValidation = validateURL(url);
      if (!urlValidation.valid) {
        errors.push(`${platform}: ${urlValidation.errors[0]}`);
        continue;
      }
      
      // Check if URL matches expected pattern
      if (socialPatterns[platform] && !socialPatterns[platform].test(url)) {
        warnings.push(`${platform}: URL doesn't match expected ${platform} format`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate date format and range
 * @param {string} date - Date string to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateDate = (date, options = {}) => {
  const {
    minDate = null,
    maxDate = new Date(),
    required = false
  } = options;
  
  const errors = [];
  const warnings = [];
  
  if (!date && required) {
    errors.push('Date is required');
    return { valid: false, errors, warnings };
  }
  
  if (date) {
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    } else {
      // Check date range
      if (minDate && dateObj < new Date(minDate)) {
        errors.push(`Date must be after ${new Date(minDate).toLocaleDateString()}`);
      }
      
      if (maxDate && dateObj > new Date(maxDate)) {
        errors.push(`Date must be before ${new Date(maxDate).toLocaleDateString()}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate text content
 * @param {string} text - Text to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateTextContent = (text, options = {}) => {
  const {
    minLength = 0,
    maxLength = 10000,
    required = false,
    allowHtml = false,
    profanityCheck = false
  } = options;
  
  const errors = [];
  const warnings = [];
  
  if (!text && required) {
    errors.push('Text is required');
    return { valid: false, errors, warnings };
  }
  
  if (text) {
    // Check length
    if (text.length < minLength) {
      errors.push(`Text must be at least ${minLength} characters`);
    }
    
    if (text.length > maxLength) {
      errors.push(`Text must be no more than ${maxLength} characters`);
    }
    
    // Check for HTML if not allowed
    if (!allowHtml && /<[^>]*>/.test(text)) {
      errors.push('HTML tags are not allowed');
    }
    
    // Check for suspicious content
    if (text.includes('<script')) {
      errors.push('Script tags are not allowed');
    }
    
    // Basic profanity check placeholder
    if (profanityCheck) {
      // Add your profanity patterns here if needed
      // warnings.push('Content may contain inappropriate language');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Safely merge validation results
 * @param {Array} results - Array of validation results
 * @returns {Object} Merged validation result
 */
const mergeValidationResults = (results) => {
  const errors = [];
  const warnings = [];
  
  results.forEach(result => {
    if (result && result.errors && Array.isArray(result.errors)) {
      errors.push(...result.errors);
    }
    if (result && result.warnings && Array.isArray(result.warnings)) {
      warnings.push(...result.warnings);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate entire form before deployment
 * @param {Object} data - Complete form data
 * @returns {Object} Comprehensive validation result
 */
export const validateForDeployment = ({ caseData = {}, customizations = {} } = {}) => {
  const results = [];
  
  // Validate case data
  const caseValidation = validateCaseData(caseData);
  results.push(caseValidation);
  
  // Validate customizations
  const customizationsValidation = validateCustomizations(customizations);
  results.push(customizationsValidation);
  
  // Validate subdomain (required for deployment)
  if (!caseData.subdomain) {
    results.push({
      valid: false,
      errors: ['Subdomain is required for deployment'],
      warnings: []
    });
  } else {
    const subdomainValidation = validateSubdomain(caseData.subdomain);
    results.push(subdomainValidation);
  }
  
  // Validate custom domain (optional)
  if (caseData.custom_domain) {
    const domainValidation = validateCustomDomain(caseData.custom_domain);
    results.push(domainValidation);
  }
  
  // Template validation
  if (!caseData.template_id) {
    results.push({
      valid: true,
      errors: [],
      warnings: ['No template selected, using default']
    });
  }
  
  // Merge all results
  const merged = mergeValidationResults(results);
  
  // Add details for debugging
  merged.details = {
    caseData: caseValidation,
    customizations: customizationsValidation,
    subdomain: caseData.subdomain ? validateSubdomain(caseData.subdomain) : null,
    customDomain: caseData.custom_domain ? validateCustomDomain(caseData.custom_domain) : null
  };
  
  return merged;
};

/**
 * Check if deployment is needed based on changes
 * @param {Object} currentData - Current form data
 * @param {Object} lastDeployedData - Last deployed data
 * @returns {boolean} Whether deployment is needed
 */
export const isDeploymentNeeded = (currentData, lastDeployedData) => {
  if (!lastDeployedData) {
    return true; // Never deployed
  }
  
  // Normalize data for comparison
  const normalize = (data) => {
    if (!data) return '';
    try {
      return JSON.stringify(data, Object.keys(data).sort());
    } catch (e) {
      console.error('Error normalizing data for comparison:', e);
      return '';
    }
  };
  
  const currentString = normalize(currentData);
  const deployedString = normalize(lastDeployedData);
  
  return currentString !== deployedString;
};

/**
 * Validate all data before saving (less strict than deployment)
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
export const validateForSave = ({ caseData = {}, customizations = {} } = {}) => {
  const results = [];
  
  // Basic validation for saving (less strict)
  if (!caseData.first_name || !caseData.last_name) {
    results.push({
      valid: false,
      errors: ['First and last name are required'],
      warnings: []
    });
  }
  
  // Validate customizations if present
  if (customizations && Object.keys(customizations).length > 0) {
    const customizationsValidation = validateCustomizations(customizations);
    results.push(customizationsValidation);
  }
  
  return mergeValidationResults(results);
};

/**
 * Get validation summary for UI display
 * @param {Object} validation - Validation result
 * @returns {Object} Summary for UI
 */
export const getValidationSummary = (validation) => {
  if (!validation) {
    return {
      status: 'unknown',
      message: 'No validation performed',
      errorCount: 0,
      warningCount: 0
    };
  }
  
  const errorCount = validation.errors?.length || 0;
  const warningCount = validation.warnings?.length || 0;
  
  let status = 'valid';
  let message = 'Ready to deploy';
  
  if (errorCount > 0) {
    status = 'error';
    message = `${errorCount} error${errorCount !== 1 ? 's' : ''} must be fixed`;
  } else if (warningCount > 0) {
    status = 'warning';
    message = `${warningCount} warning${warningCount !== 1 ? 's' : ''} to review`;
  }
  
  return {
    status,
    message,
    errorCount,
    warningCount,
    errors: validation.errors || [],
    warnings: validation.warnings || []
  };
};