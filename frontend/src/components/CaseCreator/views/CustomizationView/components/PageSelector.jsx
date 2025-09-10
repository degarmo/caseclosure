// @/components/CaseCreator/views/CustomizationView/components/PageSelector.jsx

import React from 'react';
import { ChevronDown } from 'lucide-react';

const PageSelector = ({ 
  currentPage, 
  availablePages = [], 
  onChange,
  className = '' 
}) => {
  if (!availablePages || availablePages.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentPage || availablePages[0]}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 hover:border-gray-400 transition-colors"
      >
        {availablePages.map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
};

export default PageSelector;