// @/components/CaseCreator/views/CustomizationView/utils/customizationHelpers.js

import { getDefaultCustomizations } from '../constants/templateRegistry';

/**
 * Create initial customizations structure
 * @param {Object} initialData - Initial data if any
 * @param {string} templateId - Template ID
 * @returns {Object} Initial customizations
 */
export const createInitialCustomizations = (initialData, templateId = 'beacon') => {
  if (initialData?.customizations) {
    return {
      customizations: initialData.customizations,
      metadata: initialData.metadata || {
        template_id: templateId,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString()
      }
    };
  }
  
  return getDefaultCustomizations(templateId);
};

/**
 * Update a customization value at a specific path
 * @param {Object} customizations - Current customizations
 * @param {string} path - Dot notation path (e.g., 'global.primaryColor')
 * @param {*} value - New value
 * @returns {Object} Updated customizations
 */
export const updateCustomization = (customizations, path, value) => {
  const updated = JSON.parse(JSON.stringify(customizations)); // Deep clone
  const keys = path.split('.');
  let current = updated.customizations;
  
  // Navigate to the parent of the target
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  // Set the value
  current[keys[keys.length - 1]] = value;
  
  // Update metadata
  updated.metadata = {
    ...updated.metadata,
    last_edited: new Date().toISOString()
  };
  
  return updated;
};

/**
 * Check if there are unsaved changes
 * @param {Object} current - Current customizations
 * @param {Object} saved - Last saved customizations
 * @returns {boolean} True if there are unsaved changes
 */
export const hasUnsavedChanges = (current, saved) => {
  try {
    return JSON.stringify(current) !== JSON.stringify(saved);
  } catch (error) {
    console.error('Error comparing customizations:', error);
    return false;
  }
};

/**
 * Validate customizations structure
 * @param {Object} customizations - Customizations to validate
 * @returns {Object} Validation result
 */
export const validateCustomizations = (customizations) => {
  const errors = [];
  const warnings = [];
  
  if (!customizations) {
    errors.push('Customizations object is missing');
    return { valid: false, errors, warnings };
  }
  
  if (!customizations.customizations) {
    errors.push('Customizations data is missing');
  }
  
  if (!customizations.metadata) {
    warnings.push('Metadata is missing');
  }
  
  // Validate global customizations
  if (customizations.customizations?.global) {
    const global = customizations.customizations.global;
    
    // Validate colors
    if (global.primaryColor && !isValidColor(global.primaryColor)) {
      errors.push('Invalid primary color format');
    }
    if (global.accentColor && !isValidColor(global.accentColor)) {
      errors.push('Invalid accent color format');
    }
    
    // Validate font
    if (global.fontFamily && typeof global.fontFamily !== 'string') {
      errors.push('Font family must be a string');
    }
  }
  
  // Validate pages
  if (customizations.customizations?.pages) {
    const pages = customizations.customizations.pages;
    
    Object.entries(pages).forEach(([pageName, pageConfig]) => {
      if (typeof pageConfig.enabled !== 'boolean') {
        warnings.push(`Page '${pageName}' enabled state should be boolean`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Format customizations for API submission
 * @param {Object} customizations - Customizations to format
 * @returns {Object} Formatted customizations
 */
export const formatCustomizationsForAPI = (customizations) => {
  return {
    customizations: customizations.customizations,
    metadata: {
      ...customizations.metadata,
      last_edited: new Date().toISOString()
    }
  };
};

/**
 * Get differences between two customization objects
 * @param {Object} oldCustom - Old customizations
 * @param {Object} newCustom - New customizations
 * @returns {Object} Differences
 */
export const diffCustomizations = (oldCustom, newCustom) => {
  const changes = [];
  
  const compareObjects = (obj1, obj2, path = '') => {
    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {})
    ]);
    
    allKeys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const value1 = obj1?.[key];
      const value2 = obj2?.[key];
      
      if (typeof value1 === 'object' && typeof value2 === 'object' && 
          value1 !== null && value2 !== null && !Array.isArray(value1)) {
        // Recursively compare objects
        compareObjects(value1, value2, newPath);
      } else if (value1 !== value2) {
        changes.push({
          path: newPath,
          oldValue: value1,
          newValue: value2
        });
      }
    });
  };
  
  compareObjects(
    oldCustom?.customizations, 
    newCustom?.customizations
  );
  
  return changes;
};

/**
 * Get a specific customization value by path
 * @param {Object} customizations - Customizations object
 * @param {string} path - Dot notation path
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Value at path or default
 */
export const getCustomizationValue = (customizations, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let current = customizations.customizations;
    
    for (const key of keys) {
      if (current?.[key] === undefined) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  } catch (error) {
    console.error('Error getting customization value:', error);
    return defaultValue;
  }
};

/**
 * Merge customizations with defaults
 * @param {Object} custom - Custom customizations
 * @param {Object} defaults - Default customizations
 * @returns {Object} Merged customizations
 */
export const mergeCustomizations = (custom, defaults) => {
  const deepMerge = (target, source) => {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          if (!(key in target)) {
            output[key] = source[key];
          }
        }
      });
    }
    
    return output;
  };
  
  return {
    customizations: deepMerge(
      custom?.customizations || {},
      defaults?.customizations || {}
    ),
    metadata: {
      ...defaults?.metadata,
      ...custom?.metadata,
      last_edited: new Date().toISOString()
    }
  };
};

