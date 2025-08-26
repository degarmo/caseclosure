// src/components/TemplateEditor.jsx
import React, { useState } from 'react';
import { getTemplate } from '@/templates/registry';
import { Camera, Type, Layout, Palette, Eye, Save } from 'lucide-react';

export default function TemplateEditor({ 
  templateId, 
  templateData, 
  caseData,
  onSave 
}) {
  const template = getTemplate(templateId);
  const [localData, setLocalData] = useState(templateData || {});
  const [activeTab, setActiveTab] = useState('home');
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (path, value) => {
    const keys = path.split('.');
    const newData = { ...localData };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localData);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (key, fieldSchema, currentValue, pathPrefix) => {
    const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const value = currentValue || fieldSchema.default || '';

    switch (fieldSchema.type) {
      case 'text':
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldSchema.label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(fullPath, e.target.value)}
              maxLength={fieldSchema.maxLength}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={fieldSchema.placeholder}
            />
            {fieldSchema.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {value.length}/{fieldSchema.maxLength} characters
              </p>
            )}
          </div>
        );

      case 'richtext':
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldSchema.label}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(fullPath, e.target.value)}
              rows={6}
              maxLength={fieldSchema.maxLength}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={fieldSchema.placeholder}
            />
            {fieldSchema.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {value.length}/{fieldSchema.maxLength} characters
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={key} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleFieldChange(fullPath, e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {fieldSchema.label}
              </span>
            </label>
          </div>
        );

      case 'color':
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldSchema.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => handleFieldChange(fullPath, e.target.value)}
                className="h-10 w-20"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(fullPath, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="#000000"
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldSchema.label}
            </label>
            <div className="space-y-2">
              {value && (
                <img 
                  src={value} 
                  alt={fieldSchema.label}
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-md cursor-pointer hover:bg-gray-100 border-2 border-dashed border-gray-300">
                <Camera className="w-4 h-4" />
                Upload {fieldSchema.label}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // In production, upload to server and get URL
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleFieldChange(fullPath, reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        );

      case 'gallery':
        const images = value || [];
        return (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldSchema.label}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    onClick={() => {
                      const newImages = images.filter((_, i) => i !== index);
                      handleFieldChange(fullPath, newImages);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-md cursor-pointer hover:bg-gray-100 border-2 border-dashed border-gray-300">
              <Camera className="w-4 h-4" />
              Add Photos
              <input 
                type="file" 
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  // In production, upload files and get URLs
                  const newImages = [...images];
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      newImages.push(reader.result);
                      handleFieldChange(fullPath, newImages);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              />
            </label>
            {fieldSchema.maxItems && (
              <p className="text-xs text-gray-500 mt-1">
                {images.length}/{fieldSchema.maxItems} photos
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Customize {template.name} Template
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  For {caseData?.first_name} {caseData?.last_name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/memorial/${caseData?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['global', ...Object.keys(template.schema.pages || {})].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'global' ? 'Global Settings' : `${tab} Page`}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="max-w-2xl">
              {activeTab === 'global' && template.schema.global && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Global Settings
                  </h2>
                  {Object.entries(template.schema.global).map(([key, fieldSchema]) =>
                    renderField(
                      key,
                      fieldSchema,
                      localData.global?.[key],
                      'global'
                    )
                  )}
                </div>
              )}

              {activeTab !== 'global' && template.schema.pages?.[activeTab] && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                    {activeTab} Page Settings
                  </h2>
                  {Object.entries(template.schema.pages[activeTab]).map(([key, fieldSchema]) =>
                    renderField(
                      key,
                      fieldSchema,
                      localData.pages?.[activeTab]?.[key],
                      `pages.${activeTab}`
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}