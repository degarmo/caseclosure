// src/components/CaseCreator/index.jsx
// FIXED VERSION with proper imports

import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_CASE_DATA } from './constants';
import { calculateAge, validateRequiredFields, initializeCustomizations, parseAPIError } from './utils';
import { saveCase as saveCaseAPI, deployCaseWebsite } from './services/caseAPI';

// Direct component imports
import Header from './components/Header';
import Footer from './components/Footer';

// Direct view imports
import FormView from './views/FormView';
import TemplateSelectionView from './views/TemplateSelectionView';
import CustomizationView from './views/CustomizationView';
import PreviewView from './views/PreviewView';

/**
 * UnifiedCaseCreator Component
 * Main orchestrator component for case creation
 */
export default function UnifiedCaseCreator({ 
  onClose, 
  onComplete,
  existingCase = null 
}) {
  const [activeView, setActiveView] = useState('form');
  const [caseData, setCaseData] = useState(INITIAL_CASE_DATA);
  const [errors, setErrors] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [templateComponents, setTemplateComponents] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (caseData.date_of_birth) {
      const age = calculateAge(caseData.date_of_birth);
      if (age !== caseData.age) {
        setCaseData(prev => ({ ...prev, age }));
      }
    }
  }, [caseData.date_of_birth, caseData.age]);
  
  // Initialize customizations when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialCustomizations = initializeCustomizations(selectedTemplate);
      setCustomizations(initialCustomizations);
    }
  }, [selectedTemplate]);
  
  // Load existing case data if provided
  useEffect(() => {
    if (existingCase) {
      setCaseData(prev => ({ ...prev, ...existingCase }));
    }
  }, [existingCase]);
  
  // Load template components when moving to preview
  useEffect(() => {
    if (activeView === 'preview' && selectedTemplate && !templateComponents) {
      loadTemplateComponents();
    }
  }, [activeView, selectedTemplate, templateComponents]);
  
  // Handle field changes
  const handleChange = useCallback((field, value) => {
    setCaseData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);
  
  // Handle file uploads with preview
  const handleFileUpload = useCallback((fieldName, file, preview) => {
    setCaseData(prev => ({
      ...prev,
      [fieldName]: file,
      [`${fieldName}_preview`]: preview
    }));
  }, []);
  
  // Validate current data
  const validateSection = useCallback(() => {
    const newErrors = validateRequiredFields(caseData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [caseData]);
  
  // Load template components
  const loadTemplateComponents = async () => {
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
      setApiError('Failed to load template preview');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Handle template selection
  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateComponents(null);
  };
  
  // Handle customization changes
  const handleCustomizationChange = (path, value) => {
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
  };
  
  // Save case
  const saveCase = async () => {
    // Basic validation
    const errors = validateRequiredFields(caseData);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return null;
    }
    
    setSaving(true);
    setApiError('');
    
    try {
      const result = await saveCaseAPI({
        caseId,
        caseData,
        selectedTemplate,
        customizations
      });
      
      if (result.id && !caseId) {
        setCaseId(result.id);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      return result;
    } catch (error) {
      const errorMessage = parseAPIError(error);
      setApiError(errorMessage);
      return null;
    } finally {
      setSaving(false);
    }
  };
  
  // Quick save
  const handleQuickSave = async () => {
    const result = await saveCase();
    if (result) {
      setApiError('');
      return true;
    }
    return false;
  };
  
  // Deploy website
  const deployWebsite = async () => {
    setLoading(true);
    setApiError('');
    
    try {
      const savedCase = await saveCase();
      if (!savedCase) {
        setLoading(false);
        return null;
      }
      
      if (savedCase.id || caseId) {
        await deployCaseWebsite(savedCase.id || caseId);
      }
      
      if (onComplete) {
        onComplete(savedCase);
      }
      
      return savedCase;
    } catch (error) {
      const errorMessage = parseAPIError(error);
      setApiError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  
  // Handle view navigation
  const handleViewChange = (view) => {
    if (activeView === 'form' && view !== 'form') {
      if (!validateSection()) {
        return;
      }
    }
    setActiveView(view);
  };
  
  // Clear error
  const clearError = () => {
    setApiError('');
  };
  
  // Render current view
  const renderView = () => {
    switch (activeView) {
      case 'form':
        return (
          <FormView
            caseData={caseData}
            errors={errors}
            apiError={apiError}
            saveSuccess={saveSuccess}
            onChange={handleChange}
            onFileUpload={handleFileUpload}
            onDismissError={clearError}
          />
        );
        
      case 'template':
        return (
          <TemplateSelectionView
            selectedTemplate={selectedTemplate}
            onSelectTemplate={selectTemplate}
          />
        );
        
      case 'customize':
        return (
          <CustomizationView
            selectedTemplate={selectedTemplate}
            customizations={customizations}
            onCustomizationChange={handleCustomizationChange}
            caseData={caseData}
          />
        );
        
      case 'preview':
        return (
          <PreviewView
            caseData={caseData}
            selectedTemplate={selectedTemplate}
            customizations={customizations}
            templateComponents={templateComponents}
            previewLoading={previewLoading}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Header with navigation */}
      <Header
        caseData={caseData}
        activeView={activeView}
        onViewChange={handleViewChange}
        onClose={onClose}
        validateSection={validateSection}
        selectedTemplate={selectedTemplate}
      />
      
      {/* Current view content */}
      {renderView()}
      
      {/* Footer with actions */}
      <Footer
        activeView={activeView}
        saving={saving}
        loading={loading}
        caseId={caseId}
        selectedTemplate={selectedTemplate}
        onSave={handleQuickSave}
        onNavigate={handleViewChange}
        onDeploy={deployWebsite}
        validateSection={validateSection}
      />
    </div>
  );
}