/**
 * Apply theme to customizations
 * @param {Object} customizations - Current customizations
 * @param {Object} theme - Theme to apply
 * @returns {Object} Updated customizations
 */
export const applyTheme = (customizations, theme) => {
  return {
    ...customizations,
    customizations: {
      ...customizations.customizations,
      global: {
        ...customizations.customizations.global,
        ...theme.global
      },
      pages: {
        ...customizations.customizations.pages,
        ...(theme.pages || {})
      }
    },
    metadata: {
      ...customizations.metadata,
      last_edited: new Date().toISOString(),
      theme_applied: theme.name || 'custom'
    }
  };
};

/**
 * Export customizations to different formats
 * @param {Object} customizations - Customizations to export
 * @param {string} format - Export format (json, css, scss)
 * @returns {string} Exported content
 */
export const exportCustomizations = (customizations, format = 'json') => {
  switch (format) {
    case 'json':
      return JSON.stringify(customizations, null, 2);
      
    case 'css':
      return generateCSS(customizations.customizations);
      
    case 'scss':
      return generateSCSS(customizations.customizations);
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Generate CSS from customizations
 * @param {Object} customizations - Customizations data
 * @returns {string} CSS string
 */
const generateCSS = (customizations) => {
  const { global = {} } = customizations;
  let css = ':root {\n';
  
  if (global.primaryColor) {
    css += `  --primary-color: ${global.primaryColor};\n`;
  }
  if (global.accentColor) {
    css += `  --accent-color: ${global.accentColor};\n`;
  }
  if (global.fontFamily) {
    css += `  --font-family: ${global.fontFamily};\n`;
  }
  
  css += '}\n\n';
  css += 'body {\n';
  css += '  font-family: var(--font-family);\n';
  css += '}\n';
  
  return css;
};

/**
 * Generate SCSS from customizations
 * @param {Object} customizations - Customizations data
 * @returns {string} SCSS string
 */
const generateSCSS = (customizations) => {
  const { global = {} } = customizations;
  let scss = '// Generated SCSS variables\n';
  
  if (global.primaryColor) {
    scss += `$primary-color: ${global.primaryColor};\n`;
  }
  if (global.accentColor) {
    scss += `$accent-color: ${global.accentColor};\n`;
  }
  if (global.fontFamily) {
    scss += `$font-family: ${global.fontFamily};\n`;
  }
  
  scss += '\n// Base styles\n';
  scss += 'body {\n';
  scss += '  font-family: $font-family;\n';
  scss += '}\n';
  
  return scss;
};

// Helper functions
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

const isValidColor = (color) => {
  // Check hex format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  // Check rgb/rgba format
  if (/^rgba?\([\d\s,%.]+\)$/.test(color)) {
    return true;
  }
  // Check named colors (basic list)
  const namedColors = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'gray', 'transparent'];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  return false;
};

/**
 * Clone customizations deeply
 * @param {Object} customizations - Customizations to clone
 * @returns {Object} Cloned customizations
 */
export const cloneCustomizations = (customizations) => {
  return JSON.parse(JSON.stringify(customizations));
};

/**
 * Reset specific page to defaults
 * @param {Object} customizations - Current customizations
 * @param {string} pageName - Page to reset
 * @param {string} templateId - Template ID for defaults
 * @returns {Object} Updated customizations
 */
export const resetPageCustomizations = (customizations, pageName, templateId) => {
  const defaults = getDefaultCustomizations(templateId);
  
  return {
    ...customizations,
    customizations: {
      ...customizations.customizations,
      pages: {
        ...customizations.customizations.pages,
        [pageName]: defaults.customizations.pages[pageName] || { enabled: true }
      }
    },
    metadata: {
      ...customizations.metadata,
      last_edited: new Date().toISOString()
    }
  };
};