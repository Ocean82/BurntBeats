import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email?: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  songsGenerated?: number;
  songsThisMonth?: number;
  maxSongs?: number;
  totalSongsCreated?: number;
  totalDownloads?: number;
  features?: {
    voiceCloning: boolean;
    advancedEditing: boolean;
    collaboration: boolean;
    analytics: boolean;
    versionControl: boolean;
    socialFeatures: boolean;
    musicTheoryTools: boolean;
    allFeaturesUnlocked: boolean;
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
        
        // Check if user is already logged in via localStorage
        const storedUser = localStorage.getItem('burntbeats_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } catch (e) {
            localStorage.removeItem('burntbeats_user');
          }
        }

        // If no stored user, check if authenticated via API
        const response = await apiRequest('GET', '/api/user');

        if (response.ok) {
          const userData = await response.json();
          console.log('User data fetched:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('burntbeats_user', JSON.stringify(userData));
        } else {
          console.log('User not authenticated, status:', response.status);
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('burntbeats_user');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('burntbeats_user');
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