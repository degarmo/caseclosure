// @/components/CaseCreator/views/CustomizationView/components/OverlayEditor.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Move, 
  Settings,
  Type,
  Image,
  Palette,
  Layout,
  Save,
  Eye,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Upload,
  Grid,
  Camera,
  FileText,
  Link,
  MapPin,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';

// TipTap imports
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { saveCustomizations } from '@/components/CaseCreator/services/caseAPI';

// Editor sections configuration
const EDITOR_SECTIONS = {
  content: {
    id: 'content',
    label: 'Content',
    icon: FileText,
    subsections: [
      { id: 'hero', label: 'Hero Section', icon: Type },
      { id: 'about', label: 'About Section', icon: Users },
      { id: 'timeline', label: 'Timeline', icon: Calendar },
      { id: 'updates', label: 'Updates', icon: AlertCircle }
    ]
  },
  media: {
    id: 'media',
    label: 'Media',
    icon: Image,
    subsections: [
      { id: 'hero_image', label: 'Hero Image', icon: Camera },
      { id: 'logo', label: 'Logo', icon: Image },
      { id: 'gallery', label: 'Photo Gallery', icon: Grid },
      { id: 'documents', label: 'Documents', icon: FileText }
    ]
  },
  design: {
    id: 'design',
    label: 'Design',
    icon: Palette,
    subsections: [
      { id: 'colors', label: 'Colors', icon: Palette },
      { id: 'fonts', label: 'Typography', icon: Type },
      { id: 'layout', label: 'Layout', icon: Layout },
      { id: 'spacing', label: 'Spacing', icon: Settings }
    ]
  },
  pages: {
    id: 'pages',
    label: 'Pages',
    icon: Layout,
    subsections: [
      { id: 'home', label: 'Home Page', icon: MapPin },
      { id: 'about_page', label: 'About Page', icon: Users },
      { id: 'contact', label: 'Contact Page', icon: Link },
      { id: 'spotlight', label: 'Spotlight', icon: AlertCircle }
    ]
  }
};

