import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  plan: string;
  songsGenerated: number;
  maxSongs: number;
  songsThisMonth: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Check if user is authenticated on app start
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (error) {
      setUser(null);
    }
  }, [userData, error]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Login failed");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to Burnt Beats",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { username, email, password });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast({
        title: "Welcome to Burnt Beats!",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
      toast({
        title: "Goodbye!",
        description: "Successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check username availability
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const response = await apiRequest("GET", `/api/auth/check-username/${username}`);
      if (response.ok) {
        const data = await response.json();
        return data.available;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (username: string, email: string, password: string) => {
    await registerMutation.mutateAsync({ username, email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkUsernameAvailability,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}