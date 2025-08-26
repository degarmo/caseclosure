// src/components/CaseCreator/views/CustomizationView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Upload, ChevronLeft, Eye, Save, Image, Check } from 'lucide-react';
import * as caseAPI from '../services/caseAPI';

// Available logo options - custom images from src/templates/logos/
const LOGO_OPTIONS = [
  { 
    id: 'dove', 
    type: 'image',
    src: '/src/templates/logos/dove.png',
    name: 'Dove' 
  },
  { 
    id: 'flame', 
    type: 'image',
    src: '/src/templates/logos/flame.png',
    name: 'Flame' 
  },
  { 
    id: 'lantern', 
    type: 'image',
    src: '/src/templates/logos/lantern.png',
    name: 'Lantern' 
  },
  { id: 'heart', icon: '❤️', type: 'emoji', name: 'Heart' },
  { id: 'ribbon', icon: '🎗️', type: 'emoji', name: 'Ribbon' },
  { id: 'star', icon: '⭐', type: 'emoji', name: 'Star' }
];

// Hero image gallery - actual images from src/templates/images/
const HERO_IMAGE_OPTIONS = [
  {
    id: 'beacon',
    name: 'Beacon',
    path: '/src/templates/images/beacon.jpg',
    fallback: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop'
  },
  {
    id: 'calm',
    name: 'Calm',
    path: '/src/templates/images/calm.jpg',
    fallback: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=1200&h=800&fit=crop'
  },
  {
    id: 'stillness',
    name: 'Stillness',
    path: '/src/templates/images/stillness.jpg',
    fallback: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    path: '/src/templates/images/sunset.jpg',
    fallback: 'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=1200&h=800&fit=crop'
  }
];

