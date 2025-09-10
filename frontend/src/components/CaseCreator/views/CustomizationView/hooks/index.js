// @/components/CaseCreator/views/CustomizationView/hooks/index.js

/**
 * Export all custom hooks from a single entry point
 */

export { useCustomizations } from './useCustomizations';
export { useSaveHandler } from './useSaveHandler';
export { useTemplateRegistry } from './useTemplateRegistry';
export { usePreviewMode } from './usePreviewMode';
export { useAutoSave } from './useAutoSave';

// Re-export hook types for convenience
export { DEPLOYMENT_STATUS, SAVE_STATUS } from '../utils/deploymentHelpers';