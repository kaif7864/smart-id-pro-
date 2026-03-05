import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiPlus, FiClock, FiUser, FiFileText, FiPlusCircle } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";

export default function Sidebar() {
  const location = useLocation();
  const [balance, setBalance] = useState("0.00"); // ✨ State for balance
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)
  // ✨ API se balance fetch karein
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // 🔥 Testing ke liye temporary email hardcode kiya hai.
        // Production me token se user id nikalni chahiye.
        const email = localStorage.getItem("userEmail");
        const response = await fetch(`${API_BASE_URL}/api/wallet/balance?email=${email}`);
        const data = await response.json();
        
        if (response.ok) {
          setBalance(data.balance.toFixed(2));
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  return (
    <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <FiPlus className="text-white w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">SmartID Pro</h2>
      </div>
      
      <nav className="space-y-2 flex-1">
        <Link to="/"><NavItem icon={<FiClock />} label="Dashboard" active={location.pathname === "/"} /></Link>
        <Link to="/profile"><NavItem icon={<FiUser />} label="My Profile" active={location.pathname === "/profile"} /></Link>
        <Link to="/print-list"><NavItem icon={<FiFileText />} label="Print List" active={location.pathname === "/print-list"} /></Link>
        
        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billing</p>
          <Link to="/wallet"><NavItem icon={<LuWallet />} label="Wallet" active={location.pathname === "/wallet"} /></Link>
          <Link to="/add-money"><NavItem icon={<FiPlusCircle />} label="Add Money" active={location.pathname === "/add-money"} /></Link>
        </div>
      </nav>

      {/* --- WALLET BALANCE CARD --- */}
      <div className="mt-auto bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
        <p className="text-xs text-indigo-100 font-medium opacity-80">Available Balance</p>
        
        {/* ✨ Balance dikhayein ya loading state */}
        <h3 className="text-2xl font-bold mt-1">
          {loading ? "..." : `₹ ${balance}`}
        </h3>

        <Link to="/add-money" className="block text-center mt-4 w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-semibold transition">
          Recharge Now
        </Link>
      </div>
    </aside>
  );
}

// NavItem Component (Wahi rahega)
function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}