// src/components/common/RichTextEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Maximize2 } from 'lucide-react';
// Make sure this import path is correct based on your file structure
import RichTextEditor from './RichTextEditor';

const RichTextEditorModal = ({
  isOpen,
  onClose,
  onSave,
  title = 'Edit Content',
  content = '',
  placeholder = 'Start writing...',
  maxLength = null,
  fieldName = ''
}) => {
  const [tempContent, setTempContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset content when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setTempContent(content || '');
      setHasChanges(false);
    }
  }, [isOpen, content]);

  const handleSave = () => {
    onSave(tempContent);
    setHasChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleContentChange = (newContent) => {
    setTempContent(newContent);
    setHasChanges(newContent !== content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                {fieldName && (
                  <span className="text-sm text-gray-500">({fieldName})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-sm text-amber-600 px-2 py-1 bg-amber-50 rounded">
                    Unsaved changes
                  </span>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Editor Container */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <RichTextEditor
              content={tempContent}
              onChange={handleContentChange}
              placeholder={placeholder}
              maxLength={maxLength}
              minHeight="400px"
              showToolbar={true}
            />
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Tip: Use the formatting toolbar to make your content more engaging
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component for textarea with edit button
export const RichTextFieldWithModal = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  helpText,
  rows = 4
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Strip HTML tags for preview
  const getPlainTextPreview = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  };

  const plainTextPreview = getPlainTextPreview(value || '');

  // Debug logging
  console.log('RichTextFieldWithModal - value:', value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="relative">
        <div 
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors min-h-[100px] whitespace-pre-wrap"
          onClick={() => {
            console.log('Opening modal for:', label);
            setIsModalOpen(true);
          }}
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {plainTextPreview || <span className="text-gray-400">{placeholder}</span>}
        </div>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit button clicked for:', label);
            setIsModalOpen(true);
          }}
          className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <Maximize2 className="w-3 h-3" />
          Edit
        </button>
      </div>
      
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      
      <RichTextEditorModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Closing modal');
          setIsModalOpen(false);
        }}
        onSave={(newContent) => {
          console.log('Saving content:', newContent);
          onChange(newContent);
        }}
        title={`Edit ${label}`}
        content={value}
        placeholder={placeholder}
        maxLength={maxLength}
        fieldName={label}
      />
    </div>
  );
};

export default RichTextEditorModal;