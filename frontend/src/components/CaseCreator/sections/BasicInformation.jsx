// src/components/CaseCreator/sections/BasicInformation.jsx

import React from 'react';
import { User, Camera } from 'lucide-react';
// Direct imports
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import TextareaField from '../components/TextareaField';
import FileUpload from '../components/FileUpload';
import { RACE_OPTIONS, SEX_OPTIONS, HAIR_COLORS } from '../constants';

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
        />
        
        <InputField
          label="Last Name"
          value={caseData.last_name}
          onChange={(value) => onChange('last_name', value)}
          required
          error={errors.last_name}
        />
        
        <InputField
          label="Nickname"
          value={caseData.nickname}
          onChange={(value) => onChange('nickname', value)}
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
          value={caseData.age}
          readOnly
          placeholder="Auto-calculated"
        />
        
        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={caseData.height_feet}
              onChange={(e) => onChange('height_feet', e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="ft"
              min="0"
              max="8"
            />
            <input
              type="number"
              value={caseData.height_inches}
              onChange={(e) => onChange('height_inches', e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
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
        />
        
        {/* Race */}
        <SelectField
          label="Race"
          value={caseData.race}
          onChange={(value) => onChange('race', value)}
          options={RACE_OPTIONS}
        />
        
        {/* Sex */}
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
      </div>
      
      {/* Distinguishing Features */}
      <div className="mt-4">
        <TextareaField
          label="Distinguishing Features (tattoos, piercings, scars, dental work)"
          value={caseData.distinguishing_features}
          onChange={(value) => onChange('distinguishing_features', value)}
          rows={3}
          placeholder="Describe any identifying marks or features..."
        />
      </div>
      
      {/* Recent Photo Upload */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Recent Photo</label>
        <FileUpload
          label="Upload Recent Photo"
          preview={caseData.recent_photo_preview}
          onChange={(file, preview) => {
            onFileUpload('recent_photo', file, preview);
          }}
          icon="camera"
          accept="image/*"
        />
      </div>
    </SectionWrapper>
  );
};

export default BasicInformation;