const OverlayEditor = ({ 
  caseId,
  caseData, 
  customizations,
  onCustomizationChange,
  onSave,
  onPreview,
  isVisible = true,
  position: initialPosition = { x: 20, y: 80 }
}) => {
  // State management
  const [activeSection, setActiveSection] = useState('content');
  const [activeSubsection, setActiveSubsection] = useState('hero');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['content']);
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  
  const editorRef = useRef(null);
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Initialize TipTap editor for rich text editing
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink,
      TiptapImage,
      Color,
      TextStyle,
      Highlight
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleContentUpdate(html);
    }
  });

  // Handle drag functionality
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [position]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (editorRef.current?.offsetWidth || 450);
    const maxY = window.innerHeight - (editorRef.current?.offsetHeight || 600);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  // Handle content updates from TipTap
  const handleContentUpdate = useCallback((content) => {
    const path = `${activeSection}.${activeSubsection}.content`;
    onCustomizationChange(path, content);
  }, [activeSection, activeSubsection, onCustomizationChange]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
      // Simulate upload - replace with actual API call
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        
        if (type === 'gallery') {
          setGalleryImages(prev => [...prev, imageUrl]);
          onCustomizationChange('media.gallery.images', [...galleryImages, imageUrl]);
        } else {
          setSelectedImage(imageUrl);
          onCustomizationChange(`media.${type}.url`, imageUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [galleryImages, onCustomizationChange]);

  // Save handler
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(customizations);
      } else if (caseId) {
        await saveCustomizations(caseId, customizations);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [caseId, customizations, onSave]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Render content editor based on active subsection
  const renderContentEditor = () => {
    const section = EDITOR_SECTIONS[activeSection];
    const subsection = section?.subsections?.find(s => s.id === activeSubsection);
    
    if (!subsection) return null;

    switch (activeSection) {
      case 'content':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <subsection.icon className="w-4 h-4" />
              {subsection.label}
            </h4>
            
            {/* TipTap Rich Text Editor */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-2 border-b border-gray-200 flex gap-1 flex-wrap">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                >
                  <em>I</em>
                </button>
                <div className="w-px bg-gray-300 mx-1" />
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className="p-2 rounded hover:bg-gray-200"
                >
                  ⬅
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className="p-2 rounded hover:bg-gray-200"
                >
                  ⬌
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className="p-2 rounded hover:bg-gray-200"
                >
                  ➡
                </button>
              </div>
              <EditorContent 
                editor={editor} 
                className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
              />
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <subsection.icon className="w-4 h-4" />
              {subsection.label}
            </h4>
            
            {subsection.id === 'gallery' ? (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="" className="w-full h-24 object-cover rounded" />
                      <button
                        onClick={() => {
                          const filtered = galleryImages.filter((_, i) => i !== idx);
                          setGalleryImages(filtered);
                          onCustomizationChange('media.gallery.images', filtered);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files).forEach(file => {
                          handleImageUpload(file, 'gallery');
                        });
                      }}
                    />
                  </div>
                </label>
              </div>
            ) : (
              <div>
                {selectedImage && (
                  <img src={selectedImage} alt="" className="w-full h-32 object-cover rounded mb-4" />
                )}
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload {subsection.label.toLowerCase()}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files[0], subsection.id)}
                    />
                  </div>
                </label>
              </div>
            )}
          </div>
        );

      case 'design':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <subsection.icon className="w-4 h-4" />
              {subsection.label}
            </h4>
            
            {subsection.id === 'colors' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customizations?.design?.colors?.primary || '#3B82F6'}
                      onChange={(e) => onCustomizationChange('design.colors.primary', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customizations?.design?.colors?.primary || '#3B82F6'}
                      onChange={(e) => onCustomizationChange('design.colors.primary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customizations?.design?.colors?.secondary || '#10B981'}
                      onChange={(e) => onCustomizationChange('design.colors.secondary', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customizations?.design?.colors?.secondary || '#10B981'}
                      onChange={(e) => onCustomizationChange('design.colors.secondary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {subsection.id === 'fonts' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heading Font
                  </label>
                  <select
                    value={customizations?.design?.fonts?.heading || 'Inter'}
                    onChange={(e) => onCustomizationChange('design.fonts.heading', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Font
                  </label>
                  <select
                    value={customizations?.design?.fonts?.body || 'Inter'}
                    onChange={(e) => onCustomizationChange('design.fonts.body', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Lato">Lato</option>
                    <option value="Merriweather">Merriweather</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        );

      case 'pages':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <subsection.icon className="w-4 h-4" />
              {subsection.label}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enable Page</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizations?.pages?.[subsection.id]?.enabled !== false}
                    onChange={(e) => onCustomizationChange(`pages.${subsection.id}.enabled`, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={customizations?.pages?.[subsection.id]?.title || ''}
                  onChange={(e) => onCustomizationChange(`pages.${subsection.id}.title`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={`Enter ${subsection.label.toLowerCase()} title`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={customizations?.pages?.[subsection.id]?.metaDescription || ''}
                  onChange={(e) => onCustomizationChange(`pages.${subsection.id}.metaDescription`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Page description for search engines"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={editorRef}
      className={`fixed bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isDragging ? 'cursor-move' : ''
      } ${isMinimized ? 'h-12' : 'h-[600px]'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '450px',
        zIndex: 9999
      }}
    >
      {/* Header */}
      <div
        ref={dragRef}
        onMouseDown={handleDragStart}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-xl cursor-move flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4" />
          <span className="font-medium">Template Editor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onPreview && onPreview()}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex h-[calc(100%-48px)]">
          {/* Sidebar Navigation */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-3 overflow-y-auto">
            {Object.entries(EDITOR_SECTIONS).map(([key, section]) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.includes(key);
              
              return (
                <div key={key} className="mb-2">
                  <button
                    onClick={() => {
                      setActiveSection(key);
                      toggleSection(key);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </div>
                    {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-3 mt-1 space-y-1">
                      {section.subsections.map(subsection => (
                        <button
                          key={subsection.id}
                          onClick={() => {
                            setActiveSection(key);
                            setActiveSubsection(subsection.id);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                            activeSection === key && activeSubsection === subsection.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {subsection.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {renderContentEditor()}
          </div>
        </div>
      )}
      
      {/* Floating Plus Buttons Guide */}
      {!isMinimized && (
        <div className="absolute bottom-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Click the plus icons on your template to edit specific sections</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayEditor;