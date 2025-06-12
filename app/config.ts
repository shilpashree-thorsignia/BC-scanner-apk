// API Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isWeb = typeof window !== 'undefined';

// Environment-based API URL configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (isDevelopment 
    ? 'http://192.168.1.27:8000/api'  // Local development
    : 'https://bc-scanner-apk.vercel.app/api'  // Production - Your deployed backend
  );

// App Configuration
export const APP_CONFIG = {
  API_BASE_URL,
  isDevelopment,
  isWeb,
  version: '1.0.0',
  
  // API Endpoints
  endpoints: {
    health: '/health/',
    scan: '/scan/',
    history: '/history/',
    // Add other endpoints as needed
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

console.log('🔧 App Config:', {
  environment: isDevelopment ? 'development' : 'production',
  platform: isWeb ? 'web' : 'native',
  apiUrl: API_BASE_URL
});
