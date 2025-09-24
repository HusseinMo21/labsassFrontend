import axios from 'axios';
import { config } from '../config/environment';

// Simple authentication utility that doesn't cause React re-renders
export class SimpleAuth {
  private static currentUser: any = null;

  static async initialize() {
    // Set up axios configuration
    axios.defaults.baseURL = config.API_ORIGIN;
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    console.log('SimpleAuth initialized for:', config.API_ORIGIN);
  }

  static async login(login: string, password: string) {
    try {
      console.log('SimpleAuth: Attempting login...');
      
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      }, {
        withCredentials: true,
        timeout: 10000
      });

      const { user, access_token } = response.data;
      this.currentUser = user;
      
      // Store token for future requests
      localStorage.setItem('access_token', access_token);
      
      // Set authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      console.log('SimpleAuth: Login successful for:', user?.name);
      
      return { success: true, user: user };
    } catch (error: any) {
      console.error('SimpleAuth: Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  }

  static async logout() {
    try {
      console.log('SimpleAuth: Attempting logout...');
      
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      
      // Set authorization header for logout request
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true,
        timeout: 10000
      });
    } catch (error) {
      console.error('SimpleAuth: Logout error:', error);
    } finally {
      this.currentUser = null;
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  static getCurrentUser() {
    return this.currentUser;
  }

  static isAuthenticated() {
    return this.currentUser !== null;
  }

  static hasRole(role: string) {
    return this.currentUser?.role === role;
  }
}

// Initialize on import
SimpleAuth.initialize();
