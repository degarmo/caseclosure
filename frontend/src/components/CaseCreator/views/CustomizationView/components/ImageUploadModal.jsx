// @/components/CaseCreator/views/CustomizationView/components/ImageUploadModal.jsx

import React, { useState } from 'react';
import { X, Upload, Image, Check } from 'lucide-react';

const ImageUploadModal = ({
  isOpen,
  onClose,
  onSave,
  currentValue,
  sectionId,
  label,
  casePhotos = [] // Photos from the form
}) => {
  const [selectedImage, setSelectedImage] = useState(currentValue || '');
  const [uploadedImage, setUploadedImage] = useState(null);
  
  // Placeholder silhouette image
  const PLACEHOLDER_SILHOUETTE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='%23e5e7eb'%3E%3Cpath d='M200 100c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60zm0 180c-66.3 0-120 26.8-120 60v20h240v-20c0-33.2-53.7-60-120-60z'/%3E%3C/svg%3E";

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImage = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleSave = () => {
    onSave(sectionId, selectedImage || PLACEHOLDER_SILHOUETTE);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Select {label || 'Image'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Upload New Image */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Upload New Image</h4>
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-600">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </label>
            {uploadedImage && (
              <div className="mt-3">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Case Photos from Form */}
          {casePhotos.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Photos from Case</h4>
              <div className="grid grid-cols-4 gap-3">
                {casePhotos.map((photo, index) => {
                  const photoUrl = photo.image_url || photo.image || photo;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectImage(photoUrl)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === photoUrl 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img 
                        src={photoUrl} 
                        alt={`Case photo ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      {selectedImage === photoUrl && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white bg-blue-500 rounded-full p-1" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Placeholder Option */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Or Use Placeholder</h4>
            <button
              onClick={() => handleSelectImage(PLACEHOLDER_SILHOUETTE)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === PLACEHOLDER_SILHOUETTE 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img 
                src={PLACEHOLDER_SILHOUETTE} 
                alt="Placeholder silhouette"
                className="w-32 h-32 object-cover bg-gray-100 p-4"
              />
              {selectedImage === PLACEHOLDER_SILHOUETTE && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white bg-blue-500 rounded-full p-1" />
                </div>
              )}
            </button>
          </div>

          {/* Preview */}
          {selectedImage && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <img 
                src={selectedImage} 
                alt="Preview"
                className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Use This Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;