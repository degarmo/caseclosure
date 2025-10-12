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
    
    // FALLBACK: Gray silhouette placeholder
    console.log('⚠️ Using fallback image');
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='260' viewBox='0 0 120 260'%3E%3Crect width='120' height='260' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2364748b' font-size='14' font-family='Arial'%3ENo Photo%3C/text%3E%3C/svg%3E";
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
      {/* Hero Section with gradient background */}
      <div className="relative min-h-[600px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT SIDE - Text Content */}
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                <span className="block mb-2">{getTitlePrefix()}</span>
                <span className="block text-yellow-400">{getTitleName()}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-200 leading-relaxed">
                {getSubtitle()}
              </p>
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 font-semibold rounded-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Heart className="w-5 h-5" />
                  Share a Tip
                </button>
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
                  <Share2 className="w-5 h-5" />
                  Share Story
                </button>
              </div>
            </div>

            {/* RIGHT SIDE - Portrait Photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <EditableImage
                  sectionId="hero_image"
                  label="Hero Portrait Photo"
                  isEditing={isEditing}
                  onEdit={onEditSection}
                  customizations={customizations}
                  defaultImage={getHeroImage()}
                >
                  {/* Photo container - SIZE IS CONTROLLED HERE */}
                  <div className="w-[180px] h-[300px] rounded-[40px] overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl bg-white p-3">
                    <img 
                      src={getHeroImage()} 
                      alt={displayName}
                      className="w-full h-full object-cover rounded-[32px]"
                    />
                  </div>
                </EditableImage>
              </div>
            </div>
                
                {/* Decorative frame effect */}
                <div className="absolute inset-0 rounded-[40px] border-4 border-white/20 pointer-events-none"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Case Status Banner */}
      {showStatus && (
        <div className="bg-slate-800 text-white py-6 border-t border-slate-700">
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