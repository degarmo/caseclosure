// src/components/CaseCreator/components/ErrorDisplay.jsx

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorDisplay Component
 * Displays error messages in a styled alert box
 * 
 * @param {string} error - Error message to display
 * @param {function} onDismiss - Optional callback to dismiss the error
 */
const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{error}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;