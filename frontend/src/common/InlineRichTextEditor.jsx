// src/components/common/InlineRichTextEditor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const InlineRichTextEditor = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  helpText,
  minCollapsedHeight = 100,
  expandedHeight = 400
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempContent, setTempContent] = useState(value || '');
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef(null);

  // Reset temp content when value changes externally
  useEffect(() => {
    if (!isExpanded) {
      setTempContent(value || '');
    }
  }, [value, isExpanded]);

  // Strip HTML for preview
  const getPlainTextPreview = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.length > 300 ? text.substring(0, 300) + '...' : text;
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTempContent(value || '');
    setHasChanges(false);
    
    // Scroll to editor after a brief delay for animation
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleSave = () => {
    onChange(tempContent);
    setHasChanges(false);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    setTempContent(value || '');
    setHasChanges(false);
    setIsExpanded(false);
  };

  const handleContentChange = (newContent) => {
    setTempContent(newContent);
    setHasChanges(newContent !== value);
  };

  return (
    <div ref={editorRef} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {!isExpanded ? (
        // Collapsed state - clickable preview
        <div 
          onClick={handleExpand}
          className="relative border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group"
          style={{ minHeight: minCollapsedHeight }}
        >
          <div className="p-3 pr-12">
            {value ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {getPlainTextPreview(value)}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                {placeholder || 'Click to add content...'}
              </div>
            )}
          </div>
          
          <div className="absolute top-3 right-3 flex items-center gap-1 text-blue-600 group-hover:text-blue-700">
            <span className="text-xs font-medium">Edit</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      ) : (
        // Expanded state - full editor
        <div className="border-2 border-blue-500 rounded-lg bg-white shadow-lg">
          <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex justify-between items-center">
            <div className="text-sm font-medium text-blue-900">
              Editing: {label}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div style={{ height: expandedHeight, overflow: 'auto' }}>
            <RichTextEditor
              content={tempContent}
              onChange={handleContentChange}
              placeholder={placeholder}
              maxLength={maxLength}
              minHeight={`${expandedHeight - 50}px`}
              showToolbar={true}
            />
          </div>
          
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default InlineRichTextEditor;