// src/config/environment.js

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';

const config = {
  development: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    enableDebugLogging: true,
    enableAnalytics: false,
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.yourapp.com/api',
    enableDebugLogging: false,
    enableAnalytics: true,
  }
};

const currentConfig = isDevelopment ? config.development : config.production;

export const ENV = {
  ...currentConfig,
  isDevelopment,
  isProduction,
};

export default ENV;