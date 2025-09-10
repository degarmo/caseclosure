// @/components/CaseCreator/views/CustomizationView/components/ActionButtons.jsx

import React from 'react';
import { Save, Eye, ChevronRight, Loader2 } from 'lucide-react';

const ActionButtons = ({
  onPreview,
  onSave,
  onContinue,
  isSaving = false,
  unsavedChanges = false,
  showContinueButton = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Preview Button */}
      {onPreview && (
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Preview"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>
      )}

      {/* Save Button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving || !unsavedChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            unsavedChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Save"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? 'Saving...' : 'Save'}
          </span>
        </button>
      )}

      {/* Continue Button */}
      {showContinueButton && onContinue && (
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          aria-label="Continue"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;