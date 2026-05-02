import axios from 'axios';

// ✅ Your actual backend URL
const API_URL = "https://backend-1-dtbl.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// ==============================
// 🔐 Attach JWT token
// ==============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 REQUEST:", config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// 📥 Handle responses
// ==============================
api.interceptors.response.use(
  (response) => {
    console.log("✅ RESPONSE:", response.data);
    return response;
  },
  (error) => {
    console.error("🔴 ERROR RESPONSE:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
