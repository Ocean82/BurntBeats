import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  plan: "free" | "pro";
  songsThisMonth: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("bangergpt_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("bangergpt_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bangergpt_user");
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("bangergpt_user", JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isLoading,
  };
}