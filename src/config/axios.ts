import axios from 'axios';
import { config } from './environment';

// Configure axios defaults immediately when this module loads
axios.defaults.baseURL = config.API_ORIGIN;
axios.defaults.withCredentials = false; // Disable credentials for cross-origin requests

// Request interceptor for adding common headers
axios.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const labId = localStorage.getItem('lab_id');
    if (labId && /^\d+$/.test(labId)) {
      config.headers['X-Lab-ID'] = labId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear the token and redirect to login
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;

