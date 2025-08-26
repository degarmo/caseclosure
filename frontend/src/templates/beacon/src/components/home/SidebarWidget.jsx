import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { 
  Share2, 
  Camera, 
  ExternalLink,
  Plus,
  X,
  Facebook,
  Twitter,
  Instagram,
  Link
} from "lucide-react";

export default function SidebarWidget({ caseData, customizations, isEditing, onCustomizationChange }) {
  // Widget visibility toggles
  const showShareWidget = customizations?.sidebar?.showShareWidget !== false;
  const showMediaGallery = customizations?.sidebar?.showMediaGallery !== false;
  const mediaItems = customizations?.sidebar?.mediaItems || [];
  
  // Handle media upload
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    const newItems = [...mediaItems];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newItems.push({
          id: Date.now() + Math.random(),
          url: event.target.result,
          title: file.name
        });
        onCustomizationChange('sidebar.mediaItems', newItems);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (id) => {
    const filtered = mediaItems.filter(item => item.id !== id);
    onCustomizationChange('sidebar.mediaItems', filtered);
  };

  // Social share handlers
  const handleShare = (platform) => {
    if (isEditing) return;
    
    const url = window.location.href;
    const text = `Help us find justice for ${caseData?.first_name} ${caseData?.last_name}`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'instagram':
        // Instagram doesn't have direct share URL, copy link instead
        navigator.clipboard.writeText(url);
        alert('Link copied! Share on Instagram');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
    }
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Widget Controls in Edit Mode */}
      {isEditing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">
              Sidebar Widgets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showShareWidget}
                onChange={(e) => onCustomizationChange('sidebar.showShareWidget', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Show "Spread the Word" widget</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMediaGallery}
                onChange={(e) => onCustomizationChange('sidebar.showMediaGallery', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Media Gallery widget</span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Share Widget */}
      {showShareWidget && (
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Share2 className="w-5 h-5 text-blue-500" />
              Spread the Word
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Help us reach more people who might have information about {caseData?.first_name}'s case.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 flex items-center gap-1"
                onClick={() => handleShare('facebook')}
                disabled={isEditing}
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 flex items-center gap-1"
                onClick={() => handleShare('twitter')}
                disabled={isEditing}
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 flex items-center gap-1"
                onClick={() => handleShare('instagram')}
                disabled={isEditing}
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 flex items-center gap-1"
                onClick={() => handleShare('copy')}
                disabled={isEditing}
              >
                <Link className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Gallery Widget */}
      {showMediaGallery && (
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Camera className="w-5 h-5 text-green-500" />
              Media Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="mb-3">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => e.currentTarget.previousElementSibling.click()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </label>
              </div>
            )}
            
            {mediaItems.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {mediaItems.slice(0, 4).map((item, index) => (
                    <div
                      key={item.id || index}
                      className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveMedia(item.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                      {index === 3 && mediaItems.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-medium">+{mediaItems.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {!isEditing && (
                  <Button variant="outline" size="sm" className="w-full">
                    View All Photos
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Camera className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">
                  {isEditing ? 'Upload photos to display in the gallery' : 'No photos available'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Show placeholder if all widgets are hidden */}
      {!showShareWidget && !showMediaGallery && !isEditing && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No widgets enabled</p>
        </div>
      )}
    </div>
  );
}