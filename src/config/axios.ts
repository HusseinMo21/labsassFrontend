import axios from 'axios';

// Configure axios defaults immediately when this module loads
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

// CSRF token management
let csrfToken: string | null = null;

// Function to fetch CSRF token
const fetchCSRFToken = async (): Promise<string> => {
  try {
    console.log('Fetching CSRF token...');
    // First, get the CSRF cookie
    await axios.get('/sanctum/csrf-cookie');
    // Then get the token
    const response = await axios.get('/api/auth/csrf-token');
    csrfToken = response.data.csrf_token;
    console.log('CSRF token fetched:', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

// Request interceptor to add CSRF token
axios.interceptors.request.use(
  async (config) => {
    // Skip CSRF only for public endpoints
    if (config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/csrf-token') ||
        config.url?.includes('/health') ||
        config.url?.includes('/sanctum/csrf-cookie')) {
      return config;
    }

    // Fetch CSRF token if not available
    if (!csrfToken) {
      try {
        await fetchCSRFToken();
      } catch (error) {
        console.error('Failed to get CSRF token for request:', error);
        return config;
      }
    }

    // Add CSRF token to headers
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
      console.log('Added CSRF token to request:', config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF token mismatch
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 419) {
      // CSRF token mismatch - fetch new token and retry
      try {
        await fetchCSRFToken();
        // Retry the original request
        const originalRequest = error.config;
        if (csrfToken) {
          originalRequest.headers['X-CSRF-TOKEN'] = csrfToken;
        }
        return axios(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;

