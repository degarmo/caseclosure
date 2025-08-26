// src/templates/beacon/index.js
// This file properly exports all Beacon template components

import BeaconLayout from './src/pages/Layout';
import BeaconHome from './src/pages/Home';
import BeaconAbout from './src/pages/About';
import BeaconSpotlight from './src/pages/Spotlight';
import BeaconContact from './src/pages/Contact';

// Export all components
export {
  BeaconLayout,
  BeaconHome,
  BeaconAbout,
  BeaconSpotlight,
  BeaconContact
};

// Default export for the template configuration
const BeaconTemplate = {
  id: 'beacon',
  name: 'Beacon',
  version: '1.0.0',
  description: 'Clean, modern design with focus on awareness',
  
  // Component map for dynamic loading
  components: {
    layout: BeaconLayout,
    home: BeaconHome,
    about: BeaconAbout,
    spotlight: BeaconSpotlight,
    contact: BeaconContact
  },
  
  // Schema for customizable fields
  schema: {
    global: {
      logo: { 
        type: 'image', 
        label: 'Memorial Logo',
        required: false 
      },
      primaryColor: { 
        type: 'color', 
        label: 'Primary Color',
        default: '#FFD700' 
      }
    },
    pages: {
      home: {
        heroTagline: { 
          type: 'text', 
          label: 'Hero Tagline',
          default: 'Help us find answers and bring justice to our family',
          maxLength: 150 
        },
        aboutVictim: { 
          type: 'richtext', 
          label: 'About Section',
          default: '',
          maxLength: 2000 
        },
        galleryImages: { 
          type: 'gallery', 
          label: 'Photo Gallery',
          maxItems: 50 
        },
        showSpotlight: {
          type: 'boolean',
          label: 'Show Latest Updates',
          default: true
        }
      },
      about: {
        enabled: {
          type: 'boolean',
          label: 'Include About Page',
          default: true
        },
        biography: {
          type: 'richtext',
          label: 'Full Biography',
          default: ''
        },
        familyMessage: {
          type: 'richtext',
          label: 'Family Message',
          default: ''
        }
      },
      spotlight: {
        enabled: {
          type: 'boolean',
          label: 'Enable Spotlight Page',
          default: true
        },
        postsPerPage: {
          type: 'number',
          label: 'Posts Per Page',
          default: 5,
          min: 1,
          max: 20
        }
      },
      contact: {
        showFamilyPhone: {
          type: 'boolean',
          label: 'Show Family Phone',
          default: false
        },
        familyPhone: {
          type: 'tel',
          label: 'Family Phone Number',
          required: false
        },
        showFamilyEmail: {
          type: 'boolean',
          label: 'Show Family Email',
          default: false
        },
        familyEmail: {
          type: 'email',
          label: 'Family Email',
          required: false
        }
      }
    }
  }
};

export default BeaconTemplate;