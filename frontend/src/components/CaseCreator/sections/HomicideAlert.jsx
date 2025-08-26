// src/components/CaseCreator/sections/HomicideAlert.jsx

import React from 'react';
import { InputField, TextareaField } from '../components';

/**
 * HomicideAlert Component
 * Specialized component for homicide details
 * Used within IncidentInformation section
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 */
const HomicideAlert = ({ 
  caseData, 
  errors, 
  onChange 
}) => {
  
  return (
    <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <h4 className="font-medium text-red-900">Homicide Details</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date of Death"
          type="date"
          value={caseData.date_of_death}
          onChange={(value) => onChange('date_of_death', value)}
          required
          error={errors.date_of_death}
        />
        
        <InputField
          label="Incident Date"
          type="date"
          value={caseData.incident_date}
          onChange={(value) => onChange('incident_date', value)}
        />
      </div>
      
      <InputField
        label="Incident Location"
        value={caseData.incident_location}
        onChange={(value) => onChange('incident_location', value)}
        placeholder="Address or location description..."
      />
      
      <TextareaField
        label="Incident Description"
        value={caseData.incident_description}
        onChange={(value) => onChange('incident_description', value)}
        rows={3}
        placeholder="Brief description of what happened..."
      />
    </div>
  );
};

export default HomicideAlert;