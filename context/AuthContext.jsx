import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('sbt_token');
    const savedUser = localStorage.getItem('sbt_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      connectSocket(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    const res = await api.post('/auth/login', { loginId, password });
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem('sbt_token', newToken);
    localStorage.setItem('sbt_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    connectSocket(newToken);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('sbt_token');
    localStorage.removeItem('sbt_user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
