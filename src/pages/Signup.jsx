import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiLoader, FiPhone, FiEye, FiEyeOff } from "react-icons/fi";

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_BASE_URL = "https://smart-id-pro.onrender.com"; // Backend URL (adjust if needed)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 2. API Call to Flask Backend (MongoDB Atlas connection)
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✨ SUCCESS: Redirect to Login
        navigate("/login");
      } else {
        // ❌ ERROR: Show message from backend (e.g., "User already exists")
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Server connection failed. Is your Flask app running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 mt-2 text-sm">Join SmartID Pro to access all services</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-5 text-center font-semibold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase ml-1">Full Name</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiUser /></span>
              <input type="text" name="name" placeholder="Rahul Sharma" value={formData.name} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase ml-1">Email Address</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiMail /></span>
              <input type="email" name="email" placeholder="rahul@example.com" value={formData.email} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
            </div>
          </div>
          
          {/* Phone Field */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase ml-1">Phone Number</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiPhone /></span>
              <input type="tel" name="phone" placeholder="+91 9988776655" value={formData.phone} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase ml-1">Password</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiLock /></span>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600">
                    {showPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase ml-1">Confirm Password</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiLock /></span>
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600">
                    {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
              </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-2 disabled:bg-indigo-400"
          >
            {loading ? <FiLoader className="animate-spin text-xl" /> : "Create Free Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already a member?{" "}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            Sign In Now
          </Link>
        </p>
      </div>
    </div>
  );
}