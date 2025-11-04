// @/templates/beacon/src/pages/Home.jsx
import React from "react";
import { MapPin, Calendar, User, AlertCircle, Heart, Share2 } from "lucide-react";
import EditableSection, { EditableImage, EditableText } from '@/components/CaseCreator/views/CustomizationView/components/EditableSection';
import HeroSection from '../components/home/HeroSection';

export default function Home({ 
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
    return parts.join(' ') || 'Unknown Person';
  };

  // Get primary photo from case data
  const getPrimaryPhotoUrl = () => {
    if (caseData.primary_photo_url) return caseData.primary_photo_url;
    if (caseData.victim_photo_url) return caseData.victim_photo_url;
    if (caseData.photos && caseData.photos.length > 0) {
      const primaryPhoto = caseData.photos.find(p => p.is_primary);
      return primaryPhoto ? primaryPhoto.image_url : caseData.photos[0].image_url;
    }
    return null;
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate age
  const calculateAge = () => {
    if (caseData.age) return caseData.age;
    if (caseData.date_of_birth) {
      const birthDate = new Date(caseData.date_of_birth);
      const endDate = caseData.date_of_death ? new Date(caseData.date_of_death) : new Date();
      const age = Math.floor((endDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return age;
    }
    return null;
  };

  // Get last update date
  const getLastUpdate = () => {
    if (caseData.updated_at) {
      return formatDate(caseData.updated_at);
    }
    return formatDate(new Date().toISOString());
  };

  const displayName = getDisplayName();

  // Get content helper - checks customizations first, then defaults
  const getContent = (sectionId, defaultContent) => {
    return customizations[sectionId] || defaultContent;
  };

  return (
    <div className="min-h-screen">
      {/* USE THE HEROSECTION COMPONENT! 🎯 */}
      <HeroSection
        caseData={caseData}
        customizations={customizations}
        isEditing={isEditing}
        onEditSection={onEditSection}
        onCustomizationChange={onCustomizationChange}
        primaryPhotoUrl={getPrimaryPhotoUrl()}
        displayName={displayName}
        lastUpdate={getLastUpdate()}
      />

      {/* Quick Facts Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditableText
            sectionId="quick_facts_header"
            label="Quick Facts Header"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`<h2 class="text-3xl font-bold text-slate-800 mb-4">Quick Facts</h2><p class="text-lg text-slate-600">Important information about this case</p>`}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                {getContent('quick_facts_title', 'Quick Facts')}
              </h2>
              <p className="text-lg text-slate-600">
                {getContent('quick_facts_subtitle', 'Important information about this case')}
              </p>
            </div>
          </EditableText>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Physical Description */}
            {(caseData.height_feet || caseData.weight || caseData.hair_color || caseData.eye_color) && (
              <EditableSection
                sectionId="physical_description"
                sectionType="content"
                label="Physical Description"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="bg-slate-50 rounded-xl p-6"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Physical Description</h3>
                  <ul className="space-y-2 text-slate-600">
                    {caseData.height_feet && (
                      <li>Height: {caseData.height_feet}'{caseData.height_inches || 0}"</li>
                    )}
                    {caseData.weight && <li>Weight: {caseData.weight} lbs</li>}
                    {caseData.hair_color && <li>Hair: {caseData.hair_color}</li>}
                    {caseData.eye_color && <li>Eyes: {caseData.eye_color}</li>}
                    {caseData.race && <li>Race: {caseData.race}</li>}
                    {caseData.gender && <li>Gender: {caseData.gender}</li>}
                  </ul>
                </div>
              </EditableSection>
            )}

            {/* Last Seen Details */}
            {(caseData.last_seen_wearing || caseData.last_seen_time) && (
              <EditableSection
                sectionId="last_seen_details"
                sectionType="content"
                label="Last Seen Details"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="bg-slate-50 rounded-xl p-6"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Last Seen Details</h3>
                  <ul className="space-y-2 text-slate-600">
                    {caseData.last_seen_time && (
                      <li>Time: {caseData.last_seen_time}</li>
                    )}
                    {caseData.last_seen_wearing && (
                      <li>Wearing: {caseData.last_seen_wearing}</li>
                    )}
                    {caseData.vehicle_description && (
                      <li>Vehicle: {caseData.vehicle_description}</li>
                    )}
                  </ul>
                </div>
              </EditableSection>
            )}

            {/* Distinguishing Features */}
            {caseData.distinguishing_features && (
              <EditableText
                sectionId="distinguishing_features"
                label="Distinguishing Features"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="bg-slate-50 rounded-xl p-6"
                defaultContent={caseData.distinguishing_features}
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Distinguishing Features</h3>
                  <p className="text-slate-600">
                    {getContent('distinguishing_features', caseData.distinguishing_features)}
                  </p>
                </div>
              </EditableText>
            )}

            {/* Medical Conditions */}
            {caseData.medical_conditions && (
              <EditableText
                sectionId="medical_conditions"
                label="Medical Information"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="bg-slate-50 rounded-xl p-6"
                defaultContent={caseData.medical_conditions}
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Medical Information</h3>
                  <p className="text-slate-600">
                    {getContent('medical_conditions', caseData.medical_conditions)}
                  </p>
                </div>
              </EditableText>
            )}

            {/* Investigating Agency */}
            {(caseData.investigating_agency || caseData.detective_name) && (
              <EditableSection
                sectionId="investigation_info"
                sectionType="content"
                label="Investigation Information"
                isEditing={isEditing}
                onEdit={onEditSection}
                customizations={customizations}
                className="bg-slate-50 rounded-xl p-6"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Investigation</h3>
                  <ul className="space-y-2 text-slate-600">
                    {caseData.investigating_agency && (
                      <li>{caseData.investigating_agency}</li>
                    )}
                    {caseData.detective_name && (
                      <li>Detective: {caseData.detective_name}</li>
                    )}
                    {caseData.detective_phone && (
                      <li>
                        <a href={`tel:${caseData.detective_phone}`} className="text-blue-600 hover:underline">
                          {caseData.detective_phone}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </EditableSection>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <EditableText
            sectionId="cta_title"
            label="CTA Title"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent="Every Detail Matters"
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-6">
              {getContent('cta_title', 'Every Detail Matters')}
            </h2>
          </EditableText>

          <EditableText
            sectionId="cta_message"
            label="CTA Message"
            isEditing={isEditing}
            onEdit={onEditSection}
            customizations={customizations}
            defaultContent={`If you have any information about ${displayName}, no matter how small it may seem, please come forward. Your tip could be the key to solving this case.`}
          >
            <p className="text-lg text-slate-700 mb-8">
              {getContent('cta_message', 
                `If you have any information about ${displayName}, no matter how small it may seem, please come forward. Your tip could be the key to solving this case.`
              )}
            </p>
          </EditableText>
          
          {caseData.reward_amount && parseFloat(caseData.reward_amount) > 0 && (
            <EditableText
              sectionId="reward_section"
              label="Reward Section"
              isEditing={isEditing}
              onEdit={onEditSection}
              customizations={customizations}
              defaultContent={`<div><p class="text-2xl font-bold">$${parseFloat(caseData.reward_amount).toLocaleString()} REWARD</p><span class="text-base font-normal mt-2">For information leading to resolution of this case</span></div>`}
            >
              <p className="mt-8 text-2xl font-bold text-slate-800">
                ${parseFloat(caseData.reward_amount).toLocaleString()} REWARD
                <span className="block text-base font-normal mt-2">
                  For information leading to resolution of this case
                </span>
              </p>
            </EditableText>
          )}
        </div>
      </section>

      {/* Recent Updates Section (if applicable) */}
      {caseData.updates && caseData.updates.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <EditableText
              sectionId="updates_title"
              label="Updates Title"
              isEditing={isEditing}
              onEdit={onEditSection}
              customizations={customizations}
              defaultContent="Recent Updates"
            >
              <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
                {getContent('updates_title', 'Recent Updates')}
              </h2>
            </EditableText>

            <div className="space-y-6">
              {caseData.updates.slice(0, 3).map((update, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-400 text-slate-800 rounded-full p-2">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-2">{formatDate(update.date)}</p>
                      <EditableText
                        sectionId={`update_content_${index}`}
                        label={`Update ${index + 1} Content`}
                        isEditing={isEditing}
                        onEdit={onEditSection}
                        customizations={customizations}
                        defaultContent={update.content}
                      >
                        <p className="text-slate-700">
                          {getContent(`update_content_${index}`, update.content)}
                        </p>
                      </EditableText>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}