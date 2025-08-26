// src/components/CaseCreator/views/FormView.jsx

import React from 'react';
// Direct imports instead of barrel exports
import BasicInformation from '../sections/BasicInformation';
import IncidentInformation from '../sections/IncidentInformation';
import InvestigationDetails from '../sections/InvestigationDetails';
import RewardInformation from '../sections/RewardInformation';
import MediaLinks from '../sections/MediaLinks';
import ErrorDisplay from '../components/ErrorDisplay';
import SuccessMessage from '../components/SuccessMessage';

/**
 * FormView Component
 * Main form view that composes all form sections
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {string} apiError - API error message
 * @param {boolean} saveSuccess - Whether save was successful
 * @param {function} onChange - Handler for field changes
 * @param {function} onFileUpload - Handler for file uploads
 * @param {function} onDismissError - Handler to dismiss errors
 */
const FormView = ({
  caseData,
  errors,
  apiError,
  saveSuccess,
  onChange,
  onFileUpload,
  onDismissError
}) => {
  
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Error Display */}
        <ErrorDisplay 
          error={apiError} 
          onDismiss={onDismissError}
        />
        
        {/* Success Message */}
        <SuccessMessage 
          message="Case saved successfully!" 
          show={saveSuccess}
        />
        
        {/* Basic Information Section */}
        <BasicInformation
          caseData={caseData}
          errors={errors}
          onChange={onChange}
          onFileUpload={onFileUpload}
        />
        
        {/* Incident Information Section */}
        <IncidentInformation
          caseData={caseData}
          errors={errors}
          onChange={onChange}
          onFileUpload={onFileUpload}
        />
        
        {/* Investigation Details Section */}
        <InvestigationDetails
          caseData={caseData}
          errors={errors}
          onChange={onChange}
        />
        
        {/* Reward Information Section */}
        <RewardInformation
          caseData={caseData}
          errors={errors}
          onChange={onChange}
        />
        
        {/* Media Links Section */}
        <MediaLinks
          caseData={caseData}
          errors={errors}
          onChange={onChange}
        />
        
      </div>
    </div>
  );
};

export default FormView;