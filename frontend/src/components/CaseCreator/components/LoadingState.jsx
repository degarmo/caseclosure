// src/components/CaseCreator/components/LoadingState.jsx

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState Component
 * Displays a loading spinner with optional message
 * 
 * @param {string} message - Loading message to display
 * @param {string} size - Size of the spinner: 'small', 'medium', 'large'
 * @param {boolean} fullScreen - Whether to center in full container
 */
const LoadingState = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullScreen = false 
}) => {
  const sizes = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };
  
  const containerClass = fullScreen 
    ? 'h-full flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 
          className={`${sizes[size]} text-gray-400 animate-spin mx-auto mb-4`} 
        />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;