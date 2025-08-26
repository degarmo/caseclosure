// src/components/CaseCreator/components/SuccessMessage.jsx

import React from 'react';
import { Check } from 'lucide-react';

/**
 * SuccessMessage Component
 * Displays success messages in a styled alert box
 * 
 * @param {string} message - Success message to display
 * @param {boolean} show - Whether to show the message
 */
const SuccessMessage = ({ message = 'Operation completed successfully!', show }) => {
  if (!show) return null;

  return (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default SuccessMessage;