// src/templates/TemplateRenderer.jsx - Enhanced debugging version
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import api from '@/api/axios';
import { getTemplate } from './registry';
import getSubdomain from '@/utils/getSubdomain';

export default function TemplateRenderer() {
  const location = useLocation();
  const [caseData, setCaseData] = useState(null);
  const [templateConfig, setTemplateConfig] = useState(null);
  const [components, setComponents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    try {
      const subdomain = getSubdomain();
      const hostname = window.location.hostname;
      
      // Enhanced debugging
      const debug = {
        hostname,
        subdomain,
        pathname: location.pathname,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 TemplateRenderer Debug:', debug);
      setDebugInfo(debug);
      
      let response;
      
      if (subdomain) {
        console.log('📡 Fetching case by subdomain:', subdomain);
        const url = `/cases/by-subdomain/${subdomain}/`;
        console.log('🌐 API URL:', url);
        
        try {
          response = await api.get(url);
          console.log('✅ API Response:', response.data);
        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          console.error('Status:', apiError.response?.status);
          console.error('Data:', apiError.response?.data);
          throw new Error(`API Error (${apiError.response?.status}): ${apiError.response?.data?.error || apiError.message}`);
        }
      } else {
        // Fallback to path-based routing
        const pathParts = location.pathname.split('/');
        const caseId = pathParts[2];
        
        if (!caseId) {
          throw new Error('No subdomain or case ID found');
        }
        
        console.log('📡 Fetching case by ID:', caseId);
        response = await api.get(`/cases/${caseId}/`);
      }
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      console.log('📦 Case Data:', {
        id: response.data.id,
        subdomain: response.data.subdomain,
        template_id: response.data.template_id,
        is_public: response.data.is_public,
        deployment_status: response.data.deployment_status
      });
      
      // Check if case is public and deployed
      if (!response.data.is_public) {
        throw new Error('This case is not public');
      }
      
      if (response.data.deployment_status !== 'deployed') {
        throw new Error(`This case is not deployed (status: ${response.data.deployment_status})`);
      }
      
      setCaseData(response.data);
      
      // Load template
      const templateId = response.data.template_id || 'beacon';
      console.log('🎨 Loading template:', templateId);
      
      let template;
      try {
        template = getTemplate(templateId);
        console.log('✅ Template loaded:', template);
      } catch (templateError) {
        console.error('❌ Template Error:', templateError);
        throw new Error(`Template "${templateId}" not found`);
      }
      
      if (!template) {
        throw new Error(`Template "${templateId}" returned null`);
      }
      
      setTemplateConfig(template);
      
      // Load components
      console.log('📥 Loading components:', Object.keys(template.components));
      const loadedComponents = {};
      
      for (const [key, loader] of Object.entries(template.components)) {
        try {
          const module = await loader();
          loadedComponents[key] = module.default;
          console.log(`✅ Loaded component: ${key}`);
        } catch (compError) {
          console.error(`❌ Failed to load component ${key}:`, compError);
        }
      }
      
      if (!loadedComponents.layout) {
        throw new Error('Layout component not found in template');
      }
      
      console.log('✅ All components loaded:', Object.keys(loadedComponents));
      setComponents(loadedComponents);
      
    } catch (err) {
      console.error('❌ Fatal Error:', err);
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (path, value) => {
    const updatedData = { ...caseData.template_data };
    const keys = path.split('.');
    let current = updatedData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    try {
      await api.patch(`/cases/${caseData.id}/`, {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading memorial site...</p>
          {debugInfo.subdomain && (
            <p className="mt-2 text-sm text-gray-500">Subdomain: {debugInfo.subdomain}</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !components.layout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Not Found</h1>
            <p className="text-lg text-gray-600">{error || 'This memorial page could not be found.'}</p>
          </div>
          
          {/* Debug Information */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold text-gray-700 mb-2">Debug Information:</h3>
            <div className="text-sm text-gray-600 space-y-1 font-mono">
              <div>Hostname: {debugInfo.hostname}</div>
              <div>Subdomain: {debugInfo.subdomain || 'Not detected'}</div>
              <div>Path: {debugInfo.pathname}</div>
              <div>Time: {debugInfo.timestamp}</div>
              {caseData && (
                <>
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <div>Case ID: {caseData.id}</div>
                    <div>Template: {caseData.template_id}</div>
                    <div>Public: {caseData.is_public ? 'Yes' : 'No'}</div>
                    <div>Status: {caseData.deployment_status}</div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <a 
              href="https://caseclosure.org" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Return to CaseClosure.org
            </a>
          </div>
        </div>
      </div>
    );
  }

  const Layout = components.layout;
  const isEditing = new URLSearchParams(location.search).get('edit') === 'true';

  return (
    <Layout 
      caseData={caseData}
      customizations={caseData.template_data}
      isEditing={isEditing}
      onCustomizationChange={handleUpdate}
    >
      <Routes>
        {/* ADDED: Redirect /home to / */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        
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