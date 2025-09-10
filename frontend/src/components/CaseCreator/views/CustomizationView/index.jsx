// @/components/CaseCreator/views/CustomizationView/index.jsx

import React from 'react';
import CustomizationView from './CustomizationView';

/**
 * CustomizationView container component
 * This serves as the entry point for the CustomizationView module
 */
const CustomizationViewContainer = (props) => {
  return <CustomizationView {...props} />;
};

export default CustomizationViewContainer;

// Re-export the main component for named imports
export { default as CustomizationView } from './CustomizationView';

// Export hooks for external use
export * from './hooks';

// Export utility functions if needed externally
export * from './utils/customizationHelpers';
export * from './utils/deploymentHelpers';
export * from './utils/validationHelpers';

// Export constants
export * from './constants/templateRegistry';