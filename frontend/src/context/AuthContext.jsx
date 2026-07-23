import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      const token = sessionStorage.getItem('token');
      if (token) {
        setAuthToken(token);
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    try {
      const response = await api.login({
        login_id: loginId,
        password: password
      });
      
      const userData = {
        login_id: response.login_id,
        employee_name: response.employee_name,
        rank: response.rank,
        permissions: response.permissions,
        hierarchy: response.hierarchy
      };
      
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', response.access_token);
      
      // Set auth header for future requests
      setAuthToken(response.access_token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setAuthToken(null);
  };

  const hasPermission = (action) => {
    if (!user) return false;
    
    // Check based on hierarchy rules defined in backend for MVP
    const hierarchy_req = {
        "register_fir": 7, 
        "approve_alert_action": 6, 
        "dismiss_alert": 6
    };
    
    if (hierarchy_req[action] !== undefined) {
      return user.hierarchy <= hierarchy_req[action];
    }
    
    return user.permissions?.includes(action) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
