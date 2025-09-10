// @/components/CaseCreator/views/CustomizationView/utils/index.js

/**
 * Export all utility functions from a single entry point
 */

// Customization Helpers
export {
  deepClone,
  updateNestedProperty,
  getNestedProperty,
  mergeCustomizations,
  validateCustomizations,
  createInitialCustomizations,
  updateCustomization,
  hasUnsavedChanges,
  getCustomizationValue,
  formatCustomizationsForAPI,
  diffCustomizations
} from './customizationHelpers';

// Deployment Helpers
export {
  DEPLOYMENT_STATUS,
  SAVE_STATUS,
  validateSubdomain,
  validateCustomDomain,
  formatDeploymentConfig,
  isDeploymentNeeded,
  formatDeploymentURL,
  getDeploymentStatusMessage,
  estimateDeploymentTime,
  retryDeployment,
  checkDeploymentHealth,
  formatDeploymentError,
  createRollbackPoint
} from './deploymentHelpers';

// Validation Helpers
export {
  validateCaseData,
  validateImageFile,
  validateColor,
  validateURL,
  validateSocialMediaLinks,
  validateDate,
  validateTextContent,
  validateForDeployment
} from './validationHelpers';