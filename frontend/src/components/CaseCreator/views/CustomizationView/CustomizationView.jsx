// @/components/CaseCreator/views/CustomizationView/CustomizationView.jsx
// Fixed version with proper state management and save functionality

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Eye, Edit3, Loader2, X, Upload, Image as ImageIcon, Check, AlertCircle, Bold, Italic, Heading1, Heading2, List, Link2 } from 'lucide-react';
import { updateCase, uploadImage } from '@/components/CaseCreator/services/caseAPI';
import api from '@/api/axios';
import DeployButton from '@/components/DeployButton';
// Try to import RichTextEditorModal - if it exists, use it; otherwise use built-in
let RichTextEditorModal = null;
try {
  RichTextEditorModal = require('@/common/RichTextEditorModal').default;
} catch (e) {
  
}

// Built-in Rich Text Editor Component
const BuiltInTextEditor = ({ isOpen, onClose, onSave, currentValue, label, sectionId }) => {
  const [content, setContent] = useState('');
  const [isRawHTML, setIsRawHTML] = useState(false);
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      setContent(currentValue || '');
    }
  }, [isOpen, currentValue]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    onSave(content, sectionId);
    onClose();
  };
  
  // Helper function to wrap selected text with HTML tags
  const wrapSelection = (tag, className = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText) {
      const openTag = className ? `<${tag} class="${className}">` : `<${tag}>`;
      const closeTag = `</${tag}>`;
      const wrappedText = openTag + selectedText + closeTag;
      
      const newContent = content.substring(0, start) + wrappedText + content.substring(end);
      setContent(newContent);
      
      // Restore cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
      }, 0);
    }
  };
  
  // Insert text at cursor position
  const insertAtCursor = (text) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Edit {label}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-3 border-b bg-white flex-wrap">
          <button
            type="button"
            onClick={() => wrapSelection('h1', 'text-5xl md:text-6xl font-bold')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Heading 1 (Large)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('h2', 'text-4xl md:text-5xl font-bold')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('p', 'text-lg')}
            className="px-3 py-1 text-sm hover:bg-gray-100 rounded transition-colors"
            title="Paragraph"
          >
            P
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => wrapSelection('strong')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('em')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => insertAtCursor('<br />')}
            className="px-3 py-1 text-sm hover:bg-gray-100 rounded transition-colors"
            title="Line Break"
          >
            BR
          </button>
          <button
            type="button"
            onClick={() => {
              const listHTML = '<ul class="list-disc pl-5">\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>';
              insertAtCursor(listHTML);
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => setIsRawHTML(!isRawHTML)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isRawHTML ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            title="Toggle HTML View"
          >
            {"</>"}
          </button>
        </div>
        
        {/* Editor and Preview */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Editor */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                {isRawHTML ? 'HTML Code' : 'Content Editor'}
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isRawHTML ? "Enter HTML code..." : "Enter your text or select text and use the toolbar to format..."}
                style={{ minHeight: '300px' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                {isRawHTML 
                  ? "Edit HTML directly. Use tags like <h1>, <p>, <strong>, etc."
                  : "Select text and click toolbar buttons to format, or toggle HTML view for direct editing."}
              </p>
            </div>
            
            {/* Live Preview */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Live Preview
              </label>
              <div className="flex-1 border border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto">
                {content ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: content }}
                    className="prose prose-lg max-w-none"
                  />
                ) : (
                  <p className="text-gray-400 italic">Preview will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            💡 Tip: Select text and use toolbar buttons to apply formatting
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Text Editor Wrapper - uses TipTap if available, otherwise built-in
const TextEditorWrapper = ({ isOpen, onClose, onSave, currentValue, label, sectionId }) => {
  // If TipTap RichTextEditorModal is available, use it
  if (RichTextEditorModal) {
    const handleSave = (content) => {
      onSave(content, sectionId);
    };
    
    return (
      <RichTextEditorModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        title={`Edit ${label}`}
        content={currentValue}
        placeholder="Start typing..."
        fieldName={label}
      />
    );
  }
  
  // Otherwise use the built-in editor
  return (
    <BuiltInTextEditor
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      currentValue={currentValue}
      label={label}
      sectionId={sectionId}
    />
  );
};

// Image Selector Component with URL-based storage
const SimpleImageSelector = ({ isOpen, onClose, onSave, currentValue, label, sectionId, casePhotos = [] }) => {
  const [selectedImage, setSelectedImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  
  const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='%23e5e7eb'%3E%3Cpath d='M200 100c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60zm0 180c-66.3 0-120 26.8-120 60v20h240v-20c0-33.2-53.7-60-120-60z'/%3E%3C/svg%3E";
  
  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentValue || '');
      setUploadError(null);
    }
  }, [isOpen, currentValue]);
  
  if (!isOpen) return null;
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Upload to Cloudinary and get URL
      const imageUrl = await uploadImage(file);
      setSelectedImage(imageUrl);
    } catch (error) {
      
      setUploadError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSave = () => {
    // Validate that we have a valid image URL or data
    if (!selectedImage) {
      setUploadError('Please select an image');
      return;
    }
    onSave(selectedImage, sectionId);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select {label}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Upload New Image Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Upload New Image</h4>
            <label className="block">
              <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-600">Uploading to Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload (max 10MB)</span>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </label>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </p>
            )}
          </div>
          
          {/* Existing Photos Section */}
          {casePhotos.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Your Uploaded Photos</h4>
              <div className="grid grid-cols-4 gap-3">
                {casePhotos.map((photo, i) => {
                  const url = photo.image_url || photo.image || photo;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className={`border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImage === url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Photo ${i + 1}`} 
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER;
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Placeholder Option */}
          <div>
            <h4 className="text-sm font-medium mb-3">Use Placeholder</h4>
            <button
              onClick={() => setSelectedImage(PLACEHOLDER)}
              className={`border-2 rounded-lg p-4 transition-all ${
                selectedImage === PLACEHOLDER ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img src={PLACEHOLDER} alt="Placeholder" className="w-24 h-24" />
            </button>
          </div>
          
          {/* Preview Section */}
          {selectedImage && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="w-full max-w-md h-64 object-cover rounded-lg mx-auto"
                  onError={(e) => {
                    e.target.src = PLACEHOLDER;
                    setUploadError('Failed to load image preview');
                  }}
                />
                {selectedImage.startsWith('https://res.cloudinary.com') && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Image uploaded to Cloudinary
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!selectedImage || isUploading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedImage && !isUploading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Use This Image
          </button>
        </div>
      </div>
    </div>
  );
};

// Navbar Customizer Component
const NavbarCustomizer = ({ isOpen, onClose, customizations, onCustomizationChange, caseData }) => {
  const [activeTab, setActiveTab] = useState('title');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  
  if (!isOpen) return null;
  
  const logoOptions = [
    { id: 'dove', url: '/logos/dove.png', name: 'Dove' },
    { id: 'flame', url: '/logos/flame.png', name: 'Flame' },
    { id: 'lantern', url: '/logos/lantern.png', name: 'Lantern' },
    { id: 'phoenix', url: '/logos/phoenix.png', name: 'Phoenix' },
  ];
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      onCustomizationChange('navbar_logo', url);
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Customize Navbar</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('title')}
              className={`px-4 py-2 rounded ${activeTab === 'title' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Title
            </button>
            <button
              onClick={() => setActiveTab('logo')}
              className={`px-4 py-2 rounded ${activeTab === 'logo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Logo
            </button>
          </div>
          
          {/* Title Tab */}
          {activeTab === 'title' && (
            <div>
              <label className="block text-sm font-medium mb-2">Navbar Title</label>
              <input
                type="text"
                value={customizations.navbar_title || `Justice for ${caseData.first_name}`}
                onChange={(e) => onCustomizationChange('navbar_title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter navbar title..."
              />
            </div>
          )}
          
          {/* Logo Tab */}
          {activeTab === 'logo' && (
            <div>
              <label className="block text-sm font-medium mb-3">Choose Logo</label>
              
              {/* Predefined Logos */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {logoOptions.map(logo => (
                  <button
                    key={logo.id}
                    onClick={() => onCustomizationChange('navbar_logo', logo.url)}
                    className={`p-3 border-2 rounded-lg ${
                      customizations.navbar_logo === logo.url ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={logo.url} alt={logo.name} className="w-8 h-8 mx-auto" />
                    <span className="text-xs mt-1 block">{logo.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Upload Custom */}
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400">
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm">Upload Custom Logo</span>
                    </>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoUpload} 
                  />
                </div>
              </label>
              
              {/* Current Logo Preview */}
              {customizations.navbar_logo && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 mb-2">Current Logo:</p>
                  <img src={customizations.navbar_logo} alt="Current" className="h-10" />
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Main CustomizationView Component
const CustomizationView = ({ 
  caseData: initialCaseData, 
  selectedTemplate,
  onNext,
  onPrevious,
  caseId
}) => {
  const navigate = useNavigate();
  
  // State
  const [caseData] = useState(initialCaseData || {});
  const [isEditMode, setIsEditMode] = useState(true);
  const [customizations, setCustomizations] = useState(
    initialCaseData?.template_data?.customizations || {}
  );
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [TemplateComponent, setTemplateComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [navbarCustomizerOpen, setNavbarCustomizerOpen] = useState(false);
  const [previousPage, setPreviousPage] = useState('home');
  
  // Editor modals
  const [textEditor, setTextEditor] = useState({ 
    isOpen: false, 
    sectionId: '', 
    label: '', 
    value: '' 
  });
  
  const [imageSelector, setImageSelector] = useState({ 
    isOpen: false, 
    sectionId: '', 
    label: '', 
    value: '' 
  });

  // Handler for navbar edit
  const handleNavbarEdit = useCallback(() => {
    setNavbarCustomizerOpen(true);
  }, []);

  // Add handler for page navigation with auto-save
  const handlePageNavigate = useCallback(async (page) => {
    
    
    // Save before changing pages if there are unsaved changes
    if (unsavedChanges && currentPage !== page) {
      await handleSave();
    }
    
    setPreviousPage(currentPage);
    setCurrentPage(page);
  }, [currentPage, unsavedChanges]);

  // Load initial customizations from database
  useEffect(() => {
    const loadCaseData = async () => {
      if (caseId) {
        try {
          const response = await api.get(`/cases/${caseId}/`);
          console.log('=== LOADING CASE DATA ===');
          console.log('Template data:', response.data?.template_data);
          
          if (response.data?.template_data?.customizations) {
            const loadedCustomizations = response.data.template_data.customizations;
            console.log('Setting customizations from DB:', Object.keys(loadedCustomizations).length, 'fields');
            setCustomizations(loadedCustomizations);
          }
        } catch (error) {
          console.error('Failed to load case data:', error);
        }
      }
    };
    loadCaseData();
  }, [caseId]);

  // Load template with all pages
  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        
        const [Layout, HomePage, AboutPage, SpotlightPage, ContactPage] = await Promise.all([
          import('@/templates/beacon/src/pages/Layout').then(m => m.default),
          import('@/templates/beacon/src/pages/Home').then(m => m.default),
          import('@/templates/beacon/src/pages/About').then(m => m.default),
          import('@/templates/beacon/src/pages/Spotlight').then(m => m.default),
          import('@/templates/beacon/src/pages/Contact').then(m => m.default)
        ]);
        
        // Create wrapped component that switches between pages
        const WrappedComponent = (props) => {
          let PageComponent;
          switch(currentPage) {
            case 'about':
              PageComponent = AboutPage;
              break;
            case 'spotlight':
              PageComponent = SpotlightPage;
              break;
            case 'contact':
              PageComponent = ContactPage;
              break;
            default:
              PageComponent = HomePage;
          }
          
          return (
            <Layout 
              {...props} 
              currentPageName={currentPage} 
              onNavbarEdit={props.onNavbarEdit}
              onPageNavigate={props.onPageNavigate}
            >
              <PageComponent {...props} />
            </Layout>
          );
        };
        
        setTemplateComponent(() => WrappedComponent);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load template:', error);
        setLoading(false);
      }
    };
    loadComponent();
  }, [currentPage]);

  // Handle customization changes with better logging
  const handleCustomizationChange = useCallback((path, value) => {
    console.log(`Customization change - Path: ${path}, Type: ${typeof value}, Length: ${
      typeof value === 'string' ? value.length : 'N/A'
    }`);
    
    setCustomizations(prev => {
      const updated = {
        ...prev,
        [path]: value
      };
      
      // Log stats about current customizations
      const galleryCount = Object.keys(updated).filter(k => k.startsWith('gallery_image_')).length;
      const homeCount = Object.keys(updated).filter(k => k.startsWith('hero_')).length;
      const aboutCount = Object.keys(updated).filter(k => k.startsWith('about_')).length;
      
      console.log(`Total customizations: ${Object.keys(updated).length} (Gallery: ${galleryCount}, Home: ${homeCount}, About: ${aboutCount})`);
      
      return updated;
    });
    
    setUnsavedChanges(true);
  }, []);

  // Handle edit section
  const handleEditSection = useCallback((sectionData) => {
    console.log('Edit section clicked:', sectionData);
    
    const currentContent = customizations[sectionData.sectionId] || sectionData.currentValue || '';
    
    if (sectionData.sectionType === 'image' || sectionData.sectionType === 'gallery') {
      setImageSelector({
        isOpen: true,
        sectionId: sectionData.sectionId,
        label: sectionData.label,
        value: currentContent
      });
    } else {
      setTextEditor({
        isOpen: true,
        sectionId: sectionData.sectionId,
        label: sectionData.label,
        value: currentContent
      });
    }
  }, [customizations]);

  // Save handlers
  const handleTextSave = useCallback((value, sectionId) => {
    console.log('Saving text for section:', sectionId);
    handleCustomizationChange(sectionId, value);
    setTextEditor({ isOpen: false, sectionId: '', label: '', value: '' });
  }, [handleCustomizationChange]);

  const handleImageSave = useCallback((value, sectionId) => {
    console.log('Saving image for section:', sectionId, 'URL:', value);
    handleCustomizationChange(sectionId, value);
    setImageSelector({ isOpen: false, sectionId: '', label: '', value: '' });
  }, [handleCustomizationChange]);

  // Handle save to database - IMPROVED VERSION
  const handleSave = useCallback(async () => {
    console.log('=== SAVING ALL CUSTOMIZATIONS ===');
    console.log('Total customization keys:', Object.keys(customizations).length);
    
    // Clean up null/undefined values before saving
    const cleanedCustomizations = Object.entries(customizations).reduce((acc, [key, value]) => {
      // Only include non-null, non-undefined, non-empty values
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    console.log('Cleaned customizations:', Object.keys(cleanedCustomizations).length, 'fields');
    
    // Log breakdown by section
    const galleryCount = Object.keys(cleanedCustomizations).filter(k => k.startsWith('gallery_image_')).length;
    const homeCount = Object.keys(cleanedCustomizations).filter(k => k.startsWith('hero_') || k.startsWith('quick_facts_') || k.startsWith('cta_')).length;
    const aboutCount = Object.keys(cleanedCustomizations).filter(k => k.startsWith('about_')).length;
    
    console.log(`Saving - Gallery: ${galleryCount}, Home: ${homeCount}, About: ${aboutCount}`);
    
    setSaving(true);
    setSaveError(null);
    
    try {
      if (caseId) {
        const payload = {
          customizations: cleanedCustomizations
        };
        
        console.log('Sending payload to server...');
        const response = await api.post(`/cases/${caseId}/save_customizations/`, payload);
        
        console.log('Save response:', response.data);
        
        if (response.data.success) {
          // Update local state with cleaned customizations
          setCustomizations(cleanedCustomizations);
          
          setSaveStatus('success');
          setUnsavedChanges(false);
          
          // Verify save
          console.log('Save successful! Stats:', response.data.stats || {});
          
          setTimeout(() => setSaveStatus(null), 3000);
        }
      } else {
        console.log('No caseId yet, customizations will be saved on case creation');
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error saving customizations:', error);
      console.error('Error details:', error.response?.data);
      setSaveStatus('error');
      setSaveError(error.response?.data?.error || error.message || 'Failed to save customizations');
      
      setTimeout(() => {
        setSaveStatus(null);
        setSaveError(null);
      }, 5000);
    } finally {
      setSaving(false);
    }
  }, [customizations, caseId]);

  // Handle continue
  const handleContinue = useCallback(async () => {
    // Save before continuing if there are unsaved changes
    if (unsavedChanges) {
      await handleSave();
    }
    
    if (onNext) {
      onNext({ customizations, caseData });
    } else {
      navigate('/dashboard');
    }
  }, [customizations, caseData, onNext, navigate, unsavedChanges, handleSave]);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p>Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                isEditMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                !isEditMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>

          <div className="flex items-center gap-3">
            {unsavedChanges && !saving && (
              <span className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
            {saving && (
              <span className="text-sm text-blue-600 flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {saveError || 'Save failed'}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!unsavedChanges || saving}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                unsavedChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Template */}
      <div className="relative">
        {TemplateComponent ? (
          <TemplateComponent
            caseData={caseData}
            customizations={customizations}
            isEditing={isEditMode}
            onCustomizationChange={handleCustomizationChange}
            onEditSection={handleEditSection}
            onNavbarEdit={handleNavbarEdit}
            onPageNavigate={handlePageNavigate}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">Failed to load template.</p>
          </div>
        )}
      </div>

      {/* Text Editor Modal */}
      <TextEditorWrapper
        isOpen={textEditor.isOpen}
        onClose={() => setTextEditor({ ...textEditor, isOpen: false })}
        onSave={handleTextSave}
        currentValue={textEditor.value}
        label={textEditor.label}
        sectionId={textEditor.sectionId}
      />

      {/* Image Selector Modal */}
      <SimpleImageSelector
        isOpen={imageSelector.isOpen}
        onClose={() => setImageSelector({ ...imageSelector, isOpen: false })}
        onSave={handleImageSave}
        currentValue={imageSelector.value}
        label={imageSelector.label}
        sectionId={imageSelector.sectionId}
        casePhotos={caseData?.photos || []}
      />

      {/* Navbar Customizer Modal */}
      <NavbarCustomizer
        isOpen={navbarCustomizerOpen}
        onClose={() => setNavbarCustomizerOpen(false)}
        customizations={customizations}
        onCustomizationChange={handleCustomizationChange}
        caseData={caseData}
      />

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-40 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Edit Mode Active</span>
          </div>
          <p className="text-xs opacity-90">
            Click + buttons to edit text and images
          </p>
        </div>
      )}
      {caseId && (
        <DeployButton 
          caseId={caseId} 
          caseData={caseData}
        />
      )}

    </div>
  );
};

export default CustomizationView;