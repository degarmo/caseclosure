// src/templates/beacon/src/pages/Layout.jsx
// Complete dynamic layout with CMS integration

import React, { useState } from "react";
import { Heart, Home, User, Phone, Share2, Mail, Calendar, Clock, Plus } from "lucide-react";

// Predefined logo options - map to your actual logo files
const LOGO_OPTIONS = {
  dove: '/logos/dove.png',
  flame: '/logos/flame.png', 
  lantern: '/logos/lantern.png',
  phoenix: '/logos/phoenix.png',
  none: null
};

export default function Layout({ 
  children, 
  caseData = {}, 
  customizations = {}, 
  isPreview = false,
  isEditing = false,
  currentPageName = 'Home',
  onCustomizationChange,
  onNavbarEdit,  // ADD THIS PROP
  onLogoClick,
  onImageClick,
  onPageNavigate
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Navigation items - can be customized per template
  const navigationItems = customizations?.navigation?.items || [
    { title: "Home", page: "home", icon: Home },
    { title: "About", page: "about", icon: User },
    { title: "Spotlight", page: "spotlight", icon: Heart },
    { title: "Contact", page: "contact", icon: Phone }
  ];

  // Get display name
  const getDisplayName = () => {
    if (caseData.display_name) return caseData.display_name;
    const parts = [];
    if (caseData.first_name) parts.push(caseData.first_name);
    if (caseData.last_name) parts.push(caseData.last_name);
    return parts.join(' ') || 'Unknown';
  };

  // Get the navbar title based on case type or customization
  const getNavbarTitle = () => {
    // Check for customized navbar title first
    if (customizations?.navbar_title) {
      return customizations.navbar_title;
    }
    
    const caseType = caseData?.crime_type || caseData?.case_type || 'missing';
    const firstName = caseData?.first_name || 'Unknown';
    
    switch(caseType.toLowerCase()) {
      case 'missing':
        return `Help Find ${firstName}`;
      case 'homicide':
      case 'murder':
        return `Justice for ${firstName}`;
      case 'unidentified':
        return `Help Identify`;
      case 'cold_case':
        return `Seeking Answers for ${firstName}`;
      default:
        return `Remember ${firstName}`;
    }
  };

  // Render logo based on customization
  const renderLogo = () => {
    // Check for custom uploaded logo
    if (customizations?.navbar_logo) {
      return (
        <div className="relative group">
          <img 
            src={customizations.navbar_logo} 
            alt="Logo" 
            className="h-10 w-auto"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {isEditing && (
            <button
              onClick={() => onNavbarEdit && onNavbarEdit()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Change logo"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      );
    }
    
    // No logo - just add edit button if in edit mode
    if (isEditing) {
      return (
        <button
          onClick={() => onNavbarEdit && onNavbarEdit()}
          className="w-10 h-10 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
          title="Add logo"
        >
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      );
    }
    
    return null;
  };

  // Get case type display
  const getCaseTypeDisplay = () => {
    const caseType = caseData?.crime_type || caseData?.case_type || '';
    switch(caseType.toLowerCase()) {
      case 'missing':
        return 'Missing Person';
      case 'homicide':
      case 'murder':
        return 'Homicide';
      case 'unidentified':
        return 'Unidentified Person';
      case 'cold_case':
        return 'Cold Case';
      default:
        return caseType ? caseType.charAt(0).toUpperCase() + caseType.slice(1) : 'Investigation';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Update handleNavigation to use onPageNavigate in edit mode
  const handleNavigation = (page) => {
    if (isEditing && onPageNavigate) {
      // In edit mode, just switch pages without navigating
      onPageNavigate(page);
    } else if (isPreview) {
      // In preview mode, handle navigation differently
      window.location.href = `/${page}`;
    } else {
      // Normal navigation
      window.location.href = `/${page}`;
    }
  };

  // Get primary color from customizations
  const primaryColor = customizations?.theme?.primaryColor || '#1e293b';
  const accentColor = customizations?.theme?.accentColor || '#eab308';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{`
        :root {
          --primary-color: ${primaryColor};
          --accent-color: ${accentColor};
        }
        
        .hero-gradient {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color)ee 100%);
        }
        
        .accent-gradient {
          background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color)dd 100%);
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, rgb(234 179 8) 0%, rgb(251 191 36) 100%);
        }
      `}</style>

      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              {renderLogo()}
              <div className="relative group">
                <div className="font-bold text-xl text-slate-800">
                  {getNavbarTitle()}
                </div>
                {isEditing && (
                  <button
                    onClick={() => onNavbarEdit && onNavbarEdit()}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit title"
                  >
                    <Plus className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => {
                const isActive = currentPageName.toLowerCase() === item.page.toLowerCase();
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavigation(item.page)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-slate-100 text-slate-800"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </button>
                );
              })}
              <button 
                className="gold-gradient text-slate-800 px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              {navigationItems.map((item) => {
                const isActive = currentPageName.toLowerCase() === item.page.toLowerCase();
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavigation(item.page)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-slate-100 text-slate-800"
                        : "text-slate-600"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - keeping the same */}
      <footer className="bg-slate-800 text-white mt-16 py-12">
        {/* ... rest of footer stays the same ... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Case Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Case Information</h3>
              <div className="space-y-2 text-slate-300">
                {caseData?.case_number && (
                  <p>Case #: {caseData.case_number}</p>
                )}
                <p>Type: {getCaseTypeDisplay()}</p>
                {caseData?.incident_date && (
                  <p>Incident Date: {formatDate(caseData.incident_date)}</p>
                )}
                {caseData?.date_missing && (
                  <p>Missing Since: {formatDate(caseData.date_missing)}</p>
                )}
                {caseData?.last_seen_date && (
                  <p>Last Seen: {formatDate(caseData.last_seen_date)}</p>
                )}
                {caseData?.reward_amount && parseFloat(caseData.reward_amount) > 0 && (
                  <p className="text-yellow-400 font-semibold">
                    Reward: ${parseFloat(caseData.reward_amount).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            {/* Law Enforcement Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Law Enforcement Contact</h3>
              <div className="space-y-2 text-slate-300">
                {caseData?.investigating_agency && (
                  <p className="font-medium">{caseData.investigating_agency}</p>
                )}
                {caseData?.detective_name && (
                  <p>Detective: {caseData.detective_name}</p>
                )}
                {caseData?.detective_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{caseData.detective_phone}</span>
                  </div>
                )}
                {caseData?.detective_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${caseData.detective_email}`} className="hover:text-yellow-400 transition-colors">
                      {caseData.detective_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Submit Information</h3>
              <div className="space-y-3">
                <p className="text-slate-300">
                  Any information, no matter how small, could help solve this case.
                </p>
                <button 
                  onClick={() => handleNavigation('contact')}
                  className="inline-block px-6 py-3 bg-yellow-400 text-slate-800 rounded-lg font-semibold hover:bg-yellow-300 transition-colors cursor-pointer"
                >
                  Submit Anonymous Tip
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 {getDisplayName()} Memorial. All rights reserved.</p>
            <p className="mt-2">Created with CaseClosure</p>
          </div>
        </div>
      </footer>

      {/* Edit Mode Indicator */}
      {isEditing && (
        <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-50">
          Edit Mode
        </div>
      )}
    </div>
  );
}