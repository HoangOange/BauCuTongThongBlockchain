import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../src/styles/Login.css"; // Đường dẫn file CSS có thể thay đổi tùy cấu trúc dự án

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset lỗi trước khi gửi request
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // Lưu token vào localStorage
        navigate("/voting"); // Chuyển hướng đến trang bầu cử
      } else {
        setError(data.message || "Đăng nhập thất bại! Vui lòng kiểm tra lại.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Lỗi kết nối đến server! Hãy thử lại sau.");
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Đăng nhập</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="login-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange}
            className="login-input"
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <a href="/register" className="login-link">
            Chưa có tài khoản? Đăng ký ngay
          </a>
        </form>
      </div>
    </div>
  );
};

export default Login;
