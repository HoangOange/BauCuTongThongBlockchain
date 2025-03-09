import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import VotingPage from "./VotingPage"; // Sử dụng VotingPage làm trang chính
import AdminPage from "./AdminPage"; // Thêm import

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<VotingPage />} />  {/* Trang chính */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />\
      <Route path="/voting" element={<VotingPage />} />
      <Route path="/admin" element={<AdminPage />} /> {/* Route Admin */}

    </Routes>
  );
}

export default App;
