import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';
import { extractData, getStoredUser } from '../utils/apiHelpers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access'));

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      const profile = extractData(response) || response.data;
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const saveAuthData = (data) => {
    const payload = data?.data || data;
    const access = payload.access;
    const refresh = payload.refresh;
    const userData = payload.user;

    if (access) localStorage.setItem('access', access);
    if (refresh) localStorage.setItem('refresh', refresh);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    setIsAuthenticated(true);
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      saveAuthData(response.data);
      if (!response.data.user && !response.data.data?.user) {
        await fetchProfile();
      } else {
        setLoading(false);
      }
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Invalid email or password.';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const payload = response.data;
      if (payload.access && payload.refresh) {
        saveAuthData(payload);
        return { success: true, autoLogin: true, message: payload.message };
      }
      return {
        success: true,
        autoLogin: false,
        message: payload.message || 'Registration successful',
      };
    } catch (error) {
      const errors = error.response?.data || {};
      let errorMsg = errors.message || 'Registration failed.';
      if (errors.email) errorMsg = `Email: ${errors.email.join?.(' ') || errors.email}`;
      else if (errors.password) errorMsg = `Password: ${errors.password.join?.(' ') || errors.password}`;
      else if (errors.detail) errorMsg = errors.detail;
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      const updated = extractData(response) || response.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Failed to update profile';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
