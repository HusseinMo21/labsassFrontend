import axios from 'axios';
import { config } from './environment';

// Configure axios defaults immediately when this module loads
axios.defaults.baseURL = config.API_ORIGIN;
axios.defaults.withCredentials = false; // Disable credentials for cross-origin requests

// Request interceptor for adding common headers
axios.interceptors.request.use(
  (config) => {
    // Add any common headers here if needed
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
    // Handle common errors here if needed
    return Promise.reject(error);
  }
);

export default axios;

