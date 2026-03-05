import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// ✨ App.js se 'onLogin' prop aana chahiye taaki login status update ho sake
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const API_BASE_URL = "https://smart-id-pro.onrender.com/";
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Jab user type kare toh error hata dein
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // 1. Login Endpoint ka use karein (Not /api/stats)
    const response = await fetch(`${API_BASE_URL}/api/login`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Session Data save karein
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("token", data.token); 
      localStorage.setItem("isLoggedIn", "true");

      // ✅ Expiry (2 hours)
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      const expiryTime = new Date().getTime() + twoHoursInMs;
      localStorage.setItem("session_expiry", expiryTime);
      
      // ✨ Confetti Effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b']
      });

      // 🏆 Success Pop-up
      Swal.fire({
        title: `Welcome Back, ${data.user.name || 'User'}!`,
        text: 'Aapka SmartID Pro dashboard ready hai.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        background: '#fff',
        customClass: {
            title: 'text-gray-900 font-bold',
            popup: 'rounded-3xl'
        }
      }).then(() => {
        onLogin(); // App.js ka state update karein
        navigate("/"); // Dashboard par bhejein
      });
    } else {
      // Backend se aaya error message dikhayein
      setError(data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error("Login Error:", err);
    setError("Server not responding. Please try again later.");
  } finally {
    setLoading(false);
  }
};

  
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your SmartID Pro account</p>
        </div>

        {/* 🚨 ERROR MESSAGE BOX */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-5 text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FiMail />
              </span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
  <label className="text-sm font-medium text-gray-700">Password</label>
  <div className="relative mt-1">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
      <FiLock />
    </span>
    
    <input
      type={showPassword ? "text" : "password"} // ✨ Toggle logic
      name="password"
      placeholder="••••••••"
      value={formData.password}
      onChange={handleChange}
      required
      className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:ring-2 focus:ring-indigo-200 outline-none"
    />

    {/* ✨ Eye Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition"
    >
      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
    </button>
  </div>
</div>  
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* 🔘 SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:bg-indigo-400"
          >
            {loading ? <FiLoader className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}