// src/components/CaseCreator/sections/MediaLinks.jsx

import React from 'react';
import { Link2, Plus, X } from 'lucide-react';
import SectionWrapper from '../components/SectionWrapper';

/**
 * MediaLinks Section Component
 * Handles media/news article links
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 */
const MediaLinks = ({ 
  caseData, 
  errors, 
  onChange 
}) => {
  
  const handleAddLink = () => {
    const currentLinks = caseData.media_links || [];
    onChange('media_links', [...currentLinks, '']);
  };
  
  const handleUpdateLink = (index, value) => {
    const currentLinks = [...(caseData.media_links || [])];
    currentLinks[index] = value;
    onChange('media_links', currentLinks);
  };
  
  const handleRemoveLink = (index) => {
    const currentLinks = caseData.media_links || [];
    const updatedLinks = currentLinks.filter((_, i) => i !== index);
    onChange('media_links', updatedLinks);
  };
  
  return (
    <SectionWrapper 
      title="Media Coverage" 
      icon={<Link2 className="w-5 h-5" />}
    >
      <div className="space-y-3">
        {(caseData.media_links || []).map((link, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => handleUpdateLink(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://example.com/article"
            />
            <button
              onClick={() => handleRemoveLink(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              aria-label="Remove link"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <button
          onClick={handleAddLink}
          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Media Link
        </button>
        
        {errors.media_links && (
          <p className="text-sm text-red-600">{errors.media_links}</p>
        )}
      </div>
    </SectionWrapper>
  );
};

export default MediaLinks;