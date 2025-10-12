import React from "react";
import { Heart, Share2 } from "lucide-react";
import { EditableImage } from '@/components/CaseCreator/views/CustomizationView/components/EditableSection';

export default function HeroSection({ 
  caseData = {}, 
  customizations = {}, 
  isEditing = false, 
  onEditSection,
  onCustomizationChange,
  primaryPhotoUrl,
  displayName,
  lastUpdate
}) {
  
  // Get hero image with proper fallback
  const getHeroImage = () => {
    console.log('🖼️ HERO IMAGE DEBUG:', {
      'customizations?.hero_image': customizations?.hero_image,
      'primaryPhotoUrl': primaryPhotoUrl
    });
    
    // PRIORITY 1: Check customizations first (where uploads are saved)
    if (customizations?.hero_image) {
      console.log('✅ Using customizations.hero_image');
      return customizations.hero_image;
    }
    
    // PRIORITY 2: Check primaryPhotoUrl prop
    if (primaryPhotoUrl && primaryPhotoUrl !== 'null' && primaryPhotoUrl !== null) {
      console.log('✅ Using primaryPhotoUrl');
      return primaryPhotoUrl;
    }
    
    // PRIORITY 3: Check caseData.primary_photo
    if (caseData.primary_photo) {
      console.log('✅ Using caseData.primary_photo');
      return caseData.primary_photo;
    }
    
    // PRIORITY 4: Check caseData.photos array
    if (caseData.photos && caseData.photos.length > 0) {
      console.log('✅ Using caseData.photos[0]');
      return caseData.photos[0].image_url;
    }
    
    // FALLBACK: Gray gradient
    console.log('⚠️ Using fallback gradient');
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2364748b;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e293b;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23grad)'/%3E%3C/svg%3E";
  };

  // Get first name for display
  const getFirstName = () => {
    return caseData.first_name || displayName.split(' ')[0] || 'them';
  };

  // Determine the title prefix based on case type (STATIC - NO CUSTOMIZATION)
  const getTitlePrefix = () => {
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    if (caseType === 'homicide' || caseType === 'murder') {
      return 'Justice For';
    } else if (caseType === 'missing') {
      return 'Help Find';
    } else if (caseType === 'unidentified') {
      return 'Help Identify';
    } else if (caseType === 'cold_case') {
      return 'Seeking Answers for';
    }
    return 'Help Find';
  };

  // Get the display name with optional nickname for title (STATIC)
  const getTitleName = () => {
    const firstName = getFirstName();
    const nickname = caseData.nickname;
    
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    // For homicide cases, show nickname if available
    if ((caseType === 'homicide' || caseType === 'murder') && nickname) {
      return `${firstName} "${nickname}"`;
    }
    
    return firstName;
  };

  // Get subtitle based on case type (STATIC - NO CUSTOMIZATION)
  const getSubtitle = () => {
    const firstName = getFirstName();
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    if (caseType === 'homicide' || caseType === 'murder') {
      return `Help us bring justice and closure to ${firstName}'s family`;
    } else if (caseType === 'missing') {
      return `Help us find ${firstName} and bring closure to our family`;
    } else if (caseType === 'unidentified') {
      return `Help us identify this person and bring closure to their family`;
    } else if (caseType === 'cold_case') {
      return `Help us find answers and bring justice to ${firstName}'s family`;
    }
    
    return `Help us find ${firstName} and bring closure to our family`;
  };

  // Get investigation status (STATIC - NO CUSTOMIZATION)
  const getInvestigationStatus = () => {
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    if (caseData.deployment_status === 'deployed' && !caseData.is_public) {
      return 'CASE CLOSED';
    } else if (caseType === 'cold_case') {
      return 'COLD CASE';
    } else if (caseType === 'missing') {
      return 'MISSING PERSON';
    } else if (caseType === 'homicide' || caseType === 'murder') {
      return 'HOMICIDE INVESTIGATION';
    }
    return 'ACTIVE INVESTIGATION';
  };

  // Format case number
  const formatCaseNumber = () => {
    if (caseData.case_number) {
      return `Case #: ${caseData.case_number}`;
    }
    return `Case #: ${new Date().getFullYear()}-${String(caseData.id || '000000').padStart(6, '0')}`;
  };

  // Get followers count
  const getFollowersCount = () => {
    if (caseData.followers_count) {
      return caseData.followers_count.toLocaleString();
    }
    const baseFollowers = 100;
    const daysOld = caseData.created_at ? 
      Math.floor((new Date() - new Date(caseData.created_at)) / (1000 * 60 * 60 * 24)) : 
      30;
    return (baseFollowers + (daysOld * 3)).toLocaleString();
  };

  // Format reward amount
  const formatReward = () => {
    if (caseData.reward_amount) {
      const amount = parseFloat(caseData.reward_amount);
      if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)},000`;
      }
      return `$${amount.toFixed(0)}`;
    }
    return null;
  };

  const showReward = formatReward();
  const showStatus = true;

  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <EditableImage
          sectionId="hero_image"
          label="Hero Image"
          isEditing={isEditing}
          onEdit={onEditSection}
          customizations={customizations}
          defaultImage={getHeroImage()}
        >
          <div className="absolute inset-0 group">
            <img 
              src={getHeroImage()} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          </div>
        </EditableImage>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="block">{getTitlePrefix()}</span>
                <span className="block text-yellow-400">{getTitleName()}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
                {getSubtitle()}
              </p>
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 font-semibold rounded-lg hover:shadow-xl transition-all duration-300">
                  <Heart className="w-5 h-5" />
                  Share a Tip
                </button>
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
                  <Share2 className="w-5 h-5" />
                  Share Story
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Status Banner */}
      {showStatus && (
        <div className="bg-slate-800 text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-yellow-400">
                    {getInvestigationStatus()}
                  </span>
                </div>
                <div className="text-slate-300">
                  {formatCaseNumber()} | Last Updated: {lastUpdate}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {showReward && (
                  <span className="bg-slate-700 px-3 py-1 rounded-full">
                    {formatReward()} Reward Offered
                  </span>
                )}
                <span className="text-slate-300">
                  {getFollowersCount()} people following this case
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}