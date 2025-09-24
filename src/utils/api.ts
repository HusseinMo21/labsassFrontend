import axios from 'axios';
import { config } from '../config/environment';

// Create axios instance with optimized configuration
export const api = axios.create({
  baseURL: config.API_ORIGIN,
  timeout: config.API_TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Log API configuration in development
if (config.DEBUG) {
  console.log('🔧 API Configuration:', {
    baseURL: config.API_ORIGIN,
    environment: config.ENVIRONMENT,
    apiOrigin: config.API_ORIGIN,
  });
}

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired, remove from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('🔒 401 Unauthorized - Token cleared');
      // Don't redirect automatically, let the AuthContext handle it
    }
    
    // Log error for debugging
    console.warn('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

export default api;
