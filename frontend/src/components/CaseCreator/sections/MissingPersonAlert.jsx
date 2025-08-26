// src/components/CaseCreator/sections/MissingPersonAlert.jsx

import React from 'react';
import { AlertCircle, Car } from 'lucide-react';
import { 
  InputField, 
  TextareaField,
  FileUpload 
} from '../components';

/**
 * MissingPersonAlert Component
 * Specialized component for missing person details
 * Used within IncidentInformation section
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 * @param {function} onFileUpload - Handler for file uploads
 */
const MissingPersonAlert = ({ 
  caseData, 
  errors, 
  onChange,
  onFileUpload 
}) => {
  
  return (
    <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <h4 className="font-medium text-amber-900 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Missing Person Details
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date Last Seen"
          type="date"
          value={caseData.last_seen_date}
          onChange={(value) => onChange('last_seen_date', value)}
          required
          error={errors.last_seen_date}
        />
        
        <InputField
          label="Time Last Seen"
          type="time"
          value={caseData.last_seen_time}
          onChange={(value) => onChange('last_seen_time', value)}
        />
      </div>
      
      <InputField
        label="Last Seen Wearing"
        value={caseData.last_seen_wearing}
        onChange={(value) => onChange('last_seen_wearing', value)}
        placeholder="Describe clothing and accessories..."
      />
      
      <TextareaField
        label="Last Seen With (names and contact information)"
        value={caseData.last_seen_with}
        onChange={(value) => onChange('last_seen_with', value)}
        rows={3}
        placeholder="Names and contact info of anyone who last saw or spoke to them..."
      />
      
      <TextareaField
        label="Planned Activities/Destinations"
        value={caseData.planned_activities}
        onChange={(value) => onChange('planned_activities', value)}
        rows={2}
        placeholder="Where they were going or planning to be..."
      />
      
      <div>
        <InputField
          label="Transportation Details"
          value={caseData.transportation_details}
          onChange={(value) => onChange('transportation_details', value)}
          placeholder="Vehicle make, model, color, license plate..."
        />
        
        <div className="mt-2">
          <FileUpload
            label="Upload Vehicle Photo"
            preview={caseData.vehicle_photo_preview}
            onChange={(file, preview) => {
              onFileUpload('vehicle_photo', file, preview);
            }}
            icon="car"
            accept="image/*"
            previewSize="small"
          />
        </div>
      </div>
    </div>
  );
};

export default MissingPersonAlert;