import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPlanningCenter: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Set axios default header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login: async (email: string, password: string) => {
      try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        });

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({ user, token, isAuthenticated: true });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Anmeldung fehlgeschlagen');
      }
    },
    loginWithPlanningCenter: async () => {
      try {
        // Get authorization URL from backend
        const response = await axios.get(`${API_URL}/api/auth/planning-center/authorize`);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        const { authUrl } = response.data;
        
        if (!authUrl) {
          throw new Error('Keine Autorisierungs-URL vom Server erhalten');
        }
        
        // Redirect to Planning Center OAuth
        window.location.href = authUrl;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Planning Center Anmeldung fehlgeschlagen';
        console.error('Planning Center login error:', error.response?.data || error);
        throw new Error(errorMessage);
      }
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false });
    },
    checkAuth: async () => {
      try {
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        const response = await axios.get(`${API_URL}/api/auth/me`);
        set({ user: response.data, isAuthenticated: true });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  };
});
