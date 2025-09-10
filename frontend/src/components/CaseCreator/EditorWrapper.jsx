// @/components/CaseCreator/EditorWrapper.jsx
// Wrapper component that loads case data and passes it to CustomizationView

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomizationView from './views/CustomizationView/CustomizationView';
import { getCaseById } from './services/caseAPI';
import { Loader2 } from 'lucide-react';

const EditorWrapper = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState(null);
  
  // Default template - you can make this dynamic based on case data
  const [selectedTemplate, setSelectedTemplate] = useState({
    id: 'beacon',
    name: 'Beacon Template'
  });

  useEffect(() => {
    const loadCaseData = async () => {
      if (!caseId || caseId === 'new') {
        // Handle new case creation
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getCaseById(caseId);
        console.log('Loaded case data:', data);
        
        setCaseData(data);
        
        // Set template from case data if available
        if (data.template_id) {
          setSelectedTemplate({
            id: data.template_id,
            name: data.template_name || 'Beacon Template'
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load case:', err);
        setError('Failed to load case data');
        setLoading(false);
      }
    };

    loadCaseData();
  }, [caseId]);

  const handlePrevious = () => {
    // Navigate back to dashboard or previous step
    navigate('/dashboard');
  };

  const handleNext = (data) => {
    console.log('Moving to next step with data:', data);
    // Handle moving to next step (deployment, preview, etc.)
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 text-xl font-semibold mb-2">Error Loading Case</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CustomizationView
      caseData={caseData}
      selectedTemplate={selectedTemplate}
      onNext={handleNext}
      onPrevious={handlePrevious}
      caseId={caseId}
    />
  );
};

export default EditorWrapper;