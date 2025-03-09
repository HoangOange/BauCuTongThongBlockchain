import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Blockchain Voting System</h1>
      <p>Secure and transparent presidential elections</p>
      
      <div className="button-group">
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/register")}>Register</button>
      </div>
    </div>
  );
};

export default Home;
