import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  // ✅ REGISTER
  const register = async (name, email, password, phone) => {
    try {
      const res = await axios.post("/api/auth/register", {
        name,
        email,
        password,
        phone,
      });

      console.log("REGISTER RESPONSE:", res.data);

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem("token", res.data.token);

      return res.data;

    } catch (error) {
      console.error("REGISTER ERROR:", error);
      throw error;
    }
  };

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem("token", res.data.token);

      return res.data;

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      throw error;
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  // ✅ IMPORTANT: inside function only
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook
export const useAuth = () => {
  return useContext(AuthContext);
};
