import React from "react";
import { Button } from "../ui/button";
import { Heart, Share2 } from "lucide-react";

// Available hero images for selection
const HERO_IMAGES = [
  { 
    id: 'sunset', 
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    name: 'Sunset Mountains'
  },
  { 
    id: 'sky', 
    url: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?w=1200&h=800&fit=crop',
    name: 'Peaceful Sky'
  },
  { 
    id: 'forest', 
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
    name: 'Forest Path'
  },
  { 
    id: 'ocean', 
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop',
    name: 'Ocean Horizon'
  },
  { 
    id: 'field', 
    url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop',
    name: 'Open Field'
  }
];

export default function HeroSection({ caseData, customizations, isEditing, onCustomizationChange }) {
  // Get victim's name from form data - NOT STATIC
  const firstName = caseData?.first_name || '';
  const lastName = caseData?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  // Determine the hero title based on case type from FORM
  const getHeroTitle = () => {
    const caseType = caseData?.case_type || caseData?.crime_type || '';
    
    switch(caseType.toLowerCase()) {
      case 'missing':
        return 'Help Find';
      case 'homicide':
      case 'murder':
        return 'Justice for';
      case 'assault':
        return 'Justice for';
      default:
        return 'Help Find';
    }
  };
  
  // Get customization values with defaults
  const heroImage = customizations?.hero?.heroImage || HERO_IMAGES[0].url;
  const heroTagline = customizations?.hero?.heroTagline || `Help us find answers and bring justice to our family`;
  const showInvestigationStatus = customizations?.hero?.showInvestigationStatus !== false;
  const investigationStatus = customizations?.hero?.investigationStatus || 'ACTIVE INVESTIGATION';
  
  // Only show reward if it's offered in the FORM AND amount exists and is > 0
  const showReward = caseData?.reward_offered === true && 
                     caseData?.reward_amount && 
                     caseData.reward_amount > 0 && 
                     customizations?.hero?.showReward !== false;
  
  // Format last update date
  const getLastUpdate = () => {
    if (caseData?.spotlight_posts && caseData.spotlight_posts.length > 0) {
      const lastPost = caseData.spotlight_posts[0];
      return new Date(lastPost.published_at).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle navigation to contact page
  const handleTipClick = () => {
    if (!isEditing) {
      const caseId = window.location.pathname.split('/')[2] || 'new';
      const template = new URLSearchParams(window.location.search).get('template') || 'beacon';
      window.location.href = `/preview/${caseId}/contact?template=${template}`;
    }
  };

  // Handle scroll to about section
  const handleStoryClick = () => {
    if (!isEditing) {
      document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Hero Image Selection (Edit Mode Only) */}
      {isEditing && (
        <div className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image</label>
          <div className="flex gap-2">
            {HERO_IMAGES.map((img) => (
              <button
                key={img.id}
                onClick={() => onCustomizationChange('hero.heroImage', img.url)}
                className={`relative w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                  heroImage === img.url ? 'border-blue-500 shadow-md' : 'border-gray-300 hover:border-gray-400'
                }`}
                title={img.name}
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero Image */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={`Memorial for ${fullName}`}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {getHeroTitle()}
                <span className="block text-yellow-400">{firstName}</span>
              </h1>
              
              {isEditing ? (
                <textarea
                  value={heroTagline}
                  onChange={(e) => onCustomizationChange('hero.heroTagline', e.target.value)}
                  className="w-full text-xl md:text-2xl bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 rounded-lg px-4 py-2 mb-8"
                  placeholder="Enter a tagline..."
                  rows={2}
                />
              ) : (
                <p className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
                  {heroTagline}
                </p>
              )}
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gold-gradient text-slate-800 hover:shadow-xl transition-all duration-300 font-semibold px-8"
                  onClick={handleTipClick}
                  disabled={isEditing}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Submit a Tip
                </Button>
                <Button 
                  size="lg" 
                  className="gold-gradient text-slate-800 hover:shadow-xl transition-all duration-300 font-semibold px-8"
                  onClick={handleStoryClick}
                  disabled={isEditing}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Their Story
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Status Banner */}
      <div className="bg-slate-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Investigation Status Toggle */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showInvestigationStatus}
                    onChange={(e) => onCustomizationChange('hero.showInvestigationStatus', e.target.checked)}
                    id="showStatus"
                    className="w-4 h-4"
                  />
                  <label htmlFor="showStatus" className="text-sm">Show Status</label>
                  {showInvestigationStatus && (
                    <select
                      value={investigationStatus}
                      onChange={(e) => onCustomizationChange('hero.investigationStatus', e.target.value)}
                      className="ml-2 px-2 py-1 bg-slate-700 rounded text-sm"
                    >
                      <option value="ACTIVE INVESTIGATION">ACTIVE INVESTIGATION</option>
                      <option value="CASE SOLVED">CASE SOLVED</option>
                      <option value="SEEKING INFORMATION">SEEKING INFORMATION</option>
                    </select>
                  )}
                </div>
              ) : showInvestigationStatus && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-yellow-400">{investigationStatus}</span>
                </div>
              )}
              
              <div className="text-slate-300">
                {caseData?.case_number && (
                  <>Case #: {caseData.case_number} | </>
                )}
                Last Updated: {getLastUpdate()}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              {/* Reward Display - ONLY if offered in form */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showReward}
                    onChange={(e) => onCustomizationChange('hero.showReward', e.target.checked)}
                    id="showReward"
                    className="w-4 h-4"
                  />
                  <label htmlFor="showReward" className="text-sm">
                    Show Reward 
                    {caseData?.reward_offered && caseData?.reward_amount && caseData.reward_amount > 0 && 
                      ` ($${caseData.reward_amount.toLocaleString()})`
                    }
                  </label>
                </div>
              ) : (
                showReward && (
                  <span className="bg-slate-700 px-3 py-1 rounded-full">
                    ${caseData.reward_amount.toLocaleString()} Reward Offered
                  </span>
                )
              )}
              
              {/* Visitor Count */}
              <span className="text-slate-300">
                {caseData?.visitor_count || 0} people following this case
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}