// src/templates/TemplateRenderer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Routes, Route } from 'react-router-dom';
import api from '@/api/axios';
import { getTemplate } from './registry';

export default function TemplateRenderer() {
  const location = useLocation();
  const [caseData, setCaseData] = useState(null);
  const [templateConfig, setTemplateConfig] = useState(null);
  const [components, setComponents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    try {
      // Determine how to load the case
      const hostname = window.location.hostname;
      let response;
      
      if (hostname.includes('.caseclosure.org') && !hostname.startsWith('www')) {
        // Subdomain routing
        const subdomain = hostname.split('.')[0];
        response = await api.get(`/api/cases/by-subdomain/${subdomain}/`);
      } else {
        // For development or path-based routing
        const pathParts = location.pathname.split('/');
        const caseId = pathParts[2]; // assumes /memorial/[caseId]/...
        response = await api.get(`/api/cases/${caseId}/`);
      }
      
      setCaseData(response.data);
      
      // Load the template configuration
      const template = getTemplate(response.data.template || 'beacon');
      setTemplateConfig(template);
      
      // Dynamically load all components for this template
      const loadedComponents = {};
      for (const [key, loader] of Object.entries(template.components)) {
        const module = await loader();
        loadedComponents[key] = module.default;
      }
      setComponents(loadedComponents);
      
    } catch (err) {
      console.error('Failed to load case:', err);
      setError('Case not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (path, value) => {
    // Update template_data at specific path
    const updatedData = { ...caseData.template_data };
    const keys = path.split('.');
    let current = updatedData;
    
    // Navigate to the parent of the target
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    // Save to backend
    try {
      await api.patch(`/api/cases/${caseData.id}/`, {
        template_data: updatedData
      });
      
      setCaseData({
        ...caseData,
        template_data: updatedData
      });
    } catch (err) {
      console.error('Failed to save update:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading memorial site...</p>
        </div>
      </div>
    );
  }

  if (error || !components.layout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Site Not Found</h1>
          <p className="text-gray-600">This memorial page could not be found.</p>
        </div>
      </div>
    );
  }

  const Layout = components.layout;
  const isEditing = new URLSearchParams(location.search).get('edit') === 'true';

  // Render the template with its layout
  return (
    <Layout 
      caseData={caseData}
      customizations={caseData.template_data}
      isEditing={isEditing}
      onCustomizationChange={handleUpdate}
    >
      <Routes>
        <Route 
          path="/" 
          element={
            components.home ? (
              <components.home 
                caseData={caseData}
                customizations={caseData.template_data?.pages?.home || {}}
                isEditing={isEditing}
                onCustomizationChange={(field, value) => handleUpdate(`pages.home.${field}`, value)}
              />
            ) : <div>Home page not found</div>
          } 
        />
        
        {components.about && (
          <Route 
            path="/about" 
            element={
              <components.about 
                caseData={caseData}
                customizations={caseData.template_data?.pages?.about || {}}
                isEditing={isEditing}
                onCustomizationChange={(field, value) => handleUpdate(`pages.about.${field}`, value)}
              />
            } 
          />
        )}
        
        {components.spotlight && (
          <Route 
            path="/spotlight" 
            element={
              <components.spotlight 
                caseData={caseData}
                customizations={caseData.template_data?.pages?.spotlight || {}}
                isEditing={isEditing}
                onCustomizationChange={(field, value) => handleUpdate(`pages.spotlight.${field}`, value)}
              />
            } 
          />
        )}
        
        {components.contact && (
          <Route 
            path="/contact" 
            element={
              <components.contact 
                caseData={caseData}
                customizations={caseData.template_data?.pages?.contact || {}}
                isEditing={isEditing}
                onCustomizationChange={(field, value) => handleUpdate(`pages.contact.${field}`, value)}
              />
            } 
          />
        )}
      </Routes>
    </Layout>
  );
}