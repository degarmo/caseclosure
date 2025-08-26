// src/components/CaseCreator/sections/InvestigationDetails.jsx

import React from 'react';
import { FileText } from 'lucide-react';
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';

/**
 * InvestigationDetails Section Component
 * Handles law enforcement and investigation information
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 */
const InvestigationDetails = ({ 
  caseData, 
  errors, 
  onChange 
}) => {
  
  return (
    <SectionWrapper 
      title="Investigation Details" 
      icon={<FileText className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Case Number"
          value={caseData.case_number}
          onChange={(value) => onChange('case_number', value)}
          placeholder="e.g., 2024-00123"
        />
        
        <InputField
          label="Investigating Department"
          value={caseData.investigating_department}
          onChange={(value) => onChange('investigating_department', value)}
          placeholder="Police department or agency"
        />
        
        <InputField
          label="Detective Name"
          value={caseData.detective_name}
          onChange={(value) => onChange('detective_name', value)}
        />
        
        <InputField
          label="Detective Phone"
          type="tel"
          value={caseData.detective_phone}
          onChange={(value) => onChange('detective_phone', value)}
        />
        
        <div className="md:col-span-2">
          <InputField
            label="Detective Email"
            type="email"
            value={caseData.detective_email}
            onChange={(value) => onChange('detective_email', value)}
          />
        </div>
      </div>
    </SectionWrapper>
  );
};

export default InvestigationDetails;