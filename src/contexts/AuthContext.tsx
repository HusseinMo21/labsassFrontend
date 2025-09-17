import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'doctor' | 'patient';
}

interface AuthContextType {
  user: User | null;
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
  const [loading, setLoading] = useState(true);

  // Set up axios defaults for cookie-based authentication
  useEffect(() => {
    // Set base URL for all API calls
    axios.defaults.baseURL = 'http://localhost:8000';
    // Enable credentials for cookie-based authentication
    axios.defaults.withCredentials = true;
  }, []);

  // Set axios defaults immediately when module loads (not just in useEffect)
  axios.defaults.baseURL = 'http://localhost:8000';
  axios.defaults.withCredentials = true;

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, get CSRF cookie
        await axios.get('http://localhost:8000/sanctum/csrf-cookie');
        
        // Then check if user is authenticated
        const response = await axios.get('/api/auth/user');
        setUser(response.data.user);
      } catch (error) {
        console.warn('Backend not available or auth check failed:', error);
        // Don't show error to user, just set user as null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (login: string, password: string) => {
    try {
      // Get CSRF cookie first
      await axios.get('http://localhost:8000/sanctum/csrf-cookie');
      
      // Then attempt login
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      });

      const { user: userData } = response.data;
      setUser(userData);
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Backend not available. Please start the Laravel server.';
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
