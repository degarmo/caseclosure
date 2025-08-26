// src/components/CaseCreator/components/SectionWrapper.jsx

import React from 'react';

/**
 * SectionWrapper Component
 * Consistent wrapper for form sections
 * 
 * @param {string} title - Section title
 * @param {ReactNode} icon - Optional icon component
 * @param {ReactNode} children - Section content
 * @param {string} className - Additional CSS classes
 */
const SectionWrapper = ({ 
  title, 
  icon, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default SectionWrapper;