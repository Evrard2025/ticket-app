import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

// Adapter le type User pour coller au backend
export type User = {
  id: number;
  name: string;
  email: string;
  telephone?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (telephone: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, isOrganizer: boolean, telephone: string) => Promise<boolean>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger le profil utilisateur au démarrage si JWT présent
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((data) => {
          setUser(data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Adapter login pour téléphone + mot de passe
  const login = async (telephone: string, password: string): Promise<boolean> => {
    try {
      const data = await api.post<{ telephone: string; password: string }, any>('/auth/login', { telephone, password });
      localStorage.setItem('token', data.token);
      if (data && typeof data === 'object' && 'user' in data) {
        setUser(data.user as User);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        return false;
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      return false;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  // Adapter signup pour envoyer le téléphone
  const signup = async (name: string, email: string, password: string, isOrganizer: boolean, telephone: string): Promise<boolean> => {
    try {
      const role = isOrganizer ? 'organizer' : 'user';
      await api.post('/auth/register', { name, email, password, role, telephone });
      return await login(telephone, password);
    } catch (error) {
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    signup,
    loading,
  };

  if (loading) return null; // ou un spinner

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};