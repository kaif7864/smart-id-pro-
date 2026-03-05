import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlusCircle, FiSearch, FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import Sidebar from "./Sidebar";

export default function WalletPage() {
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        const balanceResponse = await fetch(`${API_BASE_URL}/api/wallet/balance?email=${email}`);
        const balanceData = await balanceResponse.json();
        if (balanceResponse.ok) setBalance(balanceData.balance);

        const txnsResponse = await fetch(`${API_BASE_URL}/api/wallet/transactions?email=${email}`);
        const txnsData = await txnsResponse.json();
        if (txnsResponse.ok) setTransactions(txnsData);

      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Wallet</h1>
            <p className="text-gray-500 mt-1">Manage your balance and view transactions.</p>
          </div>
          
          <Link to="/add-money" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 shadow-sm">
            <FiPlusCircle size={18} />
            Add Money
          </Link>
        </header>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-indigo-200 mb-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 font-medium opacity-80">Available Balance</p>
              <h3 className="text-5xl font-bold mt-2">
                {loading ? "..." : `₹ ${balance.toFixed(2)}`}
              </h3>
            </div>
            <LuWallet className="text-white/30 w-16 h-16" />
          </div>
          <div className="mt-8 flex gap-3">
             <Link to="/add-money" className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl text-sm font-semibold transition">
               Recharge Now
             </Link>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center gap-4 flex-wrap">
            <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search transactions..."
                className="border border-gray-200 rounded-xl py-2 pl-9 pr-4 w-full md:w-64 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 text-gray-500">No transactions yet.</td></tr>
                ) : transactions.map((txn) => {
                  const isCredit = txn.amount > 0;
                  return (
                    <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700 font-medium">#{txn._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {isCredit ? (
                            <div className="bg-emerald-100 p-2 rounded-lg">
                              <FiArrowDownLeft className="text-emerald-600" size={16} />
                            </div>
                          ) : (
                            <div className="bg-red-100 p-2 rounded-lg">
                              <FiArrowUpRight className="text-red-600" size={16} />
                            </div>
                          )}
                          <div>
                            <span className="text-gray-800 font-semibold block">{txn.type}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{isCredit ? "Wallet Topup" : "Service Payment"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="font-medium text-gray-700">{new Date(txn.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold text-base ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                        {isCredit ? "+" : "-"} ₹{Math.abs(txn.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}