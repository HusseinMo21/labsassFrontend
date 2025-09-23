// Environment Configuration
// Easy switching between development and production

// To switch environments:
// 1. Change CURRENT_ENV to 'development' or 'production'
// 2. Or set VITE_APP_ENV environment variable

const CURRENT_ENV = import.meta.env.VITE_APP_ENV || 'production';

const environments = {
  development: {
    API_BASE_URL: 'http://localhost:8000/api',
    API_ORIGIN: 'http://localhost:8000',
    APP_NAME: 'Dryasser Development',
    API_TIMEOUT: 120000, // 2 minutes
    DEBUG: true,
    BASE_PATH: '', // No base path for development
  },
  production: {
    API_BASE_URL: 'https://phplaravel-1526034-5875973.cloudwaysapps.com/api',
    API_ORIGIN: 'https://phplaravel-1526034-5875973.cloudwaysapps.com',
    APP_NAME: 'Dryasser',
    API_TIMEOUT: 120000, // 2 minutes
    DEBUG: false,
    BASE_PATH: '', // Base path for production deployment
  },
};

// Get current environment configuration
const getEnvironmentConfig = () => {
  const env = environments[CURRENT_ENV as keyof typeof environments];
  if (!env) {
    console.warn(`Unknown environment: ${CURRENT_ENV}, falling back to production`);
    return environments.production;
  }
  return env;
};

// Export configuration
export const config = {
  ...getEnvironmentConfig(),
  ENVIRONMENT: CURRENT_ENV,
};

// Helper functions
export const isDevelopment = () => CURRENT_ENV === 'development';
export const isProduction = () => CURRENT_ENV === 'production';

// Log current environment (only in development)
if (isDevelopment()) {
  console.log('🚀 Environment Configuration:', {
    environment: CURRENT_ENV,
    apiBaseUrl: config.API_BASE_URL,
    appName: config.APP_NAME,
  });
}

export default config;
