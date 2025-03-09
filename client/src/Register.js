import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../src/styles/Register.css"; // Import file CSS

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    citizenId: "",
    address: "",  // Đồng nhất với backend
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    console.log("📤 Dữ liệu gửi đi:", formData); // Kiểm tra dữ liệu trước khi gửi

    try {
        const response = await axios.post("http://localhost:5000/register", formData);
        setMessage(response.data.message);
        setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
        setMessage(error.response?.data?.error || "❌ Đăng ký thất bại!");
    }
};

  return (
    <div className="register-container">
      <h2>Đăng ký tài khoản</h2>
      <input
        type="email"
        name="email"
        placeholder="Nhập email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Nhập mật khẩu"
        value={formData.password}
        onChange={handleChange}
      />
      <input
        type="text"
        name="citizenId"
        placeholder="Nhập số căn cước công dân"
        value={formData.citizenId}
        onChange={handleChange}
      />
      <input
        type="text"
        name="address"  // Đổi từ ethereumAddress -> address
        placeholder="Nhập địa chỉ ví Ethereum"
        value={formData.address}
        onChange={handleChange}
      />
      <button onClick={handleRegister}>Đăng ký</button>
      {message && <p className="message">{message}</p>}
      <button className="back-btn" onClick={() => navigate("/login")}>
        Quay lại đăng nhập
      </button>
    </div>
  );
};

export default Register;
