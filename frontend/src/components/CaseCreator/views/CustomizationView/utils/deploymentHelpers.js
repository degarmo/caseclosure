// @/components/CaseCreator/views/CustomizationView/utils/deploymentHelpers.js

/**
 * Deployment status types
 */
export const DEPLOYMENT_STATUS = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  DEPLOYING: 'deploying',
  CHECKING: 'checking',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Save status types
 */
export const SAVE_STATUS = {
  IDLE: null,
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Validate subdomain format
 * @param {string} subdomain - Subdomain to validate
 * @returns {Object} Validation result
 */
export const validateSubdomain = (subdomain) => {
  const errors = [];
  
  if (!subdomain) {
    errors.push('Subdomain is required');
  } else {
    // Check length
    if (subdomain.length < 3) {
      errors.push('Subdomain must be at least 3 characters');
    }
    if (subdomain.length > 63) {
      errors.push('Subdomain must be less than 63 characters');
    }
    
    // Check format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      errors.push('Subdomain can only contain lowercase letters, numbers, and hyphens');
    }
    
    // Check start/end characters
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      errors.push('Subdomain cannot start or end with a hyphen');
    }
    
    // Check for consecutive hyphens
    if (subdomain.includes('--')) {
      errors.push('Subdomain cannot contain consecutive hyphens');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate custom domain format
 * @param {string} domain - Domain to validate
 * @returns {Object} Validation result
 */
export const validateCustomDomain = (domain) => {
  const errors = [];
  
  if (domain) {
    // Basic domain validation
    const domainRegex = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      errors.push('Invalid domain format');
    }
    
    // Check for protocol (should not include)
    if (domain.includes('://')) {
      errors.push('Domain should not include protocol (http:// or https://)');
    }
    
    // Check for path (should not include)
    if (domain.includes('/')) {
      errors.push('Domain should not include path');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Format deployment configuration
 * @param {Object} caseData - Case data
 * @param {Object} customizations - Customizations
 * @returns {Object} Deployment configuration
 */
export const formatDeploymentConfig = (caseData, customizations) => {
  return {
    subdomain: caseData.subdomain,
    custom_domain: caseData.custom_domain,
    template_id: customizations?.metadata?.template_id || 'beacon',
    template_data: customizations,
    deployment_settings: {
      enable_ssl: true,
      enable_cdn: true,
      enable_analytics: caseData.enable_analytics !== false,
      maintenance_mode: false
    },
    metadata: {
      deployed_at: new Date().toISOString(),
      deployed_by: 'user', // This would come from auth context
      environment: 'production'
    }
  };
};

/**
 * Check if deployment is needed
 * @param {Object} current - Current state
 * @param {Object} deployed - Last deployed state
 * @returns {boolean} True if deployment is needed
 */
export const isDeploymentNeeded = (current, deployed) => {
  if (!deployed) return true;
  
  // Check if customizations changed
  if (JSON.stringify(current.customizations) !== JSON.stringify(deployed.customizations)) {
    return true;
  }
  
  // Check if case data changed
  const relevantFields = ['subdomain', 'custom_domain', 'first_name', 'last_name', 'primary_photo'];
  for (const field of relevantFields) {
    if (current.caseData?.[field] !== deployed.caseData?.[field]) {
      return true;
    }
  }
  
  return false;
};

/**
 * Format deployment URL
 * @param {string} subdomain - Subdomain
 * @param {string} customDomain - Custom domain (optional)
 * @returns {string} Formatted URL
 */
export const formatDeploymentURL = (subdomain, customDomain) => {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  return `https://${subdomain}.findthem.com`;
};

/**
 * Get deployment status message
 * @param {string} status - Deployment status
 * @returns {Object} Status message and type
 */
export const getDeploymentStatusMessage = (status) => {
  const messages = {
    [DEPLOYMENT_STATUS.IDLE]: {
      message: 'Ready to deploy',
      type: 'info'
    },
    [DEPLOYMENT_STATUS.PREPARING]: {
      message: 'Preparing deployment...',
      type: 'loading'
    },
    [DEPLOYMENT_STATUS.DEPLOYING]: {
      message: 'Deploying website...',
      type: 'loading'
    },
    [DEPLOYMENT_STATUS.CHECKING]: {
      message: 'Verifying deployment...',
      type: 'loading'
    },
    [DEPLOYMENT_STATUS.COMPLETED]: {
      message: 'Deployment successful!',
      type: 'success'
    },
    [DEPLOYMENT_STATUS.FAILED]: {
      message: 'Deployment failed. Please try again.',
      type: 'error'
    },
    [DEPLOYMENT_STATUS.CANCELLED]: {
      message: 'Deployment cancelled',
      type: 'warning'
    }
  };
  
  return messages[status] || messages[DEPLOYMENT_STATUS.IDLE];
};

/**
 * Estimate deployment time
 * @param {Object} config - Deployment configuration
 * @returns {number} Estimated time in seconds
 */
export const estimateDeploymentTime = (config) => {
  let baseTime = 30; // Base 30 seconds
  
  // Add time for custom domain
  if (config.custom_domain) {
    baseTime += 20;
  }
  
  // Add time for large customizations
  const customizationSize = JSON.stringify(config.template_data).length;
  if (customizationSize > 10000) {
    baseTime += 10;
  }
  
  // Add time for media
  if (config.has_media) {
    baseTime += 15;
  }
  
  return baseTime;
};

/**
 * Retry deployment with exponential backoff
 * @param {Function} deployFunction - Deployment function
 * @param {number} maxRetries - Maximum retries
 * @returns {Promise} Deployment result
 */
export const retryDeployment = async (deployFunction, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await deployFunction();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors
      if (error.type === 'validation') {
        throw error;
      }
      
      // Exponential backoff
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Check deployment health
 * @param {string} url - Deployment URL
 * @returns {Promise<Object>} Health check result
 */
export const checkDeploymentHealth = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    return {
      healthy: true,
      url,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Format deployment error
 * @param {Error} error - Error object
 * @returns {Object} Formatted error
 */
export const formatDeploymentError = (error) => {
  if (error.response?.data) {
    return {
      title: 'Deployment Failed',
      message: error.response.data.message || 'An error occurred during deployment',
      details: error.response.data.details,
      code: error.response.status
    };
  }
  
  if (error.message) {
    return {
      title: 'Deployment Error',
      message: error.message,
      details: null,
      code: null
    };
  }
  
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred',
    details: null,
    code: null
  };
};

/**
 * Create deployment rollback point
 * @param {Object} currentState - Current state before deployment
 * @returns {Object} Rollback point
 */
export const createRollbackPoint = (currentState) => {
  return {
    timestamp: new Date().toISOString(),
    customizations: JSON.parse(JSON.stringify(currentState.customizations)),
    caseData: JSON.parse(JSON.stringify(currentState.caseData)),
    version: currentState.version || '1.0.0'
  };
};