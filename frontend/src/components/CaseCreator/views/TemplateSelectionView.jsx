// src/components/CaseCreator/views/TemplateSelectionView.jsx
// Updated to fetch templates from backend with thumbnails

import React, { useState, useEffect } from 'react';
import { Check, Layout, Loader } from 'lucide-react';
import { getEditableZones } from '../utils';
import api from '@/api/axios';

const TemplateSelectionView = ({
  selectedTemplate,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates/');
      setTemplates(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to load templates');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchTemplates}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Template</h2>
          <p className="text-lg text-gray-600">Select a design that best represents your case</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const isSelected = selectedTemplate?.template_id === template.template_id;
            const editableZones = getEditableZones(template);
            
            return (
              <div
                key={template.template_id}
                className={`
                  relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white
                  transform hover:scale-105 hover:shadow-xl
                  ${isSelected 
                    ? 'border-indigo-600 shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-indigo-400'
                  }
                `}
                onClick={() => onSelectTemplate(template)}
              >
                {/* Premium Badge */}
                {template.is_premium && (
                  <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    PREMIUM
                  </div>
                )}

                {/* Template Preview */}
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                  {template.preview_image || template.thumbnail_image ? (
                    <img 
                      src={template.preview_image || template.thumbnail_image} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ display: template.preview_image ? 'none' : 'flex' }}
                  >
                    <div className="text-center">
                      <Layout className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{template.name}</p>
                    </div>
                  </div>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white text-gray-900 px-6 py-2 rounded-full font-medium shadow-lg">
                      Select Template
                    </button>
                  </div>
                </div>
                
                {/* Template Info */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                  
                  {/* Features */}
                  {template.features && template.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Features:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature) => (
                          <span 
                            key={feature} 
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                          >
                            {feature.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {template.features.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{template.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Customizable Elements */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Customizable:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {editableZones.slice(0, 2).map((zone) => (
                        <span 
                          key={zone.id} 
                          className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700"
                        >
                          {zone.label}
                        </span>
                      ))}
                      {editableZones.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700">
                          +{editableZones.length - 2} options
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white p-2 rounded-full shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No templates message */}
        {templates.length === 0 && (
          <div className="text-center py-12">
            <Layout className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No templates available</p>
            <p className="text-gray-400 text-sm mt-2">Please contact support</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelectionView;