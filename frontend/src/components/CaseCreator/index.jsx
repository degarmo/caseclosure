// src/components/CaseCreator/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { INITIAL_CASE_DATA } from './constants';
import { calculateAge, validateRequiredFields, initializeCustomizations, parseAPIError } from './utils';
import { saveCase as saveCaseAPI, deployCaseWebsite } from '@/components/CaseCreator/services/caseAPI';
import api from '@/utils/axios'; // or '@/api/axios' depending on your setup

// Direct component imports
import Header from './components/Header';
import Footer from './components/Footer';

// Direct view imports
import FormView from './views/FormView';
import TemplateSelectionView from './views/TemplateSelectionView';
import CustomizationView from './views/CustomizationView';

/**
 * CaseCreator Component
 * Main orchestrator component for case creation and editing
 */
export default function CaseCreator({ 
  mode = 'create',  // 'create' or 'edit'
  caseId: propCaseId,  // Case ID passed as prop (for modal mode)
  onClose, 
  onComplete,
  onNavigate: onNavigateFromParent,
  existingCase = null 
}) {
  const navigate = useNavigate();
  const { id: urlCaseId } = useParams(); // Get case ID from URL params (for route mode)
  
  // Determine which case ID to use
  const editCaseId = mode === 'edit' ? (propCaseId || urlCaseId) : null;
  
  const [activeView, setActiveView] = useState('form');
  const [caseData, setCaseData] = useState(INITIAL_CASE_DATA);
  const [errors, setErrors] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [templateComponents, setTemplateComponents] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [caseId, setCaseId] = useState(editCaseId);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // Load case data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && editCaseId && !initialDataLoaded) {
      loadCaseData(editCaseId);
    }
  }, [mode, editCaseId, initialDataLoaded]);
  
  // Function to load existing case data
  const loadCaseData = async (id) => {
    setLoading(true);
    setApiError('');
    
    try {
      const response = await api.get(`/cases/${id}/`);
      const data = response.data;
      
      // Map the API response to the case data format
      const loadedCaseData = {
        // Basic Information
        case_title: data.case_title || '',
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        nickname: data.nickname || '',
        date_of_birth: data.date_of_birth || '',
        
        // Physical Description
        age: data.age || '',
        height_feet: data.height_feet || '',
        height_inches: data.height_inches || '',
        weight: data.weight || '',
        race: data.race || '',
        sex: data.sex || '',
        hair_color: data.hair_color || '',
        eye_color: data.eye_color || '',
        distinguishing_features: data.distinguishing_features || '',
        
        // Case Details
        case_number: data.case_number || '',
        case_type: data.case_type || '',
        crime_type: data.crime_type || data.case_type || '',
        description: data.description || '',
        
        // Incident Information
        incident_date: data.incident_date || '',
        incident_location: data.incident_location || '',
        incident_city: data.incident_city || '',      // Load city
        incident_state: data.incident_state || '',     // Load state
        date_of_death: data.date_of_death || '',
        date_missing: data.date_missing || '',
        last_seen_date: data.last_seen_date || '',
        last_seen_time: data.last_seen_time || '',
        last_seen_location: data.last_seen_location || '',
        last_seen_wearing: data.last_seen_wearing || '',
        last_seen_with: data.last_seen_with || '',
        planned_activities: data.planned_activities || '',
        transportation_details: data.transportation_details || '',
        
        // Investigation
        investigating_agency: data.investigating_agency || '',
        detective_name: data.detective_name || '',
        detective_phone: data.detective_phone || '',
        detective_email: data.detective_email || '',
        
        // Reward
        reward_amount: data.reward_amount || '',
        reward_details: data.reward_details || '',
        
        // Template
        template_id: data.template_id || 'beacon',
      };
      
      setCaseData(loadedCaseData);
      setCaseId(id);
      
      // If there's template data, load it
      if (data.template_id) {
        // You might need to load the template here
        // setSelectedTemplate(findTemplateById(data.template_id));
      }
      
      // If there's customization data, load it
      if (data.template_data && data.template_data.customizations) {
        setCustomizations(data.template_data.customizations);
      }
      
      // Handle victim photo if it exists
      if (data.victim_photo_url || data.primary_photo_url) {
        setCaseData(prev => ({
          ...prev,
          victim_photo_preview: data.victim_photo_url || data.primary_photo_url
        }));
      }
      
      setInitialDataLoaded(true);
      
    } catch (error) {
      console.error('Error loading case data:', error);
      const errorMessage = parseAPIError(error);
      setApiError(`Failed to load case data: ${errorMessage}`);
      
      // If we can't load the case, either close or redirect
      if (onClose) {
        setTimeout(() => onClose(), 2000);
      } else {
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };
  
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
  
  // Load existing case data if provided (for backwards compatibility)
  useEffect(() => {
    if (existingCase && !initialDataLoaded) {
      setCaseData(prev => ({ ...prev, ...existingCase }));
      if (existingCase.id) {
        setCaseId(existingCase.id);
      } else if (existingCase.case_id) {
        setCaseId(existingCase.case_id);
      }
      setInitialDataLoaded(true);
    }
  }, [existingCase, initialDataLoaded]);
  
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
  
  // Save case (handles both create and update)
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
      // Use the appropriate API method based on mode
      const result = await saveCaseAPI({
        caseId: effectiveCaseId,
        caseData,
        selectedTemplate,
        customizations,
        isEdit: mode === 'edit'  // Pass edit mode to API function
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
    console.log('handleViewChange called:', { 
      from: activeView, 
      to: view, 
      mode, 
      caseId,
      editCaseId 
    });
    
    // Validate form before leaving it
    if (activeView === 'form' && view !== 'form') {
      if (!validateSection()) {
        console.log('Form validation failed');
        return;
      }
    }
    
    // EDIT MODE: Skip template selection and go straight to editor
    if (mode === 'edit' && activeView === 'form' && view === 'template') {
      console.log('Edit mode - skipping template selection, going to editor');
      setSaving(true);
      setApiError('');
      
      try {
        // Save the updated case data
        const result = await saveCase();
        console.log('Save result:', result);
        
        const finalCaseId = result?.id || caseId || editCaseId;
        
        if (finalCaseId) {
          console.log('Navigating to editor with ID:', finalCaseId);
          // Navigate directly to the website editor
          window.location.href = `/editor/${finalCaseId}`;
          // Don't call onClose here - let the navigation happen
        } else {
          setApiError('Failed to save changes. Please try again.');
          setSaving(false);
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        setApiError(`Failed to save changes: ${error.message}`);
        setSaving(false);
      }
      return;
    }
    
    // CREATE MODE: Moving from template selection to customize
    if (mode === 'create' && activeView === 'template' && view === 'customize') {
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
          window.location.href = `/editor/${result.id}`;
          // Don't call onClose here - let the navigation happen
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
  
  // Show loading screen while fetching data in edit mode
  if (mode === 'edit' && !initialDataLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading case data...</p>
          </div>
        </div>
      </div>
    );
  }
  
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
            isEditMode={mode === 'edit'}
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
            <p className="mt-4 text-gray-700">
              {mode === 'edit' ? 'Updating case and opening editor...' : 'Saving case and opening editor...'}
            </p>
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
        isEditMode={mode === 'edit'}
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
        isEditMode={mode === 'edit'}
      />
    </div>
  );
}