// src/components/CaseCreator/sections/IncidentInformation.jsx

import React from 'react';
import { Shield, AlertCircle, Car, MapPin } from 'lucide-react';
// Direct imports
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import TextareaField from '../components/TextareaField';
import FileUpload from '../components/FileUpload';

// Crime type options
const CRIME_TYPES = [
  { value: 'missing', label: 'Missing Person' },
  { value: 'homicide', label: 'Homicide' },
];

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

/**
 * IncidentInformation Section Component
 * Handles incident/crime specific information with conditional fields
 * Now includes City and State fields for incident location
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 * @param {function} onFileUpload - Handler for file uploads
 */
const IncidentInformation = ({ 
  caseData, 
  errors, 
  onChange,
  onFileUpload 
}) => {
  
  return (
    <SectionWrapper 
      title="Incident Information" 
      icon={<Shield className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Crime Type Selection */}
        <SelectField
          label="Type of Case"
          value={caseData.crime_type}
          onChange={(value) => onChange('crime_type', value)}
          options={CRIME_TYPES}
          required
          error={errors.crime_type}
        />
        
        {/* Missing Person Fields */}
        {caseData.crime_type === 'missing' && (
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
              
              {/* Vehicle Photo */}
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
        )}
        
        {/* Homicide Fields */}
        {caseData.crime_type === 'homicide' && (
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
            
            <TextareaField
              label="Incident Description"
              value={caseData.incident_description}
              onChange={(value) => onChange('incident_description', value)}
              rows={3}
              placeholder="Brief description of what happened..."
            />
          </div>
        )}
        
        {/* INCIDENT LOCATION SECTION - Shows for ALL crime types */}
        {caseData.crime_type && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Incident Location Details
            </h4>
            
            <InputField
              label="Street Address / Location Description"
              value={caseData.incident_location}
              onChange={(value) => onChange('incident_location', value)}
              placeholder="Street address or specific location description..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="City"
                value={caseData.incident_city || ''}
                onChange={(value) => onChange('incident_city', value)}
                placeholder="Enter city name..."
                required={caseData.crime_type === 'homicide'}
                error={errors.incident_city}
              />
              
              <SelectField
                label="State"
                value={caseData.incident_state || ''}
                onChange={(value) => onChange('incident_state', value)}
                options={US_STATES}
                placeholder="Select state..."
                required={caseData.crime_type === 'homicide'}
                error={errors.incident_state}
              />
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

export default IncidentInformation;