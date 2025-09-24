import axios from 'axios';
import { config } from '../config/environment';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'doctor' | 'patient';
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private loading = true;
  private initialized = false;
  private listeners: Array<(user: User | null, loading: boolean) => void> = [];

  private constructor() {
    // Set up axios defaults
    axios.defaults.baseURL = config.API_ORIGIN;
    axios.defaults.withCredentials = false;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public subscribe(listener: (user: User | null, loading: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call the listener with current state
    listener(this.user, this.loading);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.user, this.loading));
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('AuthService: Already initialized, skipping...');
      return;
    }
    
    try {
      this.initialized = true;
      this.loading = true;
      this.notifyListeners();
      console.log('AuthService: Starting initialization...');
      
      // Check if user is authenticated via session
      const response = await axios.get('/api/auth/user', { timeout: 5000 });
      this.user = response.data.user;
      console.log('AuthService: Auth check successful, user:', this.user?.name);
    } catch (error) {
      console.warn('AuthService: Backend not available or auth check failed:', error);
      this.user = null;
    } finally {
      this.loading = false;
      this.notifyListeners();
      console.log('AuthService: Initialization completed');
    }
  }

  public async login(login: string, password: string): Promise<{ success: boolean; user?: User | null; error?: string }> {
    try {
      // Attempt login with session-based authentication
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      });

      this.user = response.data.user;
      this.notifyListeners();
      
      return { success: true, user: this.user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Backend not available. Please start the Laravel server.';
      return { success: false, error: message };
    }
  }

  public async logout(): Promise<void> {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    } finally {
      this.user = null;
      this.initialized = false;
      this.notifyListeners();
    }
  }

  public getUser(): User | null {
    return this.user;
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  public hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.user?.role || '');
  }

  public isAdmin(): boolean {
    return this.hasRole('admin');
  }

  public isStaff(): boolean {
    return this.hasRole('staff');
  }

  public isDoctor(): boolean {
    return this.hasRole('doctor');
  }
}

export default AuthService;
