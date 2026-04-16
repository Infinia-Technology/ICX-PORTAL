import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('icx_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('icx_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('icx_user', JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem('icx_token');
        localStorage.removeItem('icx_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('icx_token', token);
    localStorage.setItem('icx_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('icx_token');
    localStorage.removeItem('icx_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((data) => {
    setUser(data);
    localStorage.setItem('icx_user', JSON.stringify(data));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
