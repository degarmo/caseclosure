// src/components/CaseCreator/hooks/useCaseData.js

import { useState, useEffect, useCallback } from 'react';
import { INITIAL_CASE_DATA } from '../constants';
import { calculateAge, validateRequiredFields } from '../utils';

/**
 * Custom hook for managing case data and validation
 */
export const useCaseData = () => {
  const [caseData, setCaseData] = useState(INITIAL_CASE_DATA);
  const [errors, setErrors] = useState({});
  
  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (caseData.date_of_birth) {
      const age = calculateAge(caseData.date_of_birth);
      setCaseData(prev => ({ ...prev, age }));
    }
  }, [caseData.date_of_birth]);
  
  // Handle field changes
  const handleChange = useCallback((field, value) => {
    setCaseData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when it's changed
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);
  
  // Handle file uploads with preview
  const handleFileUpload = useCallback((fieldName, file, preview) => {
    setCaseData(prev => ({
      ...prev,
      [fieldName]: file,
      [`${fieldName}_preview`]: preview
    }));
  }, []);
  
  // Validate current data
  const validateSection = useCallback(() => {
    const newErrors = validateRequiredFields(caseData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [caseData]);
  
  // Reset form data
  const resetData = useCallback(() => {
    setCaseData(INITIAL_CASE_DATA);
    setErrors({});
  }, []);
  
  // Load existing case data
  const loadCaseData = useCallback((data) => {
    setCaseData(prev => ({
      ...prev,
      ...data
    }));
  }, []);
  
  return {
    caseData,
    errors,
    setErrors,
    handleChange,
    handleFileUpload,
    validateSection,
    resetData,
    loadCaseData
  };
};