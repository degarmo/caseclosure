// @/components/CaseCreator/views/TemplatePreviewWrapper.jsx
// Fixed version with better error handling and data persistence

import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCaseById } from '../services/caseAPI';
import { Loader2 } from 'lucide-react';

// Template Registry - Dynamic imports
const TEMPLATE_COMPONENTS = {
  beacon: {
    home: lazy(() => import('@/templates/beacon/src/pages/Home')),
    about: lazy(() => import('@/templates/beacon/src/pages/About')),
    spotlight: lazy(() => import('@/templates/beacon/src/pages/Spotlight')),
    timeline: lazy(() => import('@/templates/beacon/src/pages/Timeline')),
    contact: lazy(() => import('@/templates/beacon/src/pages/Contact')),
  },
};

// Fallback component for when template fails to load
const TemplateFallback = ({ caseData, error }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {caseData?.case_title || 'Case Preview'}
        </h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Name:</span> {caseData?.first_name} {caseData?.last_name}
          </div>
          <div>
            <span className="font-semibold">Case Type:</span> {caseData?.case_type || caseData?.crime_type}
          </div>
          <div>
            <span className="font-semibold">Case #:</span> {caseData?.case_number || 'Not assigned'}
          </div>
          {caseData?.reward_amount && (
            <div>
              <span className="font-semibold">Reward:</span> ${caseData.reward_amount}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const TemplatePreviewWrapper = () => {
  const { caseId, page = 'home' } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('editing') === 'true';
  const templateId = searchParams.get('template') || 'beacon';
  
  const [caseData, setCaseData] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [componentError, setComponentError] = useState(null);
  
  // Use ref to persist data
  const dataRef = useRef({ caseData: null, customizations: {} });

  // Load case data if we have a real case ID
  useEffect(() => {
    const loadCaseData = async () => {
      // If caseId is 'temp' or 'new', we're in creation mode
      if (caseId === 'temp' || caseId === 'new') {
        setLoading(false);
        return;
      }

      try {
        console.log('Loading case data for ID:', caseId);
        const data = await getCaseById(caseId);
        console.log('Loaded case data:', data);
        
        setCaseData(data);
        setCustomizations(data.template_data?.customizations || {});
        
        // Persist in ref
        dataRef.current = {
          caseData: data,
          customizations: data.template_data?.customizations || {}
        };
        
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load case:', err);
        setError('Failed to load case data');
        setLoading(false);
      }
    };

    loadCaseData();
  }, [caseId]);

  // Listen for messages from parent (CustomizationView)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'PREVIEW_DATA') {
        console.log('Received preview data:', event.data);
        const newCaseData = event.data.caseData || {};
        const newCustomizations = event.data.customizations || {};
        
        setCaseData(newCaseData);
        setCustomizations(newCustomizations);
        
        // Persist in ref
        dataRef.current = {
          caseData: newCaseData,
          customizations: newCustomizations
        };
        
        if (loading) setLoading(false);
      } else if (event.data.type === 'UPDATE_CUSTOMIZATIONS') {
        const newCustomizations = event.data.customizations || {};
        setCustomizations(newCustomizations);
        dataRef.current.customizations = newCustomizations;
      } else if (event.data.type === 'UPDATE_CASE_DATA') {
        const newCaseData = event.data.caseData || {};
        setCaseData(newCaseData);
        dataRef.current.caseData = newCaseData;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Tell parent we're ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, [loading]);

  // Handle customization changes (for inline editing)
  const handleCustomizationChange = (path, value) => {
    const keys = path.split('.');
    const updated = { ...customizations };
    let current = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setCustomizations(updated);
    dataRef.current.customizations = updated;
    
    // Notify parent of change if in iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'CUSTOMIZATION_CHANGE',
        path,
        value,
        customizations: updated
      }, '*');
    }
  };

  // Error boundary for component errors
  const renderWithErrorBoundary = () => {
    try {
      const template = TEMPLATE_COMPONENTS[templateId];
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const PageComponent = template[page.toLowerCase()];
      if (!PageComponent) {
        // Fallback to home page if requested page doesn't exist
        const HomeFallback = template.home;
        if (!HomeFallback) {
          throw new Error(`Page not found: ${page}`);
        }
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <HomeFallback
              caseData={caseData || dataRef.current.caseData || {}}
              customizations={customizations || dataRef.current.customizations || {}}
              isEditing={isEditing}
              onCustomizationChange={handleCustomizationChange}
            />
          </Suspense>
        );
      }

      return (
        <Suspense fallback={<LoadingSpinner />}>
          <PageComponent
            caseData={caseData || dataRef.current.caseData || {}}
            customizations={customizations || dataRef.current.customizations || {}}
            isEditing={isEditing}
            onCustomizationChange={handleCustomizationChange}
          />
        </Suspense>
      );
    } catch (err) {
      console.error('Component render error:', err);
      setComponentError(err.message);
      return <TemplateFallback caseData={caseData || dataRef.current.caseData} error={err.message} />;
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading template...</p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !caseData) {
    return <TemplateFallback caseData={dataRef.current.caseData} error={error} />;
  }

  // Log current state for debugging
  console.log('TemplatePreviewWrapper Render:', {
    caseId,
    page,
    templateId,
    hasCaseData: !!caseData,
    caseType: caseData?.case_type || caseData?.crime_type,
    dataRefCaseType: dataRef.current.caseData?.case_type || dataRef.current.caseData?.crime_type
  });

  return (
    <div className="template-preview-wrapper">
      {renderWithErrorBoundary()}
    </div>
  );
};

export default TemplatePreviewWrapper;