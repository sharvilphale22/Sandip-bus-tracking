import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

// ✅ IMPORTANT: set backend URL
const API = axios.create({
  baseURL: "https://backend-1-dtbl.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  // =========================
  // ✅ REGISTER
  // =========================
  const register = async (name, email, password, phone) => {
    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });

      console.log("🔥 REGISTER RESPONSE:", res.data);

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      return res.data;

    } catch (error) {
      console.error("🔴 REGISTER ERROR:", error.response?.data || error.message);
      throw error;
    }
  };

  // =========================
  // ✅ LOGIN
  // =========================
  const login = async (email, password) => {
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      console.log("🔥 LOGIN RESPONSE:", res.data);

      if (!res.data.success) {
        throw new Error(res.data.message);
      }

      setUser(res.data.user);
      setToken(res.data.token);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      return res.data;

    } catch (error) {
      console.error("🔴 LOGIN ERROR:", error.response?.data || error.message);
      throw error;
    }
  };

  // =========================
  // ✅ LOGOUT
  // =========================
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // =========================
  // ✅ AUTH CHECK
  // =========================
  const isAuthenticated = !!token;

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
