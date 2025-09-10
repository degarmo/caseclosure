// src/components/CaseCreator/sections/BasicInformation.jsx

import React from 'react';
import { User, Camera } from 'lucide-react';
// Direct imports
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import TextareaField from '../components/TextareaField';
import FileUpload from '../components/FileUpload';

// Define options directly in the component to match Django model
const RACE_OPTIONS = [
  { value: '', label: 'Select Race' },
  { value: 'White', label: 'White' },
  { value: 'Black', label: 'Black/African American' },
  { value: 'Hispanic', label: 'Hispanic/Latino' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Native American', label: 'Native American' },
  { value: 'Pacific Islander', label: 'Pacific Islander' },
  { value: 'Other', label: 'Other' },
  { value: 'Unknown', label: 'Unknown' }
];

// Sex options matching Django model choices (lowercase)
const SEX_OPTIONS = [
  { value: '', label: 'Select Sex' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const HAIR_COLORS = [
  { value: '', label: 'Select Hair Color' },
  { value: 'Black', label: 'Black' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Blonde', label: 'Blonde' },
  { value: 'Red', label: 'Red' },
  { value: 'Gray', label: 'Gray' },
  { value: 'White', label: 'White' },
  { value: 'Bald', label: 'Bald' },
  { value: 'Other', label: 'Other' },
  { value: 'Unknown', label: 'Unknown' }
];

const EYE_COLORS = [
  { value: '', label: 'Select Eye Color' },
  { value: 'Brown', label: 'Brown' },
  { value: 'Blue', label: 'Blue' },
  { value: 'Green', label: 'Green' },
  { value: 'Hazel', label: 'Hazel' },
  { value: 'Gray', label: 'Gray' },
  { value: 'Amber', label: 'Amber' },
  { value: 'Other', label: 'Other' },
  { value: 'Unknown', label: 'Unknown' }
];

/**
 * BasicInformation Section Component
 * Handles victim's basic personal information
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 * @param {function} onFileUpload - Handler for file uploads
 */
const BasicInformation = ({ 
  caseData, 
  errors, 
  onChange,
  onFileUpload 
}) => {
  
  return (
    <SectionWrapper 
      title="Basic Information" 
      icon={<User className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name Row */}
        <InputField
          label="First Name"
          value={caseData.first_name}
          onChange={(value) => onChange('first_name', value)}
          required
          error={errors.first_name}
          placeholder="Enter first name"
        />
        
        <InputField
          label="Middle Name"
          value={caseData.middle_name}
          onChange={(value) => onChange('middle_name', value)}
          placeholder="Enter middle name (optional)"
        />
        
        <InputField
          label="Last Name"
          value={caseData.last_name}
          onChange={(value) => onChange('last_name', value)}
          required
          error={errors.last_name}
          placeholder="Enter last name"
        />
        
        <InputField
          label="Nickname"
          value={caseData.nickname}
          onChange={(value) => onChange('nickname', value)}
          placeholder="Enter nickname (optional)"
        />
        
        {/* DOB and Age */}
        <InputField
          label="Date of Birth"
          type="date"
          value={caseData.date_of_birth}
          onChange={(value) => onChange('date_of_birth', value)}
        />
        
        <InputField
          label="Age"
          type="number"
          value={caseData.age}
          onChange={(value) => onChange('age', value)}
          placeholder="Enter age or auto-calculated from DOB"
          min="0"
          max="150"
        />
        
        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={caseData.height_feet || ''}
              onChange={(e) => onChange('height_feet', e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ft"
              min="0"
              max="8"
            />
            <input
              type="number"
              value={caseData.height_inches || ''}
              onChange={(e) => onChange('height_inches', e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="in"
              min="0"
              max="11"
            />
          </div>
        </div>
        
        {/* Weight */}
        <InputField
          label="Weight (lbs)"
          type="number"
          value={caseData.weight}
          onChange={(value) => onChange('weight', value)}
          placeholder="Enter weight"
          min="0"
          max="1000"
        />
        
        {/* Race */}
        <SelectField
          label="Race"
          value={caseData.race}
          onChange={(value) => onChange('race', value)}
          options={RACE_OPTIONS}
        />
        
        {/* Sex - Now with lowercase values */}
        <SelectField
          label="Sex"
          value={caseData.sex}
          onChange={(value) => onChange('sex', value)}
          options={SEX_OPTIONS}
        />
        
        {/* Hair Color */}
        <SelectField
          label="Hair Color"
          value={caseData.hair_color}
          onChange={(value) => onChange('hair_color', value)}
          options={HAIR_COLORS}
        />
        
        {/* Eye Color */}
        <SelectField
          label="Eye Color"
          value={caseData.eye_color}
          onChange={(value) => onChange('eye_color', value)}
          options={EYE_COLORS}
        />
      </div>
      
      {/* Distinguishing Features */}
      <div className="mt-6">
        <TextareaField
          label="Distinguishing Features"
          value={caseData.distinguishing_features}
          onChange={(value) => onChange('distinguishing_features', value)}
          rows={3}
          placeholder="Describe any identifying marks or features (tattoos, piercings, scars, dental work, etc.)..."
        />
      </div>
      
      {/* Primary Photo Upload */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Photo
        </label>
        <FileUpload
          label="Upload Primary Photo"
          preview={caseData.primary_photo_preview}
          onChange={(file, preview) => {
            onFileUpload('primary_photo', file, preview);
          }}
          icon="camera"
          accept="image/*"
        />
        <p className="mt-1 text-xs text-gray-500">
          This photo will be the main image displayed on the memorial website
        </p>
      </div>
    </SectionWrapper>
  );
};

export default BasicInformation;