// src/components/common/FocusedRichTextEditor.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const FocusedRichTextEditor = ({
  isOpen,
  onClose,
  onSave,
  title = 'Edit Content',
  content = '',
  placeholder = 'Start writing...',
  maxLength = null,
  sectionId = null // ID to scroll to in the preview
}) => {
  const [tempContent, setTempContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempContent(content || '');
      setHasChanges(false);
      
      // Send message to iframe to scroll to the section being edited
      if (sectionId) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.contentWindow.postMessage({
            type: 'SCROLL_TO_SECTION',
            sectionId: sectionId
          }, '*');
        }
      }
    }
  }, [isOpen, content, sectionId]);

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
    
    // Send live preview update to iframe
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({
        type: 'PREVIEW_UPDATE',
        sectionId: sectionId,
        content: newContent
      }, '*');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={handleClose}
      />
      
      {/* Modal positioned at top center, taking 50% width */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-1/2 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-sm text-amber-600 px-2 py-1 bg-amber-50 rounded">
                    Unsaved changes
                  </span>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Editor */}
          <div className="px-6 py-4 bg-white" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            <RichTextEditor
              content={tempContent}
              onChange={handleContentChange}
              placeholder={placeholder}
              maxLength={maxLength}
              minHeight="300px"
              showToolbar={true}
            />
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 bg-white rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Changes appear in preview below as you type
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Field component with the editor trigger
export const FocusedTextField = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  helpText,
  sectionId // Pass this to identify which section to scroll to
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Strip HTML for preview
  const getPlainTextPreview = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div 
        onClick={() => setIsEditorOpen(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-colors min-h-[80px]"
      >
        <div className="text-sm text-gray-700">
          {value ? getPlainTextPreview(value) : <span className="text-gray-400 italic">{placeholder}</span>}
        </div>
      </div>
      
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      
      <FocusedRichTextEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={onChange}
        title={label}
        content={value}
        placeholder={placeholder}
        maxLength={maxLength}
        sectionId={sectionId}
      />
    </div>
  );
};

export default FocusedRichTextEditor;