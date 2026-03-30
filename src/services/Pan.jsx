import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FiUploadCloud, FiTrash2, FiLoader, FiCheckCircle, FiXCircle, FiCreditCard } from "react-icons/fi"; // ✨ Added Icons
import { LuWallet } from "react-icons/lu"; // ✨ Wallet Icon
import Sidebar from "../components/Sidebar";
import { load } from '@cashfreepayments/cashfree-js';

export default function IDForm() {
  const { serviceType } = useParams();
  const [formData, setFormData] = useState({
    id_number: "",
    name: "",
    father_name: "",
    dob: "",
  });

  const [photo, setPhoto] = useState(null);
  const [sign, setSign] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)
  
  // ✨ States for Wallet and Modal
  const [walletBalance, setWalletBalance] = useState(0); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "photo") {
          setPhoto(file);
          setPhotoPreview(reader.result);
        } else {
          setSign(file);
          setSignPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (type) => {
    if (type === "photo") {
      setPhoto(null);
      setPhotoPreview(null);
    } else {
      setSign(null);
      setSignPreview(null);
    }
  };

  // ==========================================
  // ✨ 1. WALLET BALANCE CHECK
  // ==========================================
  const checkBalance = async () => {
    const userEmail = localStorage.getItem("userEmail");
    try {
        const response = await axios.get(`${API_BASE_URL}/api/wallet/balance?email=${userEmail}`);
        setWalletBalance(response.data.balance);
    } catch (error) {
        console.error("Error fetching balance", error);
    }
  };

  // ==========================================
  // ✨ 2. CASHFREE PAYMENT FLOW
  // ==========================================
  const initiateRazorpay = async (orderData) => {
    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, 
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "smartID Pro",
        description: `Payment for ${serviceType.toUpperCase()}`,
        order_id: orderData.id,
        handler: function (response) {
          resolve(response); // Payment Success: returns payment_id, order_id, signature
        },
        prefill: {
          email: localStorage.getItem("userEmail"),
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: function () {
            setLoading(false);
            reject(new Error("Payment cancelled by user"));
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo || !sign) return alert("Photo and Signature required");
    setLoading(true);
    await checkBalance();
    setLoading(false);
    setShowPaymentModal(true);
  };

    // ✨ Modal dikhayein pehle
 

  // ==========================================
  // ✨ 4. FINAL GENERATION (After Payment)
  // ==========================================
const generateID = async (paymentMethod) => {
    const userEmail = localStorage.getItem("userEmail");
    let razorpayResponse = null;

    setLoading(true);
    setShowPaymentModal(false);
    setMessage({ type: "info", text: "Initializing..." });

    try {
      if (paymentMethod === "razorpay") {
        // Step A: Create Order on Backend
        const orderRes = await axios.post(`${API_BASE_URL}/api/create-order`, {
          email: userEmail,
          amount: 15.00 // Rupees
        });
        
        // Step B: Open Razorpay Checkout
        razorpayResponse = await initiateRazorpay(orderRes.data);
      }

      setMessage({ type: "info", text: "Processing. Please wait..." });

      // Step C: Send all data to backend for PDF generation
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append("photo", photo);
      data.append("sign", sign);
      data.append("service_type", serviceType);
      data.append("email", userEmail);
      data.append("payment_method", paymentMethod);
      
      if (razorpayResponse) {
        data.append("razorpay_payment_id", razorpayResponse.razorpay_payment_id);
        data.append("razorpay_order_id", razorpayResponse.razorpay_order_id);
        data.append("razorpay_signature", razorpayResponse.razorpay_signature);
      }

      const response = await axios.post(
        `${API_BASE_URL}/generate-pan`,
        data,
        { responseType: "blob" }
      );

        // Download logic
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${serviceType.toUpperCase()}_ID.pdf`);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);

        setMessage({ type: "success", text: "ID Generated Successfully!" });
        setFormData({ id_number: "", name: "", father_name: "", dob: "" });
        removeFile("photo");
        removeFile("sign");

    } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: error.message || "Failed. Please try again." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-10">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl border border-gray-100 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 capitalize">
            {serviceType} Generator
          </h2>

          {/* STATUS MESSAGE BOX */}
          {message.text && (
            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" 
              : message.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.type === "success" ? <FiCheckCircle size={20} /> 
              : message.type === "info" ? <FiLoader size={20} className="animate-spin" />
              : <FiXCircle size={20} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Inputs */}
              <div className="space-y-4">
                <input type="text" name="id_number" placeholder={`${serviceType.toUpperCase()} Number`} value={formData.id_number} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-200" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-200" />
                <input type="text" name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-200" />
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-200" />
              </div>

              {/* Right Column: Upload Boxes */}
              <div className="flex flex-row gap-4">
                <div className="flex-1">
                  <FileUploadCard label="Upload Photo" preview={photoPreview} onFileChange={(e) => handleFileChange(e, "photo")} onRemove={() => removeFile("photo")} />
                </div>
                <div className="flex-1">
                  <FileUploadCard label="Upload Signature" preview={signPreview} onFileChange={(e) => handleFileChange(e, "sign")} onRemove={() => removeFile("sign")} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition mt-10 flex items-center justify-center gap-2 disabled:bg-indigo-400">
              {loading ? <FiLoader className="animate-spin" /> : null}
              {loading ? "Processing..." : `Generate ${serviceType.toUpperCase()} ID`}
            </button>
          </form>
        </div>
      </main>

      {/* ✨ PAYMENT METHOD MODAL ✨ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
            <p className="text-gray-600 mb-6 text-sm">Amount to pay: **Rs. 15.00**</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => generateID("wallet")}
                disabled={walletBalance < 15.00}
                className="w-full flex items-center justify-between gap-3 p-4 border rounded-xl hover:border-indigo-300 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                    <LuWallet className="text-indigo-600" size={24} />
                    <span className="font-semibold">Pay by Wallet</span>
                </div>
                <span className="text-sm text-gray-500">Bal: Rs.{walletBalance}</span>
              </button>

              {/* <button 
                onClick={() => generateID("razorpay")}
                className="w-full flex items-center gap-3 p-4 border rounded-xl hover:border-indigo-300"
              >
                <FiCreditCard className="text-green-600" size={24} />
                <span className="font-semibold">Pay by(UPI/Card)</span>
              </button> */}
            </div>
            
            <button 
                onClick={() => setShowPaymentModal(false)}
                className="mt-6 w-full text-center text-sm text-gray-500 hover:text-red-500"
            >
                Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// FileUploadCard component (no changes)
function FileUploadCard({ label, preview, onFileChange, onRemove }) {
    return (
      <div className="h-56 border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-indigo-300 transition flex flex-col justify-center items-center overflow-hidden">
        <label className="block text-xs font-medium text-gray-600 mb-3">{label}</label>
        
        {preview ? (
          <div className="relative inline-block">
            <img 
              src={preview} 
              alt="Preview" 
              className={`object-cover shadow-md ${
                label.includes("Photo") ? "h-20 w-20 rounded-full" : "h-20 w-28 rounded-xl"
              }`} 
            />
            <button 
              type="button" 
              onClick={onRemove} 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FiUploadCloud className="text-gray-400 w-8 h-8 mb-2" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={onFileChange} 
              required 
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full" 
            />
          </div>
        )}
      </div>
    );
}