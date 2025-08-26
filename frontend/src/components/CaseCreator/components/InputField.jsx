// src/components/CaseCreator/components/InputField.jsx

import React from 'react';
import FormField from './FormField';

/**
 * InputField Component
 * Reusable input field with consistent styling
 * 
 * @param {string} label - Field label
 * @param {string} type - Input type (text, email, tel, number, date, time)
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {boolean} required - Whether field is required
 * @param {string} error - Error message
 * @param {string} placeholder - Placeholder text
 * @param {boolean} readOnly - Whether field is read-only
 * @param {string} className - Additional CSS classes
 * @param {string} helpText - Optional help text
 * @param {number} min - Minimum value for number inputs
 * @param {number} max - Maximum value for number inputs
 */
const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  placeholder,
  readOnly = false,
  className = '',
  helpText,
  min,
  max
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
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`
          w-full px-3 py-2 border rounded-md text-sm
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${readOnly ? 'bg-gray-50 border-gray-200' : ''}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        `}
      />
    </FormField>
  );
};

export default InputField;