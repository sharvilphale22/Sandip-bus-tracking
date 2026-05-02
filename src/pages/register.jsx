import { useState } from "react";
import api from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);

  // ==============================
  // Handle input change
  // ==============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ==============================
  // Handle form submit
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      console.log("🚀 Sending data:", formData);

      const res = await api.post("/auth/register", formData);

      console.log("✅ FULL RESPONSE:", res);
      console.log("✅ DATA:", res.data);

      // Safety check
      if (!res || !res.data) {
        throw new Error("No response from server");
      }

      if (!res.data.success) {
        throw new Error(res.data.message || "Registration failed");
      }

      // ==============================
      // Save data
      // ==============================
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("✅ Registration Successful");

      // redirect safely
      window.location.replace("/login");

    } catch (error) {
      console.error("🔴 REGISTER ERROR:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";

      alert(`❌ ${message}`);

    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Register</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

// ==============================
// Styles
// ==============================
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f5f5f5"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "320px",
    padding: "20px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  }
};

export default Register;
