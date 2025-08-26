// src/components/CaseCreator/components/FileUpload.jsx

import React from 'react';
import { Camera, Car, Upload, Image, X } from 'lucide-react';

/**
 * FileUpload Component
 * Reusable file upload component with preview
 * 
 * @param {string} label - Label for the upload button
 * @param {string} preview - Preview URL/data for uploaded file
 * @param {function} onChange - Callback when file is selected
 * @param {string} accept - Accepted file types
 * @param {string} icon - Icon type: 'camera', 'car', 'image', or 'upload'
 * @param {string} className - Additional CSS classes
 * @param {boolean} showPreview - Whether to show preview image
 * @param {function} onRemove - Optional callback to remove uploaded file
 */
const FileUpload = ({ 
  label = 'Upload File',
  preview,
  onChange,
  accept = 'image/*',
  icon = 'upload',
  className = '',
  showPreview = true,
  onRemove,
  previewSize = 'medium'
}) => {
  
  const iconComponents = {
    camera: Camera,
    car: Car,
    image: Image,
    upload: Upload
  };
  
  const IconComponent = iconComponents[icon] || Upload;
  
  const previewSizes = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onChange) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {showPreview && preview && (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className={`${previewSizes[previewSize]} rounded-lg object-cover border-2 border-gray-200`}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 border border-gray-300 transition-colors">
        <IconComponent className="w-4 h-4" />
        <span>{label}</span>
        <input 
          type="file" 
          onChange={handleFileChange}
          className="hidden" 
          accept={accept}
        />
      </label>
    </div>
  );
};

export default FileUpload;