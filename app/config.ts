// API Configuration
// Environment-aware API base URL configuration

// For development, you can set these manually or use environment variables
const PRODUCTION_API_URL = 'https://your-backend-vercel-app.vercel.app/api';
const LOCAL_DEVELOPMENT_URL = 'http://192.168.1.26:8000/api';

// Auto-detect environment and set API base URL
const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (__DEV__) {
    // In development, use the local server
    return LOCAL_DEVELOPMENT_URL;
  } else {
    // In production, use the Vercel backend URL
    return PRODUCTION_API_URL;
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Configuration for different environments
export const CONFIG = {
  API_BASE_URL,
  IS_DEVELOPMENT: __DEV__,
  PRODUCTION_URL: PRODUCTION_API_URL,
  LOCAL_URL: LOCAL_DEVELOPMENT_URL,
};

// Helper function to update API URL (useful for switching between environments)
export const setApiUrl = (url: string) => {
  // Note: This would need to be implemented with a state management solution
  // For now, you can manually change the URLs above
  console.log('To change API URL, update the configuration in config.ts');
};

// Debug helper
console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  isDevelopment: __DEV__,
});

export default CONFIG;
