import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('ssp_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('ssp_token');
      if (!savedToken) { setLoading(false); return; }
      try {
        const res = await authService.getProfile();
        setUser(res.data.data);
      } catch {
        localStorage.removeItem('ssp_token');
        localStorage.removeItem('ssp_user');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('ssp_token', newToken);
    localStorage.setItem('ssp_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('ssp_token', newToken);
    localStorage.setItem('ssp_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ssp_token');
    localStorage.removeItem('ssp_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ssp_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, updateUser,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
