import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email?: string;
  plan: string;
  songsGenerated?: number;
  songsThisMonth?: number;
  maxSongs?: number;
  features?: {
    voiceCloning: boolean;
    advancedEditing: boolean;
    collaboration: boolean;
    analytics: boolean;
    versionControl: boolean;
    socialFeatures: boolean;
    prioritySupport: boolean;
    customization: boolean;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/user');

        if (response.ok) {
          const userData = await response.json();
          console.log('User data fetched:', userData);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log('User not authenticated, status:', response.status);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/api/logout';
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  return { 
    user, 
    isAuthenticated, 
    isLoading,
    login,
    logout,
    updateUser,
    setUser
  };
};