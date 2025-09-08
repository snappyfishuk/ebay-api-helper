// src/contexts/AuthContext.tsx - DEBUG VERSION

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, userToken: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      // Debug logs
      console.log('🔍 Auth Check - Token exists:', !!storedToken);
      console.log('🔍 Auth Check - Token length:', storedToken?.length || 0);
      console.log('🔍 Auth Check - API URL:', process.env.REACT_APP_API_URL);
      
      if (!storedToken) {
        console.log('❌ No token found, skipping auth check');
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Making auth verification request...');
        
        // Use the existing /api/auth/me endpoint instead of /verify
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('📡 Auth response status:', response.status);
        console.log('📡 Auth response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Auth successful, user data:', data);
          setUser(data.data.user);
          setToken(storedToken);
        } else {
          console.log('❌ Auth failed, response status:', response.status);
          // Try to get error details
          try {
            const errorData = await response.json();
            console.log('❌ Error details:', errorData);
          } catch (e) {
            console.log('❌ Could not parse error response');
          }
          
          // Token is invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth verification failed with error:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, userToken: string) => {
    console.log('✅ Login called with user:', userData.email);
    console.log('✅ Login token length:', userToken.length);
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
  };

  const logout = async () => {
    console.log('🚪 Logout called');
    try {
      // Call backend logout endpoint
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  };

  const updateUser = (updatedUser: User) => {
    console.log('🔄 User updated:', updatedUser.email);
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};