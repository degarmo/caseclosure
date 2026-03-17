// src/config/environment.js
import { getAPIBaseURL } from '@/api/config';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

const config = {
  development: {
    apiUrl: getAPIBaseURL(),
    enableDebugLogging: true,
    enableAnalytics: false,
  },
  production: {
    apiUrl: getAPIBaseURL(),
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