import React, { useState } from "react";
import { Heart, Image, Edit3 } from "lucide-react";
import FileUploader from "@/components/FileUploader";

// --- Hero Edit Modal ---
const HeroEditModal = ({ isOpen, onClose, heroData, onSave, caseId }) => {
  const [formData, setFormData] = useState(heroData);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageUpload = async (file, preview) => {
    if (!file || !caseId) return;
    
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      
      const response = await fetch(`/api/cases/${caseId}/upload-photo/`, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        handleChange('profileImageUrl', data.photo_url);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => e.stopPropagation()} // Prevent drag interference
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Edit Hero Section</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <FileUploader
                value={formData.profileImageUrl ? { preview: formData.profileImageUrl } : null}
                onChange={handleImageUpload}
                maxSizeMB={5}
                accept="image/png,image/jpeg,image/jpg,image/gif"
                label={uploading ? "Uploading..." : "Upload Profile Image"}
              />
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Person's full name"
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            {/* Subtitle Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Beloved daughter, sister, and friend"
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            {/* Dates Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dates
              </label>
              <input
                type="text"
                value={formData.dates}
                onChange={(e) => handleChange('dates', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., March 15, 1995 - Missing since October 12, 2023"
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="A loving description of the person, their impact, and current situation..."
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              disabled={uploading}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Hero Widget ---
export default function HeroWidget({ 
  isEditing = false, 
  onEdit, 
  onDelete,
  profileImage = null, // Pass your uploaded image here
  backgroundImage = null, // Pass your background image here
  caseId = null, // Pass the case ID for image uploads
  onWidgetUpdate = null // Callback to update widget data in parent
}) {
  const [hero, setHero] = useState({
    name: "Sarah Elizabeth Johnson",
    subtitle: "Beloved daughter, sister, and friend",
    dates: "March 15, 1995 - Missing since October 12, 2023",
    description: "Sarah was a bright light in everyone's life. A talented artist and compassionate soul who brought joy to all who knew her. We continue to search for answers and hold hope in our hearts.",
    profileImageUrl: null
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveEdit = (newData) => {
    setHero(newData);
    // Also update the parent component if callback provided
    if (onWidgetUpdate) {
      onWidgetUpdate(newData);
    }
  };

  // Use passed image, hero image URL, or fallback to default
  const heroProfileImage = hero.profileImageUrl || profileImage;
  const heroBackgroundImage = backgroundImage || heroProfileImage || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&crop=center";

  return (
    <>
      <div 
        className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden rounded-lg relative" 
        style={{ minHeight: '200px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image */}
        {heroBackgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${heroBackgroundImage})` }}
          />
        )}

        {/* Edit Button Overlay */}
        {isHovered && (
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 z-30 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-90 hover:opacity-100"
            title="Edit Hero Content"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}

        {/* Subtle Decorative Elements - scale with container */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[8%] left-[8%] w-[15%] h-[15%] bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-[12%] right-[8%] w-[20%] h-[20%] bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse delay-1000"></div>
        </div>

        {/* Main Hero Content - responsive to container size */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-[3%]">
          <div className="w-full max-w-2xl text-center flex flex-col justify-center h-full">
            {/* Profile Image - scales with container */}
            <div 
              className="mx-auto mb-[4%] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-lg relative"
              style={{ 
                width: 'clamp(60px, 8vw, 120px)', 
                height: 'clamp(60px, 8vw, 120px)' 
              }}
            >
              {heroProfileImage ? (
                <img
                  src={heroProfileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart 
                  className="text-gray-400" 
                  style={{ 
                    width: 'clamp(24px, 3vw, 48px)', 
                    height: 'clamp(24px, 3vw, 48px)' 
                  }} 
                />
              )}
            </div>

            {/* Name - responsive text size */}
            <div
              className="font-bold text-gray-800 mb-[2%] leading-tight"
              style={{ fontSize: 'clamp(18px, 3vw, 48px)' }}
            >
              {hero.name}
            </div>

            {/* Subtitle - responsive text size */}
            <div
              className="text-gray-600 mb-[1.5%]"
              style={{ fontSize: 'clamp(14px, 2vw, 24px)' }}
            >
              {hero.subtitle}
            </div>

            {/* Dates - responsive text size */}
            <div
              className="text-gray-500 mb-[4%]"
              style={{ fontSize: 'clamp(12px, 1.5vw, 18px)' }}
            >
              {hero.dates}
            </div>

            {/* Description - responsive text size */}
            <div
              className="text-gray-600 leading-relaxed mx-auto mb-[5%]"
              style={{ 
                fontSize: 'clamp(14px, 2vw, 20px)',
                maxWidth: '90%'
              }}
            >
              {hero.description}
            </div>

            {/* Call to Action Buttons - responsive sizing */}
            <div className="flex flex-col sm:flex-row gap-[2%] justify-center items-center">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                style={{ 
                  fontSize: 'clamp(12px, 1.5vw, 16px)',
                  padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)'
                }}
              >
                Share This Story
              </button>
              <button 
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-800 rounded-full font-semibold transition-all duration-300"
                style={{ 
                  fontSize: 'clamp(12px, 1.5vw, 16px)',
                  padding: 'clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)'
                }}
              >
                Contact Family
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <HeroEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        heroData={hero}
        onSave={handleSaveEdit}
        caseId={caseId}
      />
    </>
  );
}