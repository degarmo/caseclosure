// src/components/CaseCreator/views/SimplePreviewComponent.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const SimplePreviewComponent = () => {
  const { caseId, page = 'home' } = useParams();
  const [searchParams] = useSearchParams();
  const templateName = searchParams.get('template') || 'beacon';
  const isEditing = searchParams.get('edit') === 'true';
  
  const [caseData, setCaseData] = useState({
    first_name: '',
    last_name: '',
    case_type: '',
    case_title: '',
    description: ''
  });
  const [customizations, setCustomizations] = useState({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Listen for messages from parent window
    const handleMessage = (event) => {
      // Security: validate origin
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Blocked message from:', event.origin);
        return;
      }
      
      console.log('Preview received message:', event.data);
      
      if (event.data.type === 'INIT_CUSTOMIZATIONS' || event.data.type === 'UPDATE_CUSTOMIZATIONS') {
        if (event.data.customizations) {
          setCustomizations(event.data.customizations);
        }
        if (event.data.caseData) {
          setCaseData(event.data.caseData);
          console.log('Set case data:', event.data.caseData);
        }
        setIsReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Tell parent we're ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      console.log('Sent PREVIEW_READY to parent');
      
      // Send multiple times to ensure delivery
      setTimeout(() => {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      }, 500);
      setTimeout(() => {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      }, 1000);
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Get display values
  const firstName = caseData?.first_name || 'First';
  const lastName = caseData?.last_name || 'Last';
  const fullName = `${firstName} ${lastName}`.trim();
  const caseType = caseData?.case_type || caseData?.crime_type || 'missing';
  
  // Determine hero title based on case type
  const getHeroTitle = () => {
    switch(caseType.toLowerCase()) {
      case 'missing':
      case 'missing person':
      case 'missing_person':
        return 'Help Find';
      case 'homicide':
      case 'murder':
        return 'Justice for';
      default:
        return 'Help Find';
    }
  };

  // Get customization values
  const navbarTitle = customizations?.global?.navbarTitle || `${getHeroTitle()} ${fullName}`;
  const primaryColor = customizations?.global?.primaryColor || '#3B82F6';
  const heroImage = customizations?.hero?.heroImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop';
  const heroTagline = customizations?.hero?.heroTagline || `Help us find answers`;
  const showInvestigationStatus = customizations?.hero?.showInvestigationStatus !== false;
  const investigationStatus = customizations?.hero?.investigationStatus || 'ACTIVE INVESTIGATION';
  const showReward = customizations?.hero?.showReward && caseData?.reward_amount > 0;
  const aboutTitle = customizations?.about?.aboutTitle || `About ${firstName}`;
  const aboutContent = customizations?.about?.aboutContent || caseData?.description || `Information about ${fullName}'s case.`;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
              {navbarTitle}
            </h1>
            <div className="flex space-x-8">
              {['home', 'about', 'spotlight', 'contact'].map(navPage => (
                <button
                  key={navPage}
                  className={`text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                    page === navPage ? 'border-b-2' : ''
                  }`}
                  style={{
                    borderColor: page === navPage ? primaryColor : 'transparent',
                    color: page === navPage ? primaryColor : undefined
                  }}
                  disabled={isEditing}
                >
                  {navPage.charAt(0).toUpperCase() + navPage.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {page === 'home' && (
        <>
          {/* Hero Section */}
          <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={heroImage}
                alt={`Memorial for ${fullName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
            
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
                <div className="max-w-3xl">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                    {getHeroTitle()}
                    <span className="block text-yellow-400">{firstName}</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
                    {heroTagline}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      className="px-8 py-3 bg-yellow-400 text-slate-800 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                      disabled={isEditing}
                    >
                      Submit a Tip
                    </button>
                    <button 
                      className="px-8 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
                      disabled={isEditing}
                    >
                      Share Their Story
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-slate-800 text-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  {showInvestigationStatus && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-yellow-400">{investigationStatus}</span>
                    </div>
                  )}
                  {caseData?.case_number && (
                    <span className="text-slate-300">Case #: {caseData.case_number}</span>
                  )}
                </div>
                {showReward && (
                  <span className="bg-slate-700 px-3 py-1 rounded-full">
                    ${caseData.reward_amount.toLocaleString()} Reward
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">{aboutTitle}</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {aboutContent}
              </p>
            </div>
          </div>
        </>
      )}

      {page === 'about' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-6">About {firstName}</h2>
          <div className="prose max-w-none">
            <p>{aboutContent}</p>
          </div>
        </div>
      )}

      {page === 'contact' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Law Enforcement</h3>
            <p>Detective: {caseData?.detective_name || 'Not provided'}</p>
            <p>Phone: {caseData?.detective_phone || 'Not provided'}</p>
            <p>Email: {caseData?.detective_email || 'Not provided'}</p>
          </div>
        </div>
      )}

      {page === 'spotlight' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-6">Latest Updates</h2>
          <p className="text-gray-600">No updates yet.</p>
        </div>
      )}

      {/* Debug info in edit mode */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 border-t border-yellow-300 p-2 text-xs">
          <strong>Debug:</strong> Name: {firstName} {lastName} | Type: {caseType} | Ready: {isReady.toString()}
        </div>
      )}
    </div>
  );
};

export default SimplePreviewComponent;