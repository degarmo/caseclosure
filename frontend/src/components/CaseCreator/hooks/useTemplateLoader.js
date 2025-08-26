// src/components/CaseCreator/hooks/useTemplateLoader.js

import { useState, useEffect, useCallback } from 'react';
import { initializeCustomizations } from '../utils';

/**
 * Custom hook for managing template selection and loading
 */
export const useTemplateLoader = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [templateComponents, setTemplateComponents] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Initialize customizations when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialCustomizations = initializeCustomizations(selectedTemplate);
      setCustomizations(initialCustomizations);
    }
  }, [selectedTemplate]);
  
  // Load template components
  const loadTemplateComponents = useCallback(async () => {
    if (!selectedTemplate?.components) return;
    
    setPreviewLoading(true);
    try {
      const components = {};
      for (const [key, loader] of Object.entries(selectedTemplate.components)) {
        const module = await loader();
        components[key] = module.default;
      }
      setTemplateComponents(components);
    } catch (error) {
      console.error('Failed to load template components:', error);
      throw new Error('Failed to load template preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedTemplate]);
  
  // Handle template selection
  const selectTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setTemplateComponents(null); // Reset components when selecting new template
  }, []);
  
  // Handle customization changes
  const handleCustomizationChange = useCallback((path, value) => {
    const keys = path.split('.');
    setCustomizations(prev => {
      const newCustomizations = { ...prev };
      let current = newCustomizations;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newCustomizations;
    });
  }, []);
  
  // Reset template selection
  const resetTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setCustomizations({});
    setTemplateComponents(null);
  }, []);
  
  return {
    selectedTemplate,
    customizations,
    templateComponents,
    previewLoading,
    selectTemplate,
    handleCustomizationChange,
    loadTemplateComponents,
    resetTemplate
  };
};