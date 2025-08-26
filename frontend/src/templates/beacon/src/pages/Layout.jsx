// src/templates/beacon/src/pages/Layout.jsx
// Updated version with correct case title logic and form data

import React, { useState } from "react";
import { Heart, Home, User, Phone, Share2, Mail, AlertCircle } from "lucide-react";

// Available logo icons
const LOGO_ICONS = {
  heart: '❤️',
  ribbon: '🎗️',
  star: '⭐',
  dove: '🕊️',
  candle: '🕯️',
  angel: '👼'
};

export default function BeaconLayout({ 
  children, 
  caseData, 
  customizations, 
  isPreview = false,
  currentPage = 'home',
  onCustomizationChange 
}) {
  const [showPhoneContact, setShowPhoneContact] = useState(customizations?.showPhoneContact || false);
  const [showEmailContact, setShowEmailContact] = useState(customizations?.showEmailContact || false);
  
  const navigationItems = [
    { title: "Home", page: "home", icon: Home },
    { title: "About", page: "about", icon: User },
    { title: "Spotlight", page: "spotlight", icon: Heart },
    { title: "Contact", page: "contact", icon: Phone }
  ];

  const handleContactChange = (field, value) => {
    if (field === 'showPhone') {
      setShowPhoneContact(value);
      onCustomizationChange?.({ ...customizations, showPhoneContact: value });
    } else if (field === 'showEmail') {
      setShowEmailContact(value);
      onCustomizationChange?.({ ...customizations, showEmailContact: value });
    } else {
      onCustomizationChange?.({ ...customizations, [field]: value });
    }
  };

  // Handle navigation in preview mode
  const handleNavClick = (page) => {
    if (isPreview) {
      const caseId = window.location.pathname.split('/')[2] || 'new';
      const template = new URLSearchParams(window.location.search).get('template') || 'beacon';
      window.location.href = `/preview/${caseId}/${page}?template=${template}`;
    }
  };

  // Get the correct title based on case type - USING FIRST NAME ONLY
  const getNavbarTitle = () => {
    if (customizations?.global?.navbarTitle) {
      return customizations.global.navbarTitle;
    }
    
    const caseType = caseData?.case_type || caseData?.crime_type || 'missing';
    const firstName = caseData?.first_name || 'Unknown';
    
    switch(caseType.toLowerCase()) {
      case 'missing':
        return `Help Find ${firstName}`;
      case 'homicide':
      case 'murder':
        return `Justice for ${firstName}`;
      case 'assault':
        return `Justice for ${firstName}`;
      default:
        return `Justice for ${firstName}`;
    }
  };

  // Get logo to display
  const renderLogo = () => {
    const logoType = customizations?.global?.logoType || 'icon';
    
    if (logoType === 'none') {
      return null;
    }
    
    if (logoType === 'upload' && customizations?.global?.logoUrl) {
      return (
        <img 
          src={customizations.global.logoUrl} 
          alt="Memorial logo" 
          className="h-10 w-auto"
        />
      );
    }
    
    // Default to icon
    const iconKey = customizations?.global?.logoIcon || 'heart';
    const icon = LOGO_ICONS[iconKey] || '❤️';
    
    return (
      <div className="w-10 h-10 hero-gradient rounded-lg flex items-center justify-center text-2xl">
        {icon}
      </div>
    );
  };

  // Determine case type display
  const getCaseTypeDisplay = () => {
    const caseType = caseData?.case_type || caseData?.crime_type || '';
    switch(caseType.toLowerCase()) {
      case 'missing':
        return 'Missing Person';
      case 'homicide':
      case 'murder':
        return 'Homicide';
      case 'assault':
        return 'Assault';
      default:
        return caseType.charAt(0).toUpperCase() + caseType.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <style>{`
        :root {
          --primary: 30 41 59;
          --primary-foreground: 248 250 252;
          --secondary: 234 179 8;
          --secondary-foreground: 30 41 59;
          --accent: 148 163 184;
          --muted: 248 250 252;
          --border: 226 232 240;
        }
        
        .hero-gradient {
          background: linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%);
        }
        
        .gold-gradient {
          background: linear-gradient(135deg, rgb(234 179 8) 0%, rgb(251 191 36) 100%);
        }
      `}</style>

      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleNavClick('home')}
            >
              {renderLogo()}
              <div className="font-bold text-xl text-slate-800">
                {getNavbarTitle()}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleNavClick(item.page)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === item.page
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </button>
              ))}
              <button className="gold-gradient text-slate-800 px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2 rounded-lg text-slate-600 hover:bg-slate-50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Contact Section */}
      <footer className="bg-slate-800 text-white mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Family Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Family Contact</h3>
              <div className="space-y-2 text-slate-300">
                {showPhoneContact && customizations?.familyPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{customizations.familyPhone}</span>
                  </div>
                )}
                {showEmailContact && customizations?.familyEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{customizations.familyEmail}</span>
                  </div>
                )}
                {!showPhoneContact && !showEmailContact && (
                  <p className="text-sm italic">
                    Contact can be made through our secure contact page.
                  </p>
                )}
              </div>
            </div>
            
            {/* Law Enforcement Contact - FROM FORM DATA */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Law Enforcement Contact</h3>
              <div className="space-y-2 text-slate-300">
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
                    <span>{caseData.detective_email}</span>
                  </div>
                )}
                {caseData?.investigating_department && (
                  <p className="text-sm">{caseData.investigating_department}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-3">Quick Links</h4>
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => handleNavClick(item.page)}
                      className="block text-slate-300 hover:text-white text-sm transition-colors text-left"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                {/* Tips Notice */}
                <div className="text-center">
                  <p className="text-yellow-400 font-semibold mb-3">
                    All tips should be submitted through our secure contact page
                  </p>
                  <button 
                    onClick={() => handleNavClick('contact')}
                    className="inline-block px-6 py-3 bg-yellow-400 text-slate-800 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Submit a Tip
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Case Information</h4>
                <div className="space-y-1 text-sm text-slate-300">
                  {caseData?.case_number && (
                    <p>Case #: {caseData.case_number}</p>
                  )}
                  <p>Type: {getCaseTypeDisplay()}</p>
                  {/* Only show reward if checkbox is checked AND amount exists and is > 0 */}
                  {caseData?.reward_offered && caseData?.reward_amount && caseData.reward_amount > 0 && (
                    <p className="text-yellow-400">Reward: ${caseData.reward_amount.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 {getNavbarTitle()}. All rights reserved.</p>
            <p className="mt-2">Created with CaseClosure • Keeping hope alive</p>
          </div>
        </div>
      </footer>
    </div>
  );
}