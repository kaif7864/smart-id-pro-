import React, { useState } from 'react';
import axios from 'axios';
import { FiFileText, FiUser, FiCalendar, FiHash, FiLoader, FiDownload, FiCreditCard, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import Sidebar from '../../components/Sidebar';
import ProtectedService from '../../components/ProtectedService';

function MarksheetForm() {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        serial_number: '',
        roll_number: '',
    });
    
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)

    // 1. Razorpay SDK Loader
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (message.text) setMessage({ type: "", text: "" });
    };

    const checkBalance = async () => {
        const userEmail = localStorage.getItem("userEmail");
        try {
            const response = await axios.get(`${API_BASE_URL}/api/wallet/balance?email=${userEmail}`);
            setWalletBalance(response.data.balance);
        } catch (error) {
            console.error("Error fetching balance", error);
        }
    };

    // 2. Razorpay Online Payment Flow
    const initiateRazorpay = async (orderData) => {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            alert("Razorpay SDK failed to load. Check your internet connection.");
            return;
        }

        return new Promise((resolve, reject) => {
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY, // Apni Key Yahan Rakhein
                amount: orderData.amount,
                currency: "INR",
                name: "SmartID Pro",
                description: "Payment for Marksheet Generation",
                order_id: orderData.id,
                handler: function (response) {
                    resolve(response); // Success: returns payment_id, order_id, signature
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
        setLoading(true);
        await checkBalance();
        setLoading(false);
        setShowPaymentModal(true);
    };

    const generateID = async (paymentMethod) => {
        const userEmail = localStorage.getItem("userEmail");
        let razorpayResponse = null;
        
        try {
            setLoading(true);
            setShowPaymentModal(false);
            setMessage({ type: "info", text: `Initializing ${paymentMethod === 'razorpay' ? 'Online' : 'Wallet'} payment...` });

            if (paymentMethod === "razorpay") {
                // Backend se order create karwayein
                const orderResponse = await axios.post(`${API_BASE_URL}/api/create-order`, {
                    email: userEmail,
                    amount: 65.00 // 💰 Cost
                });
                
                // Razorpay Popup kholein
                razorpayResponse = await initiateRazorpay(orderResponse.data);
            }

            setMessage({ type: "info", text: "Payment Verified! Generating Marksheet..." });

            const dataToSubmit = { 
                ...formData, 
                email: userEmail, 
                payment_method: paymentMethod 
            };

            // Agar Razorpay se pay kiya hai to verification details add karein
            if (razorpayResponse) {
                dataToSubmit.razorpay_payment_id = razorpayResponse.razorpay_payment_id;
                dataToSubmit.razorpay_order_id = razorpayResponse.razorpay_order_id;
                dataToSubmit.razorpay_signature = razorpayResponse.razorpay_signature;
            }

            const response = await axios.post(
                `${API_BASE_URL}/generate-marksheet`,
                dataToSubmit,
                { responseType: "blob" }
            );

            // Download Logic
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${formData.name}_marksheet.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage({ type: "success", text: "Marksheet Generated Successfully!" });
            setFormData({ name: '', dob: '', serial_number: '', roll_number: '' });

        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: error.message || "Process Failed." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedService>
            <div className="min-h-screen bg-[#f3f4f6] flex">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-lg">
                        <div className="text-center mb-8">
                            <FiFileText className="mx-auto text-4xl text-indigo-600 bg-indigo-50 p-3 rounded-2xl" />
                            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Generate Marksheet</h1>
                            <p className="text-gray-500 mt-2">Enter student details for report card</p>
                        </div>

                        {message.text && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium ${
                                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" 
                                : message.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {message.type === "info" ? <FiLoader className="animate-spin" /> : message.type === "success" ? <FiCheckCircle /> : <FiXCircle />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Student Name</label>
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiUser /></span>
                                    <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiCalendar /></span>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Serial No.</label>
                                    <div className="relative mt-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiHash /></span>
                                        <input type="text" name="serial_number" placeholder="SN1001" value={formData.serial_number} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Roll No.</label>
                                    <div className="relative mt-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FiHash /></span>
                                        <input type="text" name="roll_number" placeholder="RN5001" value={formData.roll_number} onChange={handleChange} required className="w-full border border-gray-200 rounded-xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 mt-6 disabled:bg-gray-400">
                                {loading ? <FiLoader className="animate-spin" /> : <><FiDownload /> Proceed to Pay & Generate</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ✨ PAYMENT METHOD MODAL ✨ */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900">Payment Option</h3>
                            <p className="text-gray-500 mb-6 text-sm">Service Cost: <span className="font-bold text-indigo-600">Rs. 65.00</span></p>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => generateID("wallet")}
                                    disabled={walletBalance < 65.00}
                                    className="w-full flex items-center justify-between gap-3 p-4 border-2 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <LuWallet className="text-indigo-600" size={24} />
                                        <span className="font-bold text-gray-800">Wallet</span>
                                    </div>
                                    <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-lg">Bal: ₹{walletBalance}</span>
                                </button>

                                {/* <button 
                                    onClick={() => generateID("razorpay")}
                                    className="w-full flex items-center gap-3 p-4 border-2 rounded-2xl hover:border-green-500 hover:bg-green-50 transition"
                                >
                                    <FiCreditCard className="text-green-600" size={24} />
                                    <span className="font-bold text-gray-800">Online (Razorpay)</span>
                                </button> */}
                            </div>
                            
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                className="mt-8 w-full text-center font-semibold text-gray-400 hover:text-red-500 transition"
                            >
                                Cancel Process
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedService>
    );
}

export default MarksheetForm;