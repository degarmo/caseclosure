// src/components/CaseCreator/views/TemplatePreviewWrapper.jsx
// Loads and renders actual template components

import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

// Import all template components directly
import BeaconLayout from '../../../templates/beacon/src/pages/Layout';
import BeaconHome from '../../../templates/beacon/src/pages/Home';
import BeaconAbout from '../../../templates/beacon/src/pages/About';
import BeaconSpotlight from '../../../templates/beacon/src/pages/Spotlight';
import BeaconContact from '../../../templates/beacon/src/pages/Contact';

// Debug flag - set to false in production
const DEBUG_MODE = true;

// Template registry
const TEMPLATE_REGISTRY = {
  beacon: {
    layout: BeaconLayout,
    components: {
      home: BeaconHome,
      about: BeaconAbout,
      spotlight: BeaconSpotlight,
      contact: BeaconContact
    }
  }
  // Add other templates here when ready
  // justice: { ... },
  // legacy: { ... }
};

const TemplatePreviewWrapper = () => {
  // Use refs to prevent re-initialization
  const mountIdRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const messageHandlerRef = useRef(null);
  
  // Generate mount ID only once
  if (!mountIdRef.current) {
    mountIdRef.current = Math.random().toString(36).substr(2, 9);
  }
  
  // Get URL params
  const { caseId, page = 'home' } = useParams();
  const [searchParams] = useSearchParams();
  const templateName = searchParams.get('template') || 'beacon';
  
  // Check if we're in an iframe
  const inIframe = useMemo(() => window.parent !== window, []);
  
  // State
  const [caseData, setCaseData] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [isReady, setIsReady] = useState(false);

  // Log mounting only once
  useEffect(() => {
    if (!hasInitializedRef.current && DEBUG_MODE) {
      console.log(`🚀 [${mountIdRef.current}] TemplatePreviewWrapper mounting`);
      console.log('📍 Current URL:', window.location.href);
      console.log('🖼️ In iframe?', inIframe);
      console.log('📝 Template: ${templateName}, Page: ${page}');
      
      hasInitializedRef.current = true;
    }
  }, []);

  // Message handler - memoized to prevent recreation
  useEffect(() => {
    if (messageHandlerRef.current) return; // Already set up
    
    const handleMessage = (event) => {
      // Security: validate origin
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000', 
        'http://caseclosure.org:5173',
        'http://caseclosure.org:3000',
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        if (DEBUG_MODE) {
          console.warn('🚫 Blocked message from:', event.origin);
        }
        return;
      }
      
      if (DEBUG_MODE) {
        console.log('📨 Message received:', event.data.type);
      }
      
      switch(event.data.type) {
        case 'INIT_CUSTOMIZATIONS':
          setCustomizations(event.data.customizations || {});
          if (event.data.caseData) {
            setCaseData(event.data.caseData);
            if (DEBUG_MODE) {
              console.log('✅ Set case data:', event.data.caseData);
            }
          }
          setIsReady(true);
          break;
          
        case 'UPDATE_CUSTOMIZATIONS':
          setCustomizations(prev => ({
            ...prev,
            ...(event.data.customizations || {})
          }));
          if (event.data.caseData) {
            setCaseData(prev => ({
              ...prev,
              ...event.data.caseData
            }));
          }
          break;
          
        default:
          if (DEBUG_MODE) {
            console.log('Unknown message type:', event.data.type);
          }
      }
    };

    messageHandlerRef.current = handleMessage;
    window.addEventListener('message', handleMessage);
    
    // Tell parent iframe we're ready (only if in iframe)
    if (inIframe) {
      // Send ready message multiple times to ensure parent receives it
      const sendReady = () => {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        if (DEBUG_MODE) {
          console.log('📤 Sent PREVIEW_READY to parent');
        }
      };
      
      sendReady();
      setTimeout(sendReady, 500);
      setTimeout(sendReady, 1000);
      setTimeout(sendReady, 2000);
    } else {
      // Not in iframe - set ready immediately with default data
      setIsReady(true);
      setCaseData({
        id: caseId || 'preview',
        first_name: 'Preview',
        last_name: 'Mode',
        case_title: 'Preview Mode',
        description: 'This is a preview. Add case data to see your actual content.',
        case_type: 'missing',
        incident_date: new Date().toISOString().split('T')[0],
        incident_location: 'Location',
        detective_name: 'Detective Name',
        detective_phone: '(555) 123-4567',
        detective_email: 'detective@example.com',
        agency_name: 'Police Department',
        reward_amount: 10000
      });
    }
    
    // Auto-timeout for iframe mode - show preview with default data after 3 seconds
    if (inIframe && !caseData) {
      const timeout = setTimeout(() => {
        if (!caseData) {
          console.log('⏱️ Timeout waiting for data, using defaults');
          setCaseData({
            id: 'new',
            first_name: 'Your',
            last_name: 'Name',
            case_title: 'Your Case Title',
            description: 'Your case description will appear here.',
            case_type: 'missing',
            incident_date: new Date().toISOString().split('T')[0],
            incident_location: 'Your Location',
            detective_name: 'Detective Name',
            detective_phone: '(555) 123-4567',
            detective_email: 'detective@example.com',
            agency_name: 'Police Department',
            reward_amount: 10000
          });
          setIsReady(true);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (DEBUG_MODE) {
        console.log('🧹 Cleaning up message handler');
      }
    };
  }, [inIframe]);

  // Get the template components
  const template = TEMPLATE_REGISTRY[templateName];
  const LayoutComponent = template?.layout;
  const PageComponent = template?.components?.[page];

  // Prepare props for template components
  const templateProps = useMemo(() => ({
    caseData: caseData || {},
    customizations: customizations,
    isPreview: true,
    isEditing: false,
    currentPage: page,
    onCustomizationChange: (updates) => {
      console.log('Customization change:', updates);
      // In preview mode, we don't save changes, just update local state
      setCustomizations(prev => ({
        ...prev,
        ...updates
      }));
    }
  }), [caseData, customizations, page]);

  // Loading state
  if (!isReady && inIframe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template preview...</p>
        </div>
      </div>
    );
  }

  // Check if template exists
  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Template Not Found
          </h2>
          <p className="text-red-800 mb-2">
            Template "{templateName}" is not available
          </p>
          <p className="text-sm text-red-600">
            Available templates: {Object.keys(TEMPLATE_REGISTRY).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Check if page component exists
  if (!PageComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-yellow-700 mb-2">
            Page "{page}" not found in {templateName} template
          </p>
          <p className="text-sm text-yellow-600">
            Available pages: {Object.keys(template.components).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Apply global customizations as CSS variables
  const globalStyles = {
    '--primary-color': customizations?.global?.primaryColor || '#3B82F6',
    '--font-family': customizations?.global?.fontFamily || 'Inter, sans-serif',
    fontFamily: customizations?.global?.fontFamily || 'Inter, sans-serif',
    minHeight: '100vh'
  };

  // Render the actual template with layout
  return (
    <div style={globalStyles}>
      {DEBUG_MODE && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-xs z-50">
          <strong>Preview Mode</strong> | Template: {templateName} | Page: {page} | 
          Has Data: {!!caseData} | Name: {caseData?.first_name || 'None'}
        </div>
      )}
      
      <div className={DEBUG_MODE ? "pt-8" : ""}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading template...</p>
            </div>
          </div>
        }>
          {LayoutComponent ? (
            // Render with layout
            <LayoutComponent {...templateProps}>
              <PageComponent {...templateProps} />
            </LayoutComponent>
          ) : (
            // Render without layout
            <PageComponent {...templateProps} />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default TemplatePreviewWrapper;