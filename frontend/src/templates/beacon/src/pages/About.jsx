// @/templates/beacon/src/pages/About.jsx
import React from "react";
import { Heart, GraduationCap, Users, MapPin, Calendar, User, Phone, Mail, Camera, Plus, X } from "lucide-react";
import EditableSection, { EditableImage, EditableText } from '@/components/CaseCreator/views/CustomizationView/components/EditableSection';

// Gallery Manager Component
const GalleryManager = ({ customizations, onCustomizationChange, isEditing, onEditSection }) => {
  // Get current gallery images from customizations
  const getGalleryImages = () => {
    const images = [];
    let index = 0;
    
    // Check for existing gallery images in customizations
    while (customizations[`gallery_image_${index}`]) {
      images.push({
        id: `gallery_image_${index}`,
        url: customizations[`gallery_image_${index}`],
        caption: customizations[`gallery_caption_${index}`] || ''
      });
      index++;
    }
    
    return images;
  };

  const galleryImages = getGalleryImages();
  const totalImages = galleryImages.length;

  // Add new image slot
  const handleAddImage = () => {
    const newIndex = totalImages;
    // Trigger the image selector for the new slot
    onEditSection({
      sectionId: `gallery_image_${newIndex}`,
      sectionType: 'image',
      label: `Gallery Image ${newIndex + 1}`,
      currentValue: ''
    });
  };

  // Remove image
  const handleRemoveImage = (indexToRemove) => {
    console.log(`Removing gallery image at index ${indexToRemove}`);
    
    // Build new customizations object with shifted images
    const updatedCustomizations = {};
    
    // Copy all non-gallery customizations
    Object.keys(customizations).forEach(key => {
      if (!key.startsWith('gallery_image_') && !key.startsWith('gallery_caption_')) {
        updatedCustomizations[key] = customizations[key];
      }
    });
    
    // Rebuild gallery with shifted indices
    let newIndex = 0;
    for (let i = 0; i < totalImages; i++) {
      if (i !== indexToRemove) {
        // Copy this image to the new index
        updatedCustomizations[`gallery_image_${newIndex}`] = customizations[`gallery_image_${i}`];
        updatedCustomizations[`gallery_caption_${newIndex}`] = customizations[`gallery_caption_${i}`] || '';
        newIndex++;
      }
    }
    
    // Clear the parent's customizations and set new ones
    if (onCustomizationChange) {
      // First, explicitly remove the old last item keys
      const lastIndex = totalImages - 1;
      onCustomizationChange(`gallery_image_${lastIndex}`, undefined);
      onCustomizationChange(`gallery_caption_${lastIndex}`, undefined);
      
      // Then update all the shifted items
      for (let i = 0; i < newIndex; i++) {
        onCustomizationChange(`gallery_image_${i}`, updatedCustomizations[`gallery_image_${i}`]);
        onCustomizationChange(`gallery_caption_${i}`, updatedCustomizations[`gallery_caption_${i}`] || '');
      }
    }
    
    console.log(`Gallery updated: ${newIndex} images remaining`);
  };

  // Update caption
  const handleCaptionChange = (index, value) => {
    onCustomizationChange(`gallery_caption_${index}`, value);
  };

  if (!isEditing && galleryImages.length === 0) {
    return null; // Don't show gallery section if no images and not editing
  }

  return (
    <div className="mb-12">
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-8 py-6 border-b border-gray-100">
          <EditableText
            sectionId="gallery_title"
            label="Gallery Title"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent="Photo Gallery"
          >
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Camera className="w-6 h-6 text-green-500" />
              {customizations.gallery_title || 'Photo Gallery'}
            </h3>
          </EditableText>
          
          <EditableText
            sectionId="gallery_subtitle"
            label="Gallery Subtitle"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`Memories of our loved one`}
          >
            <p className="text-slate-600 mt-2">
              {customizations.gallery_subtitle || `Memories of our loved one`}
            </p>
          </EditableText>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div key={`gallery-item-${index}-${image.url}`} className="relative group">
                <EditableImage
                  src={image.url}
                  alt={image.caption || `Gallery image ${index + 1}`}
                  sectionId={image.id}
                  label={`Gallery Image ${index + 1}`}
                  isEditing={isEditing}
                  onEdit={onEditSection}
                  customizations={customizations}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
                />
                
                {/* Remove button when editing */}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-30"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Caption editor */}
                {isEditing && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customizations[`gallery_caption_${index}`] || ''}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {/* Display caption in preview */}
                {!isEditing && image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg p-3">
                    <p className="text-white text-xs font-medium">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add more photos button in edit mode */}
            {isEditing && (
              <button
                onClick={handleAddImage}
                className="w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Add Photo</p>
                </div>
              </button>
            )}
          </div>
          
          {/* Image count and status */}
          <div className="mt-6 text-center">
            {!isEditing && galleryImages.length > 0 && (
              <p className="text-sm text-gray-500">
                {galleryImages.length} {galleryImages.length === 1 ? 'photo' : 'photos'} in gallery
              </p>
            )}
            {isEditing && galleryImages.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                Click "Add Photo" to start building your gallery
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function About({ 
  caseData = {}, 
  customizations = {}, 
  isEditing = false, 
  onEditSection,
  onCustomizationChange 
}) {
  // Get display name
  const getDisplayName = () => {
    if (caseData.display_name) return caseData.display_name;
    const parts = [];
    if (caseData.first_name) parts.push(caseData.first_name);
    if (caseData.middle_name) parts.push(caseData.middle_name);
    if (caseData.last_name) parts.push(caseData.last_name);
    return parts.join(' ') || 'Unknown';
  };

  // Get primary photo - check customizations first
  const getPrimaryPhotoUrl = () => {
    console.log('📸 About Main Image Debug:', {
      'customizations.about_main_image': customizations.about_main_image,
      'all customizations keys': Object.keys(customizations)
    });
    
    // Check customizations first for about_main_image
    if (customizations.about_main_image) {
      console.log('✅ Using customizations.about_main_image');
      return customizations.about_main_image;
    }
    
    // Then check case data
    if (caseData.primary_photo_url) return caseData.primary_photo_url;
    if (caseData.victim_photo_url) return caseData.victim_photo_url;
    if (caseData.photos && caseData.photos.length > 0) {
      const primaryPhoto = caseData.photos.find(p => p.is_primary);
      return primaryPhoto ? primaryPhoto.image_url : caseData.photos[0].image_url;
    }
    
    console.log('⚠️ Using fallback image');
    return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=600&fit=crop";
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  // Calculate age
  const calculateAge = () => {
    if (caseData.age) return caseData.age;
    if (caseData.date_of_birth) {
      try {
        const birthDate = new Date(caseData.date_of_birth);
        const endDate = caseData.date_of_death ? new Date(caseData.date_of_death) : new Date();
        const age = Math.floor((endDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        return age > 0 && age < 150 ? age : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Get life dates string
  const getLifeDates = () => {
    const birthDate = formatDate(caseData.date_of_birth);
    const deathDate = formatDate(caseData.date_of_death);
    const missingDate = formatDate(caseData.date_missing);
    
    if (birthDate && deathDate) {
      return `${birthDate} - ${deathDate}`;
    } else if (birthDate && missingDate) {
      return `Born ${birthDate} • Missing since ${missingDate}`;
    } else if (birthDate) {
      return `Born ${birthDate}`;
    }
    return '';
  };

  // Helper to get content with fallback
  const getContent = (sectionId, defaultContent) => {
    return customizations[sectionId] || defaultContent;
  };

  const age = calculateAge();
  const displayName = getDisplayName();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <EditableText
          sectionId="about_title"
          label="About Page Title"
          isEditing={isEditing}
          onEdit={onEditSection}
          customizations={customizations}
          defaultContent={`<h1 class="text-4xl font-bold text-slate-800 mb-4">${caseData.first_name ? `${caseData.first_name}'s Story` : 'Our Story'}</h1>`}
        >
          {customizations.about_title ? (
            <div dangerouslySetInnerHTML={{ __html: customizations.about_title }} />
          ) : (
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              {caseData.first_name ? `${caseData.first_name}'s Story` : 'Our Story'}
            </h1>
          )}
        </EditableText>

        <EditableText
          sectionId="about_subtitle"
          label="About Page Subtitle"
          isEditing={isEditing}
          onEdit={onEditSection}
          customizations={customizations}
          defaultContent={caseData.case_type === 'missing' ? 
            'Help us find our loved one and bring them home' : 
            'Remembering a beautiful soul who touched so many lives'}
        >
          <p className="text-xl text-slate-600 leading-relaxed">
            {getContent('about_subtitle', 
              caseData.case_type === 'missing' ? 
              'Help us find our loved one and bring them home' : 
              'Remembering a beautiful soul who touched so many lives'
            )}
          </p>
        </EditableText>
      </div>

      {/* Main Photo and Bio */}
      <div className="bg-white rounded-xl shadow-lg mb-12">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <EditableImage
                src={getPrimaryPhotoUrl()}
                alt={displayName}
                sectionId="about_main_image"
                label="About Main Image"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg shadow-md"
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='20' font-family='Arial'%3ENo Photo%3C/text%3E%3C/svg%3E"
              />
            </div>
            <div className="lg:w-1/2 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{displayName}</h2>
                {getLifeDates() && (
                  <p className="text-slate-600 text-lg">{getLifeDates()}</p>
                )}
                {age && (
                  <p className="text-slate-600">Age: {age}</p>
                )}
              </div>
              
              <EditableText
                sectionId="about_biography"
                label="Biography"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                defaultContent={caseData.description || `${displayName} was a beloved member of our community who touched many lives with their kindness and spirit.`}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div className="text-slate-600">
                      {customizations.about_biography ? (
                        <div dangerouslySetInnerHTML={{ __html: customizations.about_biography }} />
                      ) : (
                        <p>{caseData.description || `${displayName} was a beloved member of our community.`}</p>
                      )}
                    </div>
                  </div>
                </div>
              </EditableText>

              {/* Physical description - from caseData */}
              {(caseData.height_feet || caseData.weight || caseData.hair_color || caseData.eye_color) && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="text-slate-600">
                    <p className="font-medium mb-1">Physical Description:</p>
                    <ul className="text-sm space-y-1">
                      {caseData.height_feet && (
                        <li>Height: {caseData.height_feet}'{caseData.height_inches || 0}"</li>
                      )}
                      {caseData.weight && <li>Weight: {caseData.weight} lbs</li>}
                      {caseData.hair_color && <li>Hair: {caseData.hair_color}</li>}
                      {caseData.eye_color && <li>Eyes: {caseData.eye_color}</li>}
                      {caseData.race && <li>Race: {caseData.race}</li>}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Distinguishing features */}
              {caseData.distinguishing_features && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div className="text-slate-600">
                    <p className="font-medium mb-1">Distinguishing Features:</p>
                    <p className="text-sm">{caseData.distinguishing_features}</p>
                  </div>
                </div>
              )}
              
              {/* Last seen information - for missing persons */}
              {caseData.case_type === 'missing' && (caseData.last_seen_location || caseData.last_seen_date) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div className="text-slate-600">
                    <p className="font-medium mb-1">Last Seen:</p>
                    {caseData.last_seen_date && (
                      <p className="text-sm">Date: {formatDate(caseData.last_seen_date)}</p>
                    )}
                    {caseData.last_seen_time && (
                      <p className="text-sm">Time: {caseData.last_seen_time}</p>
                    )}
                    {caseData.last_seen_location && (
                      <p className="text-sm">Location: {caseData.last_seen_location}</p>
                    )}
                    {caseData.last_seen_wearing && (
                      <p className="text-sm mt-1">Wearing: {caseData.last_seen_wearing}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOVED: Family Message Section - Now directly after Main Photo/Bio */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl shadow-lg mb-12 border border-yellow-200">
        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              A Message from {caseData.first_name ? `${caseData.first_name}'s` : 'Our'} Family
            </h3>
          </div>
          
          <EditableText
            sectionId="family_message"
            label="Family Message"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`We miss ${caseData.first_name || 'our loved one'} every day. Your support means everything to us as we seek justice and closure. If you have any information, please come forward.`}
          >
            <blockquote className="text-lg text-slate-600 italic leading-relaxed text-center">
              {customizations.family_message ? (
                <div dangerouslySetInnerHTML={{ __html: `"${customizations.family_message}"` }} />
              ) : (
                <p>"{`We miss ${caseData.first_name || 'our loved one'} every day. Your support means everything to us as we seek justice and closure. If you have any information, please come forward.`}"</p>
              )}
            </blockquote>
          </EditableText>
          
          <p className="text-center text-slate-500 mt-6">- The {caseData.last_name || 'Family'} Family</p>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <GalleryManager
        customizations={customizations}
        onCustomizationChange={onCustomizationChange}
        isEditing={isEditing}
        onEditSection={onEditSection}
      />

      {/* Memories Section */}
      {(isEditing || customizations.about_memories_title || customizations.about_memories_content) && (
        <>
          <EditableText
            sectionId="about_memories_title"
            label="Memories Section Title"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`Remembering ${caseData.first_name || 'Our Loved One'}`}
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              {getContent('about_memories_title', `Remembering ${caseData.first_name || 'Our Loved One'}`)}
            </h3>
          </EditableText>

          <EditableText
            sectionId="about_memories_content"
            label="Memories Content"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`Share your memories and help us celebrate the life of ${displayName}.`}
            className="mb-12"
          >
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
              <div className="text-center text-slate-600">
                {customizations.about_memories_content ? (
                  <div dangerouslySetInnerHTML={{ __html: customizations.about_memories_content }} />
                ) : (
                  <p className="text-lg">Share your memories and help us celebrate the life of {displayName}.</p>
                )}
              </div>
            </div>
          </EditableText>
        </>
      )}

      {/* Investigation Details */}
      {(caseData.investigating_agency || caseData.detective_name) && (
        <div className="bg-blue-50 rounded-xl shadow-lg mb-12 border border-blue-200">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Investigation Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {caseData.investigating_agency && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Investigating Agency</p>
                  <p className="text-lg font-medium text-slate-800">{caseData.investigating_agency}</p>
                </div>
              )}
              {caseData.case_number && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Case Number</p>
                  <p className="text-lg font-medium text-slate-800">{caseData.case_number}</p>
                </div>
              )}
              {caseData.detective_name && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Lead Detective</p>
                  <p className="text-lg font-medium text-slate-800">{caseData.detective_name}</p>
                </div>
              )}
              {caseData.detective_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-600">Tip Line</p>
                    <p className="text-lg font-medium text-slate-800">{caseData.detective_phone}</p>
                  </div>
                </div>
              )}
              {caseData.detective_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="text-lg font-medium text-slate-800">{caseData.detective_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl shadow-lg">
        <div className="p-8 text-center">
          <EditableText
            sectionId="about_cta_title"
            label="Call to Action Title"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent="Help Us Find Answers"
          >
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {getContent('about_cta_title', 'Help Us Find Answers')}
            </h3>
          </EditableText>

          <EditableText
            sectionId="about_cta_message"
            label="Call to Action Message"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`If you have any information about ${caseData.first_name || 'this case'}, no matter how small, please reach out. Your tip could be the key to bringing justice.`}
          >
            <p className="text-slate-700 mb-6">
              {getContent('about_cta_message', 
                caseData.reward_details || 
                `If you have any information about ${caseData.first_name || 'this case'}, no matter how small, please reach out. Your tip could be the key to bringing justice.`
              )}
            </p>
          </EditableText>

          {caseData.reward_amount && parseFloat(caseData.reward_amount) > 0 && (
            <p className="text-2xl font-bold text-slate-800 mb-6">
              ${parseFloat(caseData.reward_amount).toLocaleString()} Reward Offered
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200">
              Submit Anonymous Tip
            </button>
            <button className="border-2 border-slate-800 text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-800 hover:text-white transition-all duration-200">
              Share {caseData.first_name ? `${caseData.first_name}'s` : 'This'} Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}