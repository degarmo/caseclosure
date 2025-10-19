// src/components/discover/CaseCard.jsx
import React from 'react';
import { MapPin, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CaseCard = ({ caseData }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Format the location string
  const getLocation = () => {
    // First check if we have the formatted location passed from Discover
    if (caseData.location) {
      return caseData.location;
    }
    
    // Otherwise, build it from city and state
    const parts = [];
    if (caseData.incident_city) parts.push(caseData.incident_city);
    if (caseData.incident_state) parts.push(caseData.incident_state);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // Try other location fields
    if (caseData.full_incident_location) {
      return caseData.full_incident_location;
    }
    
    if (caseData.incident_location) {
      return caseData.incident_location;
    }
    
    return 'Unknown location';
  };

  // Format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get the appropriate date based on case type
  const getIncidentDate = () => {
    if (caseData.incident_date) {
      return formatDate(caseData.incident_date);
    }
    if (caseData.date_of_death) {
      return formatDate(caseData.date_of_death);
    }
    if (caseData.last_seen_date) {
      return formatDate(caseData.last_seen_date);
    }
    return 'Date unknown';
  };

  // Get case type label with proper formatting
  const getCaseTypeLabel = () => {
    const type = caseData.case_type || caseData.crime_type || 'unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  // Get case type color
  const getCaseTypeColor = () => {
    const type = caseData.case_type || caseData.crime_type;
    switch(type) {
      case 'missing':
        return 'bg-amber-500';
      case 'homicide':
        return 'bg-red-500';
      case 'unidentified':
        return 'bg-purple-500';
      case 'cold_case':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle view case click
  const handleViewCase = () => {
    if (caseData.deployment_url) {
      window.open(caseData.deployment_url, '_blank');
    } else if (caseData.subdomain) {
      window.open(`https://${caseData.subdomain}.caseclosure.org`, '_blank');
    } else {
      // Fallback to a case details page
      window.location.href = `/cases/${caseData.id}`;
    }
  };

  // Get victim photo URL from the photos array or use initials
  const getPhotoUrl = () => {
    // First check if there's a photos array with a primary photo
    if (caseData.photos && caseData.photos.length > 0) {
      // Find the primary photo
      const primaryPhoto = caseData.photos.find(photo => photo.is_primary);
      if (primaryPhoto && primaryPhoto.image_url) {
        return primaryPhoto.image_url;
      }
      // If no primary photo marked, use the first photo
      if (caseData.photos[0] && caseData.photos[0].image_url) {
        return caseData.photos[0].image_url;
      }
    }
    
    // Check for direct photo URLs (backward compatibility)
    if (caseData.victim_photo_url) {
      return caseData.victim_photo_url;
    }
    
    if (caseData.primary_photo_url) {
      return caseData.primary_photo_url;
    }
    
    // If no photo exists, return null to trigger initials display
    return null;
  };

  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
    }
  };
  
  // Generate initials for placeholder
  const getInitials = () => {
    const firstName = caseData.first_name || '';
    const lastName = caseData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'UN';
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Image Section */}
      <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200">
        {getPhotoUrl() && !imageError ? (
          <img 
            src={getPhotoUrl()}
            alt={`${caseData.first_name} ${caseData.last_name}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
            <span className="text-5xl font-bold text-white">
              {getInitials()}
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`${getCaseTypeColor()} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
            {getCaseTypeLabel()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {caseData.first_name} {caseData.last_name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{getLocation()}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{getIncidentDate()}</span>
        </div>

        {/* Case Title */}
        {caseData.case_title && (
          <p className="text-gray-700 mb-4 line-clamp-2">
            {caseData.case_title}
          </p>
        )}

        {/* View Button */}
        <Button 
          onClick={handleViewCase}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          View Case Details →
        </Button>
      </div>
    </div>
  );
};

export default CaseCard;