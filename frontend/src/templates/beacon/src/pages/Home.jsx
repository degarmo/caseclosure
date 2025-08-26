import React from "react";
import HeroSection from "../components/home/HeroSection";
import SidebarWidget from "../components/home/SidebarWidget";

export default function Home({ caseData, customizations, isEditing, onCustomizationChange }) {
  // Get victim's name from FORM DATA - NOT STATIC
  const firstName = caseData?.first_name || '';
  const lastName = caseData?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const age = caseData?.age || null;
  
  // Get default about content based on case type FROM FORM
  const getDefaultAboutContent = () => {
    const caseType = caseData?.case_type || caseData?.crime_type || '';
    
    // Only use first name from form
    if (!firstName) {
      return 'Please provide case details.';
    }
    
    switch(caseType.toLowerCase()) {
      case 'missing':
        return `${firstName} is missing and we need your help finding them. Any information, no matter how small, could be crucial in bringing ${firstName} home safely. Please share this page and contact us if you have any information.`;
      case 'assault':
        return `${firstName} was assaulted and we need your help to bring justice. We are seeking any information that could help identify those responsible. Your support means everything to our family during this difficult time.`;
      case 'homicide':
      case 'murder':
        return `${firstName} was taken from us and we need your help to find answers. We are seeking justice and any information that could help solve this case. Please come forward if you know anything that could help.`;
      default:
        return `We need your help regarding ${firstName}'s case. Any information you can provide could make a difference. Please contact us if you have any details that might help.`;
    }
  };
  
  // Get customization values with defaults
  const aboutContent = customizations?.about?.aboutContent || getDefaultAboutContent();
  const aboutTitle = customizations?.about?.aboutTitle || (firstName ? `About ${firstName}` : 'About');
  const spotlightTitle = customizations?.spotlight?.title || 'Latest Updates';
  const familyMessageEnabled = customizations?.familyMessage?.enabled !== false;
  const familyMessage = customizations?.familyMessage?.message || '';
  const familyMessageTitle = customizations?.familyMessage?.title || 'A Message from the Family';
  
  // Calculate age if not provided but DOB is available
  const calculateAge = () => {
    if (age) return age;
    if (caseData?.date_of_birth) {
      const birthDate = new Date(caseData.date_of_birth);
      const deathDate = caseData?.date_of_death ? new Date(caseData.date_of_death) : new Date();
      const calculatedAge = Math.floor((deathDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return calculatedAge;
    }
    return null;
  };
  
  const displayAge = calculateAge();
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Physical description tags from FORM DATA
  const getPhysicalTags = () => {
    const tags = [];
    
    // Last seen location from form
    if (caseData?.last_seen_location) {
      tags.push(`Last seen: ${caseData.last_seen_location}`);
    }
    
    // Height from form
    if (caseData?.height_feet || caseData?.height_inches) {
      const feet = caseData.height_feet || 0;
      const inches = caseData.height_inches || 0;
      tags.push(`Height: ${feet}'${inches}"`);
    }
    
    // Hair color from form
    if (caseData?.hair_color) {
      tags.push(`Hair: ${caseData.hair_color}`);
    }
    
    // Eye color from form
    if (caseData?.eye_color) {
      tags.push(`Eyes: ${caseData.eye_color}`);
    }
    
    return tags;
  };

  return (
    <div>
      <HeroSection 
        caseData={caseData}
        customizations={customizations}
        isEditing={isEditing}
        onCustomizationChange={onCustomizationChange}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            {/* Brief About Section */}
            <section id="about-section">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">
                {isEditing ? (
                  <input
                    type="text"
                    value={aboutTitle}
                    onChange={(e) => onCustomizationChange('about.aboutTitle', e.target.value)}
                    className="w-full px-3 py-1 border rounded-lg"
                    placeholder="Section title"
                  />
                ) : (
                  aboutTitle
                )}
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  {caseData?.primary_photo && (
                    <img
                      src={caseData.primary_photo}
                      alt={fullName}
                      className="w-full md:w-48 h-64 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                      {fullName}{displayAge && `, ${displayAge}`}
                    </h3>
                    
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={aboutContent}
                          onChange={(e) => onCustomizationChange('about.aboutContent', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={6}
                          placeholder="Enter a brief description about the case..."
                        />
                        <p className="text-xs text-gray-500">
                          This content will be displayed on the home page. You can add more details on the About page.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-slate max-w-none mb-4">
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {aboutContent}
                          </p>
                        </div>
                        
                        {/* Show incident date from form */}
                        {caseData?.incident_date && (
                          <p className="text-slate-600 mb-4">
                            <strong>Incident Date:</strong> {formatDate(caseData.incident_date)}
                          </p>
                        )}
                        
                        {/* Show last seen date for missing persons */}
                        {caseData?.case_type === 'missing' && caseData?.last_seen_date && (
                          <p className="text-slate-600 mb-4">
                            <strong>Last Seen:</strong> {formatDate(caseData.last_seen_date)}
                          </p>
                        )}
                      </>
                    )}
                    
                    {/* Physical Description Tags from FORM */}
                    {!isEditing && getPhysicalTags().length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {getPhysicalTags().map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Family Message Section */}
            {(familyMessageEnabled && (familyMessage || isEditing)) && (
              <section>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      value={familyMessageTitle}
                      onChange={(e) => onCustomizationChange('familyMessage.title', e.target.value)}
                      className="w-full px-3 py-1 border rounded-lg"
                      placeholder="Message section title"
                    />
                  ) : (
                    familyMessageTitle
                  )}
                </h2>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  {isEditing ? (
                    <div>
                      <textarea
                        value={familyMessage}
                        onChange={(e) => onCustomizationChange('familyMessage.message', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={4}
                        placeholder="Enter a message from the family..."
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={familyMessageEnabled}
                          onChange={(e) => onCustomizationChange('familyMessage.enabled', e.target.checked)}
                          id="showFamilyMessage"
                          className="w-4 h-4"
                        />
                        <label htmlFor="showFamilyMessage" className="text-sm text-gray-600">
                          Show family message section
                        </label>
                      </div>
                    </div>
                  ) : familyMessage && (
                    <blockquote className="text-lg text-slate-600 italic leading-relaxed">
                      "{familyMessage}"
                    </blockquote>
                  )}
                </div>
              </section>
            )}

            {/* Recent Updates Preview */}
            {customizations?.spotlight?.enabled !== false && (
              <section>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">
                  {isEditing ? (
                    <input
                      type="text"
                      value={spotlightTitle}
                      onChange={(e) => onCustomizationChange('spotlight.title', e.target.value)}
                      className="w-full px-3 py-1 border rounded-lg"
                      placeholder="Updates section title"
                    />
                  ) : (
                    spotlightTitle
                  )}
                </h2>
                
                {caseData?.spotlight_posts && caseData.spotlight_posts.length > 0 ? (
                  <div className="space-y-6">
                    {caseData.spotlight_posts.slice(0, 2).map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-slate-600 font-semibold">
                              {firstName?.[0]}{lastName?.[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-slate-800">{post.title}</span>
                              <span className="text-slate-500 text-sm">
                                {new Date(post.published_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-600 mb-3">{post.excerpt || post.content}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>{post.view_count || 0} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <p className="text-slate-500">
                      {isEditing ? 'Spotlight posts will appear here once published' : 'No updates yet'}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SidebarWidget 
              caseData={caseData}
              customizations={customizations}
              isEditing={isEditing}
              onCustomizationChange={onCustomizationChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}