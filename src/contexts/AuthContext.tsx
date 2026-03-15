import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../config/environment';
import { toast } from 'react-toastify';

interface Lab {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'doctor' | 'patient' | 'accountant';
  lab_id?: number | null;
}

interface AuthContextType {
  user: User | null;
  lab: Lab | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isDoctor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setAccessToken] = useState<string | null>(null);

  // Set up axios defaults for cookie-based authentication
  useEffect(() => {
    // Set base URL for all API calls
    axios.defaults.baseURL = config.API_ORIGIN;
    // Disable credentials for cross-origin requests
    axios.defaults.withCredentials = false;
  }, []);

  // Set axios defaults immediately when module loads (not just in useEffect)
  axios.defaults.baseURL = config.API_ORIGIN;
  axios.defaults.withCredentials = false; // Disable credentials for cross-origin requests

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Try to get user info with the token
          try {
            const response = await axios.get('/api/auth/user');
            const userData = response.data.user;
            const labData = response.data.lab ?? null;
            setUser(userData);
            setLab(labData);
            if (userData?.lab_id) {
              axios.defaults.headers.common['X-Lab-ID'] = String(userData.lab_id);
            } else {
              delete axios.defaults.headers.common['X-Lab-ID'];
            }
          } catch (tokenError) {
            // Token is invalid, remove it
            console.warn('Token invalid, removing from storage');
            localStorage.removeItem('access_token');
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['X-Lab-ID'];
            setAccessToken(null);
            setUser(null);
            setLab(null);
          }
        } else {
          setUser(null);
          setLab(null);
          delete axios.defaults.headers.common['X-Lab-ID'];
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        setUser(null);
        setLab(null);
        setAccessToken(null);
        localStorage.removeItem('access_token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (login: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      });

      const { user: userData, lab: labData, access_token } = response.data;
      setUser(userData);
      setLab(labData ?? null);
      setAccessToken(access_token);
      
      // Store token in localStorage for persistence
      localStorage.setItem('access_token', access_token);
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Set X-Lab-ID for localhost: allows users from any lab to use their lab context
      if (userData?.lab_id) {
        axios.defaults.headers.common['X-Lab-ID'] = String(userData.lab_id);
      } else {
        delete axios.defaults.headers.common['X-Lab-ID'];
      }
      
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLab(null);
      setAccessToken(null);
      
      // Clear token from localStorage
      localStorage.removeItem('access_token');
      
      // Remove authorization header and lab context
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['X-Lab-ID'];
      
      toast.info('Logged out successfully');
    }
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.includes(user?.role || '');
  };

  const isAdmin = () => hasRole('admin');
  const isStaff = () => hasRole('staff');
  const isDoctor = () => hasRole('doctor');

  const value: AuthContextType = {
    user,
    lab,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAdmin,
    isStaff,
    isDoctor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