const CustomizationView = ({ 
  caseData: propCaseData,
  selectedTemplate: propSelectedTemplate,
  customizations: propCustomizations,
  onCustomizationChange: propOnCustomizationChange,
  onViewChange,
  onSave,
  caseId: propCaseId
}) => {
  const iframeRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const caseIdRef = useRef(null); // Add ref to track case ID persistently
  
  const [messageSent, setMessageSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTab, setActiveTab] = useState('global');
  const [isReady, setIsReady] = useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState('beacon');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [localCaseId, setLocalCaseId] = useState(propCaseId || null);
  const [hasCreatedCase, setHasCreatedCase] = useState(false); // Track if we've created a case
  
  const formData = propCaseData || {};
  const templateName = propSelectedTemplate?.template_id || propSelectedTemplate?.id || 'beacon';
  
  // Initialize localCaseId and ref from props or formData
  useEffect(() => {
    const possibleId = propCaseId || formData?.id || formData?.case_id;
    
    if (possibleId && possibleId !== 'new' && possibleId !== localCaseId) {
      setLocalCaseId(possibleId);
      caseIdRef.current = possibleId;
      setHasCreatedCase(true); // If we have an ID, we've created/loaded a case
      console.log('Set localCaseId from available data:', possibleId);
    }
  }, [propCaseId, formData?.id, formData?.case_id]);
  
  // Helper functions
  const getCaseTitle = () => {
    const firstName = formData.first_name || '';
    const lastName = formData.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const caseType = (formData.case_type || formData.crime_type || '').toLowerCase();
    
    if (!fullName) return 'Memorial Site';
    
    switch(caseType) {
      case 'missing':
      case 'missing person':
      case 'missing_person':
        return `Help Find ${fullName}`;
      case 'homicide':
      case 'murder':
        return `Justice for ${fullName}`;
      default:
        return formData.case_title || `Justice for ${fullName}`;
    }
  };
  
  const getDefaultDescription = () => {
    const firstName = formData.first_name || '[Name]';
    return formData.description || `Information about ${firstName}'s case.`;
  };
  
  const getHeroTagline = () => {
    const firstName = formData.first_name || '[Name]';
    const caseType = (formData.case_type || formData.crime_type || '').toLowerCase();
    
    switch(caseType) {
      case 'missing':
      case 'missing person':
        return `Help us bring ${firstName} home safely`;
      case 'homicide':
      case 'murder':
        return `Help us find justice for ${firstName}`;
      default:
        return `Help us find answers`;
    }
  };

  const getHeroTitle = () => {
    const caseType = (formData.case_type || formData.crime_type || '').toLowerCase();
    switch(caseType) {
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
  
  // Get the initial hero image path
  const getInitialHeroImage = () => {
    const selectedImage = HERO_IMAGE_OPTIONS[0];
    return selectedImage.path;
  };

  // Initialize customizations
  const getInitialCustomizations = () => {
    if (propCustomizations && Object.keys(propCustomizations).length > 0) {
      return propCustomizations;
    }
    
    const firstName = formData.first_name || '';
    const selectedImage = HERO_IMAGE_OPTIONS[0];
    
    return {
      global: {
        navbarTitle: getCaseTitle(),
        logoType: 'image',
        logoId: 'dove',
        logoSrc: '/src/templates/logos/dove.png',
        logoIcon: null,
        logoUrl: null,
        primaryColor: '#3B82F6',
        fontFamily: 'Inter, sans-serif'
      },
      hero: {
        heroImageId: selectedImage.id,
        heroImage: selectedImage.path,
        heroImageType: 'gallery',
        heroTagline: getHeroTagline(),
        heroTitle: getHeroTitle(),
        showInvestigationStatus: true,
        investigationStatus: 'ACTIVE INVESTIGATION',
        showReward: formData.reward_offered === true && formData.reward_amount > 0
      },
      about: {
        aboutTitle: firstName ? `About ${firstName}` : 'About',
        aboutContent: getDefaultDescription(),
      },
      spotlight: {
        enabled: true,
        title: 'Latest Updates'
      },
      familyMessage: {
        enabled: false,
        title: 'A Message from the Family',
        message: ''
      },
      sidebar: {
        showShareWidget: true,
        showMediaGallery: true,
        mediaItems: []
      }
    };
  };

  const [customizations, setCustomizations] = useState(getInitialCustomizations);

  // Initialize selected hero image from customizations
  useEffect(() => {
    if (customizations?.hero?.heroImageId) {
      setSelectedHeroImage(customizations.hero.heroImageId);
    }
  }, []);

  // Send data to iframe with complete logo data
  useEffect(() => {
    if (!iframeRef.current || !isReady) return;
    
    const sendMessage = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const completeFormData = {
          ...formData,
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          case_type: formData.case_type || formData.crime_type || 'missing',
          full_name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
          case_title: getCaseTitle(),
          reward_offered: formData.reward_offered || false,
          reward_amount: formData.reward_amount || 0,
          description: formData.description || getDefaultDescription()
        };
        
        // Ensure complete logo data is sent
        const customizationsWithCompleteData = {
          ...customizations,
          global: {
            ...customizations.global,
            // Always include all logo fields
            logoType: customizations.global.logoType || 'image',
            logoId: customizations.global.logoId || 'dove',
            logoSrc: customizations.global.logoSrc || '/src/templates/logos/dove.png',
            logoIcon: customizations.global.logoIcon || null,
            logoUrl: customizations.global.logoUrl || null
          }
        };
        
        const message = {
          type: messageSent ? 'UPDATE_CUSTOMIZATIONS' : 'INIT_CUSTOMIZATIONS',
          customizations: customizationsWithCompleteData,
          caseData: completeFormData
        };
        
        console.log('Sending message to iframe with logo data:', customizationsWithCompleteData.global);
        
        try {
          iframeRef.current.contentWindow.postMessage(message, '*');
          if (!messageSent) {
            setMessageSent(true);
          }
        } catch (error) {
          console.error('Error sending message to iframe:', error);
        }
      }
    };

    sendMessage();
    messageIntervalRef.current = setInterval(sendMessage, 500);
    
    const timeout = setTimeout(() => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    }, 3000);
    
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      clearTimeout(timeout);
    };
  }, [customizations, formData, currentPage, messageSent, isReady]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }
      
      if (event.data.type === 'PREVIEW_READY') {
        setIsReady(true);
        setIsLoading(false);
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Handle customization changes with proper logo data
  const handleCustomizationChange = (path, value) => {
    if (propOnCustomizationChange) {
      propOnCustomizationChange(path, value);
    }
    
    const keys = path.split('.');
    setCustomizations(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      let current = newState;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Log logo changes for debugging
      if (path.startsWith('global.logo')) {
        console.log('Logo customization changed:', path, value);
        console.log('New logo state:', newState.global);
      }
      
      return newState;
    });
  };

  // Handle hero image selection from gallery
  const handleHeroImageSelect = (imageOption) => {
    setSelectedHeroImage(imageOption.id);
    handleCustomizationChange('hero.heroImageId', imageOption.id);
    handleCustomizationChange('hero.heroImage', imageOption.path);
    handleCustomizationChange('hero.heroImageType', 'gallery');
  };

  // Handle hero image upload
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Image must be less than 10MB');
      return;
    }
    
    try {
      const effectiveCaseId = caseIdRef.current || localCaseId;
      
      if (effectiveCaseId && effectiveCaseId !== 'new') {
        const uploadedUrl = await caseAPI.uploadCasePhoto(effectiveCaseId, file, 'Hero image');
        handleCustomizationChange('hero.heroImage', uploadedUrl);
        handleCustomizationChange('hero.heroImageType', 'upload');
        handleCustomizationChange('hero.heroImageId', null);
        
        // Add to uploaded images list
        setUploadedImages(prev => [...prev, {
          id: Date.now(),
          url: uploadedUrl,
          name: file.name
        }]);
      } else {
        // For new cases, convert to base64 and store temporarily
        const reader = new FileReader();
        reader.onload = (event) => {
          handleCustomizationChange('hero.heroImage', event.target.result);
          handleCustomizationChange('hero.heroImageType', 'upload');
          handleCustomizationChange('hero.heroImageId', null);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveError('Failed to upload image');
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleCustomizationChange('global.logoUrl', event.target.result);
        handleCustomizationChange('global.logoType', 'upload');
        handleCustomizationChange('global.logoId', null);
        handleCustomizationChange('global.logoSrc', null);
        handleCustomizationChange('global.logoIcon', null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fixed handleSave to prevent duplicate case creation
  const handleSave = async () => {
    // Prevent duplicate saves
    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return { success: false, message: 'Save in progress' };
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const templateObject = {
        id: templateName,
        template_id: templateName,
        version: '1.0.0'
      };
      
      // Use ref to get the most current case ID
      const effectiveCaseId = caseIdRef.current || localCaseId || formData.id || formData.case_id || null;
      
      console.log('Starting save operation...');
      console.log('Effective Case ID:', effectiveCaseId);
      console.log('Has created case?:', hasCreatedCase);
      
      let response;
      
      // Only create a new case if we haven't created one yet and don't have an ID
      if (effectiveCaseId && effectiveCaseId !== 'new') {
        console.log('Updating existing case:', effectiveCaseId);
        response = await caseAPI.updateCase(effectiveCaseId, formData, templateObject, customizations);
      } else if (!hasCreatedCase) {
        console.log('Creating new case - first save');
        response = await caseAPI.createCase(formData, templateObject, customizations);
        
        // Update all tracking mechanisms
        if (response?.id) {
          const newCaseId = response.id;
          setLocalCaseId(newCaseId);
          caseIdRef.current = newCaseId;
          setHasCreatedCase(true);
          
          // Update formData if it's mutable
          if (propCaseData) {
            propCaseData.id = newCaseId;
            propCaseData.case_id = newCaseId;
          }
          
          console.log('New case created with ID:', newCaseId);
          setLastSaved(new Date().toLocaleTimeString());
          
          return { success: true, caseId: newCaseId };
        }
      } else {
        // We've already created a case but somehow don't have the ID
        console.log('Case already created, skipping save');
        return { success: true, caseId: effectiveCaseId };
      }
      
      setLastSaved(new Date().toLocaleTimeString());
      return { success: true, caseId: effectiveCaseId || response?.id };
      
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSaveError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  const handleBack = () => {
    if (onViewChange) {
      onViewChange('template');
    }
  };

  const handleContinue = async () => {
    // Prevent continuing while saving
    if (isSaving) {
      console.log('Save in progress, waiting...');
      return;
    }
    
    const saveResult = await handleSave();
    
    // Update case ID if we got one from the save
    if (saveResult.success && saveResult.caseId) {
      if (!caseIdRef.current || caseIdRef.current === 'new') {
        caseIdRef.current = saveResult.caseId;
        setLocalCaseId(saveResult.caseId);
      }
      
      if (onViewChange) {
        onViewChange('preview');
      }
    } else if (!saveResult.success) {
      console.error('Save failed, not continuing:', saveResult.message);
    }
  };

  const iframeUrl = `/preview/${caseIdRef.current || localCaseId || 'new'}/${currentPage}?template=${templateName}&edit=true`;

  const safeGet = (obj, path, defaultValue = '') => {
    try {
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        current = current?.[key];
        if (current === undefined) return defaultValue;
      }
      return current;
    } catch (e) {
      return defaultValue;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Customization Controls */}
      <div className="w-96 bg-white shadow-lg flex flex-col border-r">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Customize Template
              </h2>
              <p className="text-sm text-gray-600">
                Personalizing for: <strong className="text-gray-900">
                  {formData.first_name || '[First Name]'} {formData.last_name || '[Last Name]'}
                </strong>
              </p>
            </div>
            
            <div className="text-right">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {lastSaved && (
                <p className="text-xs text-gray-500 mt-1">
                  Last saved: {lastSaved}
                </p>
              )}
              {saveError && (
                <p className="text-xs text-red-600 mt-1">
                  {saveError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          {['global', 'hero', 'content'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Global Settings Tab */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Navigation Bar Title
                </label>
                <input
                  type="text"
                  value={safeGet(customizations, 'global.navbarTitle', '')}
                  onChange={(e) => handleCustomizationChange('global.navbarTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter title..."
                />
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Logo Selection
                </label>
                
                <div className="space-y-3">
                  {/* Custom Logo Images Grid */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Select a logo:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {LOGO_OPTIONS.map((logo) => (
                        <button
                          key={logo.id}
                          onClick={() => {
                            if (logo.type === 'image') {
                              handleCustomizationChange('global.logoType', 'image');
                              handleCustomizationChange('global.logoId', logo.id);
                              handleCustomizationChange('global.logoSrc', logo.src);
                              handleCustomizationChange('global.logoIcon', null);
                              handleCustomizationChange('global.logoUrl', null);
                            } else {
                              handleCustomizationChange('global.logoType', 'emoji');
                              handleCustomizationChange('global.logoId', logo.id);
                              handleCustomizationChange('global.logoIcon', logo.icon);
                              handleCustomizationChange('global.logoSrc', null);
                              handleCustomizationChange('global.logoUrl', null);
                            }
                          }}
                          className={`p-3 border-2 rounded-lg transition-all flex items-center justify-center ${
                            customizations?.global?.logoId === logo.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          title={logo.name}
                        >
                          {logo.type === 'image' ? (
                            <img 
                              src={logo.src} 
                              alt={logo.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{logo.icon}</span>
                          )}
                          {logo.type === 'image' && (
                            <span className="text-xs hidden">{logo.name}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="upload"
                        checked={customizations?.global?.logoType === 'upload'}
                        onChange={() => handleCustomizationChange('global.logoType', 'upload')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Upload custom logo</span>
                    </label>
                    
                    {customizations?.global?.logoType === 'upload' && (
                      <div className="ml-6 mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {customizations?.global?.logoUrl && (
                          <img 
                            src={customizations.global.logoUrl} 
                            alt="Logo preview" 
                            className="mt-3 h-16 object-contain border rounded p-2"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="none"
                      checked={customizations?.global?.logoType === 'none'}
                      onChange={() => {
                        handleCustomizationChange('global.logoType', 'none');
                        handleCustomizationChange('global.logoId', null);
                        handleCustomizationChange('global.logoSrc', null);
                        handleCustomizationChange('global.logoIcon', null);
                        handleCustomizationChange('global.logoUrl', null);
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm">No logo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              {/* Hero Image Gallery */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hero Background Image
                </label>
                
                {/* Image Gallery Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {HERO_IMAGE_OPTIONS.map((imageOption) => (
                    <button
                      key={imageOption.id}
                      onClick={() => handleHeroImageSelect(imageOption)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedHeroImage === imageOption.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={imageOption.path}
                        alt={imageOption.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If local image fails, use fallback
                          e.target.src = imageOption.fallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-white text-xs font-medium">
                        {imageOption.name}
                      </span>
                      {selectedHeroImage === imageOption.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Upload Custom Image */}
                <div className="border-t pt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Custom Image
                  </button>
                  {customizations?.hero?.heroImageType === 'upload' && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Using custom uploaded image
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Tagline
                </label>
                <textarea
                  value={safeGet(customizations, 'hero.heroTagline', '')}
                  onChange={(e) => handleCustomizationChange('hero.heroTagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter tagline..."
                />
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safeGet(customizations, 'hero.showInvestigationStatus', true)}
                    onChange={(e) => handleCustomizationChange('hero.showInvestigationStatus', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Investigation Status</span>
                </label>
                
                {safeGet(customizations, 'hero.showInvestigationStatus', true) && (
                  <select
                    value={safeGet(customizations, 'hero.investigationStatus', 'ACTIVE INVESTIGATION')}
                    onChange={(e) => handleCustomizationChange('hero.investigationStatus', e.target.value)}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ACTIVE INVESTIGATION">Active Investigation</option>
                    <option value="CASE SOLVED">Case Solved</option>
                    <option value="SEEKING INFORMATION">Seeking Information</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">About Section</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={safeGet(customizations, 'about.aboutTitle', '')}
                    onChange={(e) => handleCustomizationChange('about.aboutTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Section title"
                  />
                  <textarea
                    value={safeGet(customizations, 'about.aboutContent', '')}
                    onChange={(e) => handleCustomizationChange('about.aboutContent', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="About content..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-white">
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              <ChevronLeft className="inline w-4 h-4 mr-1" />
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Continue'}
              <Eye className="inline w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">Preview Page:</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value="home">Home</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
                <option value="spotlight">Spotlight</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 bg-gray-100">
          <div className="h-full bg-white rounded-lg shadow-xl overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading preview...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Template Preview"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationView;