import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const EditButton = ({ onClick, isActive = false, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 
        text-white flex items-center justify-center shadow-lg 
        transition-all duration-300 transform hover:scale-110
        ${isActive ? 'rotate-45' : ''}
        ${className}
      `}
      style={{ zIndex: 50 }}
    >
      <Plus className="w-5 h-5" />
    </button>
  );
};

export default EditButton;