import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import { contractAddress, CONTRACT_ABI } from "./contractConfig"; // Import config

const VotingPage = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Thêm state để hiển thị lỗi

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem("token");
      const currentPath = window.location.pathname;
  
      if (!token && currentPath !== "/admin") {
        console.log("⚠️ Chưa đăng nhập, chuyển hướng về /login");
        navigate("/login");
      } else {
        console.log("✅ Đã đăng nhập hoặc đang ở trang /admin, kết nối MetaMask...");
        await connectWallet();
      }
    };
  
    checkLoginStatus();
  }, [navigate]);

  // Kết nối MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("⚠️ Vui lòng cài đặt MetaMask!");
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      console.log("🔗 Ví kết nối:", accounts[0]);

      const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
      const candidatesList = await contract.methods.getCandidateList().call();
      setCandidates(candidatesList);
    } catch (error) {
      console.error("❌ Lỗi kết nối MetaMask:", error);
      setError("❌ Không thể kết nối MetaMask. Vui lòng thử lại!");
    }
  };

  // Bỏ phiếu
  const castVote = async () => {
    if (!selectedCandidate) {
      alert("⚠️ Vui lòng chọn ứng viên!");
      return;
    }

    setLoading(true);
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);

      await contract.methods.castVote(selectedCandidate).send({ from: account });

      alert("✅ Bỏ phiếu thành công!");
      console.log(`🎉 Đã bỏ phiếu cho: ${selectedCandidate}`);
    } catch (error) {
      console.error("❌ Lỗi khi bỏ phiếu:", error);
      alert("❌ Bỏ phiếu thất bại.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-900 text-white">
      <h1 className="text-3xl font-bold mb-4">🗳️ Bầu Cử</h1>

      {error && <p className="text-red-400">{error}</p>}

      <p className="text-lg">Ví của bạn: <span className="font-semibold">{account || "Chưa kết nối"}</span></p>

      <div className="mb-4">
        <label className="text-lg font-semibold">Chọn ứng viên:</label>
        <select 
          className="mt-2 p-2 rounded text-black"
          value={selectedCandidate} 
          onChange={(e) => setSelectedCandidate(e.target.value)}
        >
          <option value="">-- Chọn ứng viên --</option>
          {candidates.map((candidate, index) => (
            <option key={index} value={candidate}>{candidate}</option>
          ))}
        </select>
      </div>

      <button 
        className={`px-6 py-3 ${loading ? "bg-gray-500" : "bg-green-500 hover:bg-green-600"} text-white font-semibold rounded-lg shadow-md transition`} 
        onClick={castVote}
        disabled={loading}
      >
        {loading ? "Đang bỏ phiếu..." : "Bỏ phiếu"}
      </button>

      <button 
        className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default VotingPage;
