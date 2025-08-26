// src/components/CaseCreator/constants.js

// Race options
export const RACE_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Two or More Races',
  'Other',
  'Prefer not to say'
];

// Sex options
export const SEX_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Transgender Male',
  'Transgender Female',
  'Other',
  'Prefer not to say'
];

// Hair color options
export const HAIR_COLORS = [
  'Black', 
  'Brown', 
  'Blonde', 
  'Red', 
  'Gray', 
  'White', 
  'Bald', 
  'Other'
];

// Crime type options
export const CRIME_TYPES = [

  { value: 'missing', label: 'Missing Person' },
  { value: 'homicide', label: 'Homicide' },
  { value: 'assault', label: 'Assault' },
];

// View tabs configuration
export const VIEW_TABS = [
  { id: 'form', label: 'Information', iconName: 'User' },
  { id: 'template', label: 'Template', iconName: 'Layout' },
  { id: 'customize', label: 'Customize', iconName: 'Edit3' },
  { id: 'preview', label: 'Preview', iconName: 'Eye' }
];

// Initial case data state
export const INITIAL_CASE_DATA = {
  // Basic Info
  first_name: '',
  last_name: '',
  nickname: '',
  date_of_birth: '',
  age: '',
  height_feet: '',
  height_inches: '',
  weight: '',
  race: '',
  sex: '',
  hair_color: '',
  distinguishing_features: '',
  recent_photo: null,
  recent_photo_preview: '',
  
  // Missing/Crime specific
  crime_type: '',
  last_seen_date: '',
  last_seen_time: '',
  last_seen_wearing: '',
  last_seen_with: '',
  planned_activities: '',
  transportation_details: '',
  vehicle_photo: null,
  vehicle_photo_preview: '',
  
  // Incident Info (for homicides)
  date_of_death: '',
  incident_date: '',
  incident_location: '',
  incident_description: '',
  
  // Investigation
  case_number: '',
  investigating_department: '',
  detective_name: '',
  detective_phone: '',
  detective_email: '',
  
  // Additional
  reward_offered: false,
  reward_amount: '',
  media_links: [],
  
  // Template
  template_id: null,
  template_version: '1.0.0',
  template_data: {}
};

// Domain preferences
export const DOMAIN_PREFERENCES = {
  SUBDOMAIN: 'subdomain',
  CUSTOM: 'custom'
};

// Default template version
export const DEFAULT_TEMPLATE_VERSION = '1.0.0';

// Default template ID
export const DEFAULT_TEMPLATE_ID = 'beacon';