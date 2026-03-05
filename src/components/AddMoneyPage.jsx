import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiCreditCard } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Axios use karna clean rehta hai
import Sidebar from "./Sidebar";

export default function AddMoneyPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const predefinedAmounts = [50.00, 100.00, 200.00, 500.00];
  const API_BASE_URL = "https://smart-id-pro.onrender.com"; // Backend URL (adjust if needed)
  // Razorpay script load karne ke liye
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleRecharge = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      alert("User not logged in");
      return;
    }

    setLoading(true);

    try {
      // 1. Backend se Order Create karein
      const orderRes = await axios.post("http://127.0.0.1:5000/api/create-order", {
        email: userEmail,
        amount: parseFloat(amount),
      });

      const { id: order_id, currency } = orderRes.data;

      // 2. Razorpay Options Setup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // ⚠️ Apni Key yahan daalein
        amount: amount * 100, // Razorpay paise mein leta hai
        currency: currency,
        name: "SmartID Pro Wallet",
        description: "Add Money to Wallet",
        order_id: order_id,
        handler: async (response) => {
          // 3. Payment Verify karein backend par
          try {
            await axios.post(`${API_BASE_URL}/api/verify-payment`, {
              ...response,
              email: userEmail,
              amount: amount,
            });
            alert("Wallet updated successfully!");
            navigate("/wallet");
          } catch (e) {
            alert("Payment verification failed!");
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.error || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <header className="mb-8">
          <Link to="/wallet" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-2">
            <FiArrowLeft /> Back to Wallet
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Add Money</h1>
          <p className="text-gray-500 mt-1">Select an amount to recharge your wallet.</p>
        </header>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
          <form onSubmit={handleRecharge} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Choose Amount</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-3 rounded-xl border-2 text-lg font-bold transition ${
                      amount === amt
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-200 text-gray-700"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-lg disabled:bg-gray-400"
            >
              {loading ? "Processing..." : <><FiCreditCard size={20} /> Pay ₹{amount || "0"}</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}