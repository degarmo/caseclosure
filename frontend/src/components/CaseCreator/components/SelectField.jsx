// src/components/CaseCreator/components/SelectField.jsx

import React from 'react';
import FormField from './FormField';

/**
 * SelectField Component
 * Reusable select dropdown with consistent styling
 * 
 * @param {string} label - Field label
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {Array} options - Array of options (strings or {value, label} objects)
 * @param {boolean} required - Whether field is required
 * @param {string} error - Error message
 * @param {string} placeholder - Placeholder text for empty option
 * @param {string} className - Additional CSS classes
 * @param {string} helpText - Optional help text
 */
const SelectField = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error,
  placeholder = 'Select...',
  className = '',
  helpText
}) => {
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      className={className}
      helpText={helpText}
    >
      <select
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md text-sm ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => {
          const isObject = typeof option === 'object';
          const optionValue = isObject ? option.value : option;
          const optionLabel = isObject ? option.label : option;
          
          return (
            <option key={index} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </FormField>
  );
};

export default SelectField;