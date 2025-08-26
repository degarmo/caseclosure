// src/components/CaseCreator/components/FormField.jsx

import React from 'react';

/**
 * FormField Component
 * Reusable form field wrapper with label and error state
 * 
 * @param {string} label - Field label
 * @param {boolean} required - Whether field is required
 * @param {string} error - Error message
 * @param {ReactNode} children - Form input element
 * @param {string} className - Additional CSS classes
 * @param {string} helpText - Optional help text below field
 */
const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  className = '',
  helpText
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;