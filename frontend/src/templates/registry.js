// src/templates/registry.js
const templates = {
  beacon: {
    id: 'beacon',
    name: 'Beacon',
    version: '1.0.0',
    description: 'Clean, modern design with focus on awareness',
    preview: '/templates/beacon/preview.jpg',
    
    // Define what can be customized
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
          sections: {
            type: 'sections',
            label: 'Page Sections',
            allowedTypes: ['text', 'timeline', 'gallery']
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
    },
    
    // Component paths
    components: {
      layout: () => import('./beacon/src/pages/Layout'),
      home: () => import('./beacon/src/pages/Home'),
      about: () => import('./beacon/src/pages/About'),
      contact: () => import('./beacon/src/pages/Contact'),
      spotlight: () => import('./beacon/src/pages/Spotlight'),
    }
  },
};

export default templates;

// Helper to get template by ID
export const getTemplate = (templateId) => {
  return templates[templateId] || templates.beacon;
};

// Helper to validate template data against schema
export const validateTemplateData = (templateId, data) => {
  const template = getTemplate(templateId);
  // Add validation logic here
  return true;
};