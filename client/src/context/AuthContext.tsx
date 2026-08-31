import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('hookwatch_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<{ user: User }>('/api/auth/me');
        setUser(response.user);
      } catch (err) {
        console.error('Initial authentication check failed:', err);
        // Clear invalid or expired tokens
        localStorage.removeItem('hookwatch_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('hookwatch_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hookwatch_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
