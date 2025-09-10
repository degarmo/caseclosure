// src/components/CaseCreator/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_CASE_DATA } from './constants';
import { calculateAge, validateRequiredFields, initializeCustomizations, parseAPIError } from './utils';
import { saveCase as saveCaseAPI, deployCaseWebsite } from '@/components/CaseCreator/services/caseAPI';

// Direct component imports
import Header from './components/Header';
import Footer from './components/Footer';

// Direct view imports
import FormView from './views/FormView';
import TemplateSelectionView from './views/TemplateSelectionView';
import CustomizationView from './views/CustomizationView';

/**
 * CaseCreator Component
 * Main orchestrator component for case creation
 */
export default function CaseCreator({ 
  onClose, 
  onComplete,
  onNavigate: onNavigateFromParent,
  existingCase = null 
}) {
  const navigate = useNavigate();
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
      if (existingCase.id) {
        setCaseId(existingCase.id);
      } else if (existingCase.case_id) {
        setCaseId(existingCase.case_id);
      }
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
  const saveCase = async (customCaseId = null) => {
    const effectiveCaseId = customCaseId || caseId;
    
    // Basic validation
    const errors = validateRequiredFields(caseData);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return null;
    }
    
    setApiError('');
    
    try {
      const result = await saveCaseAPI({
        caseId: effectiveCaseId,
        caseData,
        selectedTemplate,
        customizations
      });
      
      if (result.id && !effectiveCaseId) {
        setCaseId(result.id);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      return result;
    } catch (error) {
      const errorMessage = parseAPIError(error);
      setApiError(errorMessage);
      return null;
    }
  };
  
  // Quick save
  const handleQuickSave = async () => {
    setSaving(true);
    try {
      const result = await saveCase();
      if (result) {
        setApiError('');
        return true;
      }
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Deploy website
  const deployWebsite = async () => {
    setLoading(true);
    setApiError('');
    
    try {
      const savedCase = await saveCase();
      if (!savedCase) {
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
  
  // Handle view navigation - Navigate to editor
  const handleViewChange = async (view) => {
    console.log('handleViewChange called:', { from: activeView, to: view });
    
    // Validate form before leaving it
    if (activeView === 'form' && view !== 'form') {
      if (!validateSection()) {
        console.log('Form validation failed');
        return;
      }
    }
    
    // If moving FROM template selection TO customize
    if (activeView === 'template' && view === 'customize') {
      console.log('Moving from template to customize');
      
      // Make sure we have a template selected
      if (!selectedTemplate) {
        console.log('No template selected');
        setApiError('Please select a template first');
        return;
      }
      
      console.log('Selected template:', selectedTemplate);
      setSaving(true);
      setApiError('');
      
      try {
        console.log('Calling saveCase...');
        const result = await saveCase();
        console.log('Save result:', result);
        
        if (result?.id) {
          console.log('Navigating to editor with ID:', result.id);
          // Navigate to the editor route
          navigate(`/editor/${result.id}`);
          // Close the modal after navigation starts
          if (onClose) {
            setTimeout(() => onClose(), 100);
          }
        } else {
          console.log('Save failed - no ID in result');
          setApiError('Failed to save case. Please try again.');
          setSaving(false);
        }
      } catch (error) {
        console.error('Error in handleViewChange:', error);
        setApiError(`Failed to save case: ${error.message}`);
        setSaving(false);
      }
      return;
    }
    
    // For all other view changes, just update the view
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
            caseData={caseData}
            selectedTemplate={selectedTemplate}
            onNext={() => handleViewChange('preview')}
            onPrevious={() => handleViewChange('template')}
            onSave={saveCase}
            caseId={caseId}
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
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Show saving overlay when navigating to editor */}
      {saving && activeView === 'template' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Saving case and opening editor...</p>
          </div>
        </div>
      )}
      
      {/* Error message display */}
      {apiError && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
          <span className="block sm:inline">{apiError}</span>
          <button
            onClick={clearError}
            className="absolute top-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      
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