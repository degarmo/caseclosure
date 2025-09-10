// @/components/CaseCreator/views/CustomizationView/constants/templateRegistry.jsx
// Updated to use pages with Layout wrapper
// NOTE: This file must be named .jsx because it contains JSX in the fallback component

import { lazy } from 'react';

// Lazy load template pages WITH Layout wrapper
const loadTemplatePage = (templateName, pageName) => {
  return lazy(() => 
    import(`@/templates/${templateName}/src/pages/index.jsx`)
      .then(module => ({
        default: module[`${pageName}Page`] || module.default
      }))
      .catch(error => {
        console.error(`Failed to load ${templateName}/${pageName}:`, error);
        // Fallback component with JSX
        return {
          default: () => (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                <p>Failed to load {pageName} for {templateName} template</p>
              </div>
            </div>
          )
        };
      })
  );
};

export const TEMPLATE_REGISTRY = {
  beacon: {
    id: 'beacon',
    name: 'Beacon Template',
    description: 'Modern, clean design focused on finding missing persons',
    pages: {
      Home: loadTemplatePage('beacon', 'Home'),
      About: loadTemplatePage('beacon', 'About'),
      Spotlight: loadTemplatePage('beacon', 'Spotlight'),
      Timeline: loadTemplatePage('beacon', 'Timeline'),
      Contact: loadTemplatePage('beacon', 'Contact')
    },
    defaultCustomizations: {
      global: {
        primaryColor: '#1e293b',
        accentColor: '#eab308',
        fontFamily: 'Inter',
        logo: 'none'
      },
      pages: {
        home: { enabled: true },
        about: { enabled: true },
        spotlight: { enabled: true },
        timeline: { enabled: true },
        contact: { enabled: true }
      }
    }
  }
  // Add more templates here as needed
};

export const getTemplate = (templateId) => {
  return TEMPLATE_REGISTRY[templateId] || null;
};

export const getTemplatePages = (templateId) => {
  const template = getTemplate(templateId);
  return template ? Object.keys(template.pages) : [];
};

export const getAvailableTemplates = () => {
  return Object.keys(TEMPLATE_REGISTRY);
};

// Get default customizations for a template
export const getDefaultCustomizations = (templateId) => {
  const template = getTemplate(templateId);
  if (!template) {
    // Return minimal defaults if template not found
    return {
      customizations: {
        global: {
          primaryColor: '#1e293b',
          accentColor: '#3b82f6',
          fontFamily: 'Inter',
          logo: 'none'
        },
        pages: {}
      },
      metadata: {
        template_id: templateId,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString()
      }
    };
  }
  
  // Return template's default customizations with proper structure
  return {
    customizations: {
      ...template.defaultCustomizations
    },
    metadata: {
      template_id: templateId,
      template_name: template.name,
      version: '1.0.0',
      created_at: new Date().toISOString(),
      last_edited: new Date().toISOString()
    }
  };
};

// Editor configuration
export const EDITOR_CONFIG = {
  autoSaveDelay: 30000,
  maxUndoSteps: 50,
  previewDebounceDelay: 500
};

// Zoom presets for preview
export const ZOOM_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' }
];