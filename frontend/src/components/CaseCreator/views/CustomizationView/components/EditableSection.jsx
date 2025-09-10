// @/components/CaseCreator/views/CustomizationView/components/EditableSection.jsx

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Image, Type, Palette, Settings } from 'lucide-react';

/**
 * Wrapper component that makes any template section editable
 * Shows a plus button that's always visible in edit mode
 */
const EditableSection = ({
  children,
  sectionId,
  sectionType = 'content', // 'content', 'image', 'gallery', 'color', 'settings'
  label,
  isEditing = false,
  onEdit,
  customizations = {},
  className = '',
  showPlusButton = true,
  position = 'top-right' // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef(null);
  const buttonRef = useRef(null);

  // Determine icon based on section type
  const getIcon = () => {
    switch (sectionType) {
      case 'image':
      case 'gallery':
        return Image;
      case 'text':
      case 'content':
        return Type;
      case 'color':
        return Palette;
      case 'settings':
        return Settings;
      default:
        return Edit2;
    }
  };

  const Icon = getIcon();

  // Position styles for the plus button
  const getButtonPosition = () => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'top-right':
        return 'top-2 right-2';
      case 'bottom-left':
        return 'bottom-2 left-2';
      case 'bottom-right':
        return 'bottom-2 right-2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-2 right-2';
    }
  };

  // Handle edit button click
  const handleEditClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onEdit) {
      // Get the position of the section for overlay positioning
      const rect = sectionRef.current?.getBoundingClientRect();
      onEdit({
        sectionId,
        sectionType,
        label,
        position: {
          x: rect?.left || 0,
          y: rect?.top || 0,
          width: rect?.width || 0,
          height: rect?.height || 0
        },
        currentValue: customizations[sectionId]
      });
    }
  };

  // Handle mouse enter/leave for hover effect
  const handleMouseEnter = () => {
    if (isEditing) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={sectionRef}
      className={`editable-section relative group ${className} ${
        isEditing ? 'editable-mode' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-section-id={sectionId}
      data-section-type={sectionType}
    >
      {/* Main content */}
      {children}
      
      {/* Hover outline in edit mode */}
      {isEditing && isHovered && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-400 rounded-lg opacity-50 z-10" />
      )}
      
      {/* Edit button - ALWAYS VISIBLE in edit mode */}
      {isEditing && showPlusButton && (
        <button
          ref={buttonRef}
          data-edit-button
          onClick={handleEditClick}
          className={`absolute ${getButtonPosition()} z-20 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 ${
            isHovered ? 'scale-110 bg-blue-600' : 'scale-100'
          }`}
          title={`Edit ${label || sectionType}`}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
      
      {/* Section label on hover */}
      {isEditing && isHovered && label && (
        <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded z-20">
          {label}
        </div>
      )}
    </div>
  );
};

/**
 * Image editable section with special handling
 */
export const EditableImage = ({
  src,
  alt,
  sectionId,
  label = 'Image',
  isEditing = false,
  onEdit,
  customizations = {},
  className = '',
  fallbackSrc = '/placeholder-image.jpg'
}) => {
  const [imageSrc, setImageSrc] = useState(src || customizations[sectionId] || fallbackSrc);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Update image when customizations change
    if (customizations[sectionId]) {
      setImageSrc(customizations[sectionId]);
      setImageError(false);
    }
  }, [customizations, sectionId]);

  const handleImageError = () => {
    setImageError(true);
    setImageSrc(fallbackSrc);
  };

  return (
    <EditableSection
      sectionId={sectionId}
      sectionType="image"
      label={label}
      isEditing={isEditing}
      onEdit={onEdit}
      customizations={customizations}
      className={className}
      position="center"
    >
      <img
        src={imageSrc}
        alt={alt}
        onError={handleImageError}
        className={`${className} ${imageError ? 'opacity-50' : ''}`}
      />
      {isEditing && imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <span className="text-gray-600 text-sm">Click + to upload image</span>
        </div>
      )}
    </EditableSection>
  );
};

/**
 * Gallery editable section
 */
export const EditableGallery = ({
  images = [],
  sectionId,
  label = 'Photo Gallery',
  isEditing = false,
  onEdit,
  customizations = {},
  className = '',
  columns = 3
}) => {
  const galleryImages = customizations[sectionId] || images;

  return (
    <EditableSection
      sectionId={sectionId}
      sectionType="gallery"
      label={label}
      isEditing={isEditing}
      onEdit={onEdit}
      customizations={customizations}
      className={className}
    >
      <div className={`grid grid-cols-${columns} gap-4`}>
        {galleryImages.length > 0 ? (
          galleryImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Gallery ${index + 1}`}
              className="w-full h-32 object-cover rounded"
            />
          ))
        ) : (
          isEditing && (
            <div className="col-span-full h-32 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-gray-500">Click + to add gallery images</span>
            </div>
          )
        )}
      </div>
    </EditableSection>
  );
};

/**
 * Text/Content editable section
 */
export const EditableText = ({
  children,
  sectionId,
  label = 'Text',
  isEditing = false,
  onEdit,
  customizations = {},
  className = '',
  defaultContent = ''
}) => {
  const content = customizations[sectionId] || children || defaultContent;

  return (
    <EditableSection
      sectionId={sectionId}
      sectionType="content"
      label={label}
      isEditing={isEditing}
      onEdit={onEdit}
      customizations={customizations}
      className={className}
    >
      {typeof content === 'string' ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        content
      )}
    </EditableSection>
  );
};

export default EditableSection;