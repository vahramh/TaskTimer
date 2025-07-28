import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../services/auth'; // Update path if needed

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresNewPassword?: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  refreshAuth: () => Promise<void>;
  setNewPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated with valid tokens
        const isValidAuth = await AuthService.isAuthenticated();
        
        if (isValidAuth) {
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        // Verify authentication is valid after successful signin
        const isValidAuth = await AuthService.isAuthenticated();
        
        if (isValidAuth) {
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            return { success: false, error: 'Failed to get user data after login' };
          }
        } else {
          return { success: false, error: 'Authentication validation failed' };
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const setNewPassword = async (newPassword: string) => {
    try {
      const result = await AuthService.setNewPassword(newPassword);
      
      if (result.success) {
        // Verify authentication after password change
        const isValidAuth = await AuthService.isAuthenticated();
        
        if (isValidAuth) {
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            return { success: false, error: 'Failed to get user data after password change' };
          }
        } else {
          return { success: false, error: 'Authentication validation failed after password change' };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Set new password failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set new password'
      };
    }
  };

  const refreshAuth = async () => {
    try {
      const isValidAuth = await AuthService.isAuthenticated();
      
      if (isValidAuth) {
        const currentUser = await AuthService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const isAdmin = (): boolean => {
    return user?.attributes?.['custom:role'] === 'admin';
  };

  const hasRole = (role: string): boolean => {
    const userRole = user?.attributes?.['custom:role'];
    return userRole === role || userRole === 'admin';
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    hasRole,
    refreshAuth,
    setNewPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}