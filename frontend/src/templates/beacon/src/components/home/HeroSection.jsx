import React, { useState } from "react";
import { Heart, Share2, MessageSquare, Plus } from "lucide-react";

export default function HeroSection({ 
  caseData = {}, 
  customizations = {}, 
  isEditing = false, 
  onCustomizationChange,
  primaryPhotoUrl,
  displayName,
  lastUpdate
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Determine the title prefix based on case type
  const getTitlePrefix = () => {
    if (customizations?.hero?.titlePrefix) {
      return customizations.hero.titlePrefix;
    }
    
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    if (caseType === 'homicide') {
      return 'Justice for';
    } else if (caseType === 'missing') {
      return 'Help Find';
    } else if (caseType === 'unidentified') {
      return 'Help Identify';
    } else if (caseType === 'cold_case') {
      return 'Seeking Answers for';
    }
    return 'Remember';
  };

  // Get investigation status
  const getInvestigationStatus = () => {
    if (customizations?.hero?.investigationStatus) {
      return customizations.hero.investigationStatus;
    }
    
    const caseType = caseData.crime_type || caseData.case_type || 'missing';
    
    if (caseData.deployment_status === 'deployed' && !caseData.is_public) {
      return 'CASE CLOSED';
    } else if (caseType === 'cold_case') {
      return 'COLD CASE';
    } else if (caseType === 'missing') {
      return 'MISSING PERSON';
    }
    return 'ACTIVE INVESTIGATION';
  };

  // Get hero image with proper fallback
  const getHeroImage = () => {
    if (customizations?.hero?.backgroundImage) {
      return customizations.hero.backgroundImage;
    }
    if (primaryPhotoUrl && primaryPhotoUrl !== 'null' && primaryPhotoUrl !== null) {
      return primaryPhotoUrl;
    }
    // Use a gradient placeholder instead of external URL
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2364748b;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e293b;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23grad)'/%3E%3C/svg%3E";
  };

  // Format case number
  const formatCaseNumber = () => {
    if (caseData.case_number) {
      return `Case #: ${caseData.case_number}`;
    }
    return `Case #: ${new Date().getFullYear()}-${String(caseData.id || '000000').padStart(6, '0')}`;
  };

  // Get followers count (could be from actual data or calculated)
  const getFollowersCount = () => {
    if (caseData.followers_count) {
      return caseData.followers_count.toLocaleString();
    }
    // Mock calculation based on view count or other metrics
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

  const showReward = customizations?.hero?.showReward !== false && formatReward();
  const showStatus = customizations?.hero?.showStatus !== false;

  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getHeroImage()}
            alt={displayName}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Edit Button for Image */}
          {isEditing && (
            <button
              onClick={() => onCustomizationChange('hero.backgroundImage', 'OPEN_IMAGE_MODAL')}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg shadow-lg hover:bg-white transition-colors z-10"
              title="Change hero image"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="inline-flex items-center gap-2">
                  {getTitlePrefix()}
                  {isEditing && (
                    <button
                      onClick={() => onCustomizationChange('hero.titlePrefix', 'OPEN_PREFIX_MODAL')}
                      className="bg-white/20 backdrop-blur-sm text-white p-1 rounded hover:bg-white/30 transition-colors"
                      title="Edit title prefix"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </span>
                <span className="block text-yellow-400">{displayName}</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
                {customizations?.hero?.subtitle || caseData.description?.substring(0, 150) || 
                 `Help us find answers and bring justice to ${caseData.first_name || 'our'} family.`}
                {isEditing && (
                  <button
                    onClick={() => onCustomizationChange('hero.subtitle', 'OPEN_TEXT_EDITOR')}
                    className="ml-2 bg-white/20 backdrop-blur-sm text-white p-1 rounded hover:bg-white/30 transition-colors inline-block"
                    title="Edit subtitle"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </p>
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
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
                    {isEditing && (
                      <button
                        onClick={() => onCustomizationChange('hero.investigationStatus', 'OPEN_STATUS_MODAL')}
                        className="ml-2 bg-white/20 text-white p-1 rounded hover:bg-white/30 transition-colors inline-block"
                        title="Edit status"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
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