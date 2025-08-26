// src/components/CaseCreator/components/TextareaField.jsx

import React from 'react';
import FormField from './FormField';

/**
 * TextareaField Component
 * Reusable textarea field with consistent styling
 * 
 * @param {string} label - Field label
 * @param {string} value - Textarea value
 * @param {function} onChange - Change handler
 * @param {boolean} required - Whether field is required
 * @param {string} error - Error message
 * @param {string} placeholder - Placeholder text
 * @param {number} rows - Number of rows
 * @param {string} className - Additional CSS classes
 * @param {string} helpText - Optional help text
 */
const TextareaField = ({
  label,
  value,
  onChange,
  required = false,
  error,
  placeholder,
  rows = 3,
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
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-md text-sm
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        `}
      />
    </FormField>
  );
};

export default TextareaField;