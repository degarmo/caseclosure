// src/components/CaseCreator/views/CustomizationView.jsx
// REPLACE YOUR ENTIRE CustomizationView.jsx WITH THIS FILE

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// This component renders the actual template for preview in an iframe
const PreviewView = () => {
  const { caseId, page = 'home' } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [templateId, setTemplateId] = useState('beacon');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get template ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const template = urlParams.get('template');
    if (template) {
      setTemplateId(template);
    }

    // Listen for customization updates from parent window
    const handleMessage = (event) => {
      if (event.data.type === 'UPDATE_CUSTOMIZATIONS') {
        setCustomizations(event.data.customizations);
      } else if (event.data.type === 'INIT_CUSTOMIZATIONS') {
        setCustomizations(event.data.customizations);
        if (event.data.caseData) {
          setCaseData(event.data.caseData);
        }
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Tell parent we're ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Simple template preview based on customizations
  const renderTemplate = () => {
    const globalStyles = customizations?.global || {};
    const pageCustomizations = customizations?.pages?.[page] || {};
    
    // Apply custom styles
    const customStyles = {
      '--primary-color': globalStyles.primaryColor || '#3B82F6',
      fontFamily: globalStyles.fontFamily || 'Inter, sans-serif',
    };

    return (
      <div className="min-h-screen" style={customStyles}>
        {/* Header */}
        <header 
          className="bg-white shadow-sm border-b"
          style={{ borderColor: `${globalStyles.primaryColor}20` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 
                className="text-xl font-bold"
                style={{ color: globalStyles.primaryColor }}
              >
                {caseData?.case_title || 'Memorial Site'}
              </h1>
              
              {/* Navigation */}
              <nav className="flex space-x-8">
                {['home', 'about', 'spotlight', 'contact'].map(navPage => (
                  <button
                    key={navPage}
                    className={`text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                      page === navPage ? 'border-b-2' : ''
                    }`}
                    style={{
                      borderColor: page === navPage ? globalStyles.primaryColor : 'transparent',
                      color: page === navPage ? globalStyles.primaryColor : undefined
                    }}
                  >
                    {navPage.charAt(0).toUpperCase() + navPage.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {page === 'home' && (
            <div>
              {/* Hero Section */}
              <div className="bg-gradient-to-b from-blue-50 to-white py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {pageCustomizations.heroTitle || 'Help Us Find'} {caseData?.first_name || 'John'}
                  </h2>
                  {pageCustomizations.heroDescription && (
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                      {pageCustomizations.heroDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Case Info */}
              <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">
                      About {caseData?.first_name || 'the Case'}
                    </h3>
                    <p className="text-gray-600">
                      {caseData?.description || 'Case description will appear here. This is a preview of how your website will look with your actual content.'}
                    </p>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">Photo will appear here</p>
                  </div>
                </div>
              </div>

              {/* Updates Section */}
              {pageCustomizations.showSpotlight !== false && (
                <div className="bg-gray-50 py-12">
                  <div className="max-w-7xl mx-auto px-4">
                    <h3 className="text-2xl font-semibold mb-6">Latest Updates</h3>
                    <p className="text-gray-600">Updates and news will appear here</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === 'about' && (
            <div className="max-w-7xl mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-6">About {caseData?.first_name || 'John'}</h2>
              <div className="prose max-w-none">
                <p>{pageCustomizations.content || 'About page content will appear here.'}</p>
              </div>
            </div>
          )}

          {page === 'contact' && (
            <div className="max-w-7xl mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Law Enforcement</h3>
                <p>Detective: {caseData?.detective_name || 'Not provided'}</p>
                <p>Phone: {caseData?.detective_phone || 'Not provided'}</p>
                <p>Email: {caseData?.detective_email || 'Not provided'}</p>
              </div>
              
              {(pageCustomizations.showFamilyPhone || pageCustomizations.showFamilyEmail) && (
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-xl font-semibold mb-4">Family Contact</h3>
                  {pageCustomizations.showFamilyPhone && pageCustomizations.familyPhone && (
                    <p>Phone: {pageCustomizations.familyPhone}</p>
                  )}
                  {pageCustomizations.showFamilyEmail && pageCustomizations.familyEmail && (
                    <p>Email: {pageCustomizations.familyEmail}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {page === 'spotlight' && (
            <div className="max-w-7xl mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-6">Latest Updates</h2>
              <p className="text-gray-600">No updates yet.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer 
          className="bg-gray-50 border-t mt-12"
          style={{ borderColor: `${globalStyles.primaryColor}20` }}
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <p className="text-center text-gray-600 text-sm">
              {caseData?.first_name} {caseData?.last_name} Memorial
            </p>
          </div>
        </footer>
      </div>
    );
  };

  return renderTemplate();
};

export default PreviewView;