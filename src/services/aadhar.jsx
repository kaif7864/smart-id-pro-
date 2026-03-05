import React, { useState } from "react";
// --- Icons update kiye ---
import { Upload, FileText, User, Calendar, MapPin, Loader2, RefreshCw, Hash, CalendarDays, KeyRound, Save, PlusCircle, CreditCard } from "lucide-react"; 
import { LuWallet } from "react-icons/lu";
import { load } from '@cashfreepayments/cashfree-js';
import axios from "axios"; // axios use kar rahe hain dusre code jese
import Sidebar from "../components/Sidebar";

export default function AadhaarExtractor() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null); 

  // --- Naya states payment aur modal ke liye ---
  const [generating, setGenerating] = useState(false); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setData(null);
  };

  const handleInputChange = (e, field, lang) => {
    const value = e.target.value;
    setData(prev => ({
      ...prev,
      [field]: lang ? { ...prev[field], [lang]: value } : value
    }));
  };

  const handleExtract = async () => {
    if (!file) {
      alert("Please upload a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/extract-aadhaar`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server Error");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
      alert("Extraction failed. Check backend console.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ✨ 1. WALLET BALANCE CHECK
  // ==========================================
  const checkBalance = async () => {
    const userEmail = localStorage.getItem("userEmail"); // Ya context se lein
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
  const initiateCashfree = async () => {
    const userEmail = localStorage.getItem("userEmail");
    
    // A. Backend se Order ID banayein
    const orderResponse = await axios.post(`${API_BASE_URL}/api/create-order`, {
      email: userEmail,
      amount: 50.0 // 💰 Aadhaar generation cost
    }).catch(error => {
      console.error("Order Creation Error:", error.response.data);
      throw new Error("Order creation failed: " + error.response.data.error);
    });

    const paymentSessionId = orderResponse.data.payment_session_id;

    // B. Initialize Cashfree SDK
    const cashfree = await load({
      mode: "sandbox", // ⚠️ Live ke liye "production" karein
    });

    // C. Checkout Open Karein
    let checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_modal",
    };

    return cashfree.checkout(checkoutOptions);
  };

  // ==========================================
  // ✨ 3. SUBMIT (Open Modal)
  // ==========================================
  const handleInitiateGeneration = async () => {
    if (!data) return;
    await checkBalance();
    setShowPaymentModal(true);
  };

  // ==========================================
  // ✨ 4. FINAL GENERATION (After Payment)
  // ==========================================
  const generateAadhaarPDF = async (paymentMethod) => {
    const userEmail = localStorage.getItem("userEmail");
    
    try {
        setGenerating(true);
        setShowPaymentModal(false);
        setMessage({ type: "info", text: `Processing payment via ${paymentMethod}...` });

        // A. Handle Payment Method
        if (paymentMethod === "cf") {
            const paymentResult = await initiateCashfree();
            if (paymentResult.error) {
                throw new Error("Payment Failed or Cancelled");
            }
        } else {
            // Wallet Deduction Logic
            setMessage({ type: "info", text: "Deducting from wallet..." });
        }

        // B. Generate Aadhaar
        setMessage({ type: "info", text: "Payment Successful! Generating PDF..." });

        const formData = new FormData();
        
        // Data structure matching backend requirements
        formData.append("name_english", data.name_english || "");
        formData.append("name_hindi", data.name_hindi || "");
        formData.append("father_english", data.father_english || "");
        formData.append("father_hindi", data.father_hindi || "");
        formData.append("dob", data.dob || "");
        formData.append("gender", data.gender || "");
        formData.append("aadhaar_number", data.aadhaar_number || "");
        formData.append("address_english", data.address_english || "");
        formData.append("address_hindi", data.address_hindi || "");
        formData.append("vid_number", data.vid_number || "");
        formData.append("issued_date", data.issued_date || "");
        formData.append("details_as_on", data.details_as_on || "");
        
        formData.append("email", userEmail); 
        formData.append("payment_method", paymentMethod);

        // Photo handling: Base64 to Blob
        if (data.photo_base64) {
            const base64Response = await fetch(`data:image/png;base64,${data.photo_base64}`);
            const blob = await base64Response.blob();
            formData.append("photo", blob, "photo.png");
        }

        const response = await axios.post(
            `${API_BASE_URL}/generate-aadhaar`,
            formData,
            { responseType: "blob" } // 📥 PDF download ke liye important
        );

        // Download logic
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `aadhaar_${data.aadhaar_number || 'new'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        setMessage({ type: "success", text: "Aadhaar Generated Successfully!" });

    } catch (error) {
        console.error("Error:", error);
        setMessage({ type: "error", text: error.message || "Generation failed." });
    } finally {
        setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex overflow-hidden">
        <Sidebar/>
        <main className="flex-1 overflow-y-auto h-screen p-4 md:p-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <FileText size={28} /> Aadhaar Detail Extractor
          </h2>
          <p className="text-indigo-100 mt-1 text-sm text-opacity-80">
            Upload PDF to extract, edit and generate new Aadhaar
          </p>
        </div>

        <div className="p-8">
          {/* Status Message Box */}
          {message.text && (
            <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" 
              : message.type === "info" ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}

          {/* File Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Aadhaar PDF</label>
            <div className="relative group border-2 border-dashed border-slate-300 rounded-xl p-6 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center">
              <Upload className="text-slate-400 mb-2 group-hover:text-indigo-500 transition-colors" size={32} />
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-sm text-slate-600 font-medium">
                {file ? file.name : "Click to browse or drag and drop"}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleExtract} 
            disabled={loading || !file}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 ${
              loading || !file 
                ? "bg-slate-400 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {loading ? (
              <><Loader2 className="animate-spin" /> Extracting Data...</>
            ) : (
              "Start Extraction"
            )}
          </button>

          {/* Results Display */}
          {data && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-3">
                  Edit Extracted Details
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {setFile(null); setData(null);}}
                        className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                    >
                        <RefreshCw size={14} /> Clear All
                    </button>
                </div>
              </div>

              {/* Grid for Editable Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <EditableDetailCard icon={<User size={18}/>} label="Full Name" eng={data.name_english} hin={data.name_hindi} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'name_english', lang)} />
                <EditableDetailCard icon={<User size={18}/>} label="Father's Name" eng={data.father_english} hin={data.father_hindi} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'father_english', lang)} />
                <EditableDetailCard icon={<User size={18}/>} label="Gender" eng={data.gender} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'gender')} />
                
                <EditableDetailCard icon={<Calendar size={18}/>} label="Date of Birth" eng={data.dob} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'dob')} />
                <EditableDetailCard icon={<Hash size={18}/>} label="Aadhaar Number" eng={data.aadhaar_number} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'aadhaar_number')} />
                <EditableDetailCard icon={<KeyRound size={18}/>} label="Virtual ID (VID)" eng={data.vid_number} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'vid_number')} />
                
                <EditableDetailCard icon={<CalendarDays size={18}/>} label="Issue Date" eng={data.issued_date} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'issued_date')} />
                <EditableDetailCard icon={<CalendarDays size={18}/>} label="Details As On" eng={data.details_as_on} onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'details_as_on')} />
                
                <div className="lg:col-span-3">
                  <EditableDetailCard icon={<MapPin size={18}/>} label="Full Address" eng={data.address_english} hin={data.address_hindi} isFull onEdit={(lang, val) => handleInputChange({target:{value:val}}, 'address_english', lang)} />
                </div>
              </div>

              {/* Image Display Section */}
              <div className="flex gap-4 p-4 bg-slate-100 rounded-xl border border-slate-200 mb-6">
                {data.qr_base64 && (
                    <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Photo / QR</p>
                        <img src={`data:image/png;base64,${data.qr_base64}`} alt="QR Code" className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow"/>
                    </div>
                )}
              </div>

              {/* --- GENERATE UID BUTTON (Triggers Modal) --- */}
              <button 
                onClick={handleInitiateGeneration}
                disabled={generating}
                className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    generating 
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : "text-indigo-700 bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                {generating ? (
                    <><Loader2 className="animate-spin" /> Processing...</>
                ) : (
                    <><PlusCircle size={20} /> Generate New UID</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      </main>

      {/* ✨ PAYMENT METHOD MODAL (Copy from IDForm) ✨ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
            <p className="text-gray-600 mb-6 text-sm">Amount to pay: **Rs. 50.0**</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => generateAadhaarPDF("wallet")}
                disabled={walletBalance < 50.0}
                className="w-full flex items-center justify-between gap-3 p-4 border rounded-xl hover:border-indigo-300 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                    <LuWallet className="text-indigo-600" size={24} />
                    <span className="font-semibold">Pay by Wallet</span>
                </div>
                <span className="text-sm text-gray-500">Bal: Rs.{walletBalance}</span>
              </button>

              <button 
                onClick={() => generateAadhaarPDF("cf")}
                className="w-full flex items-center gap-3 p-4 border rounded-xl hover:border-indigo-300"
              >
                <CreditCard className="text-green-600" size={24} />
                <span className="font-semibold">Pay by Cashfree (UPI/Card)</span>
              </button>
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

// Editable Helper Component (No Changes)
function EditableDetailCard({ icon, label, eng, hin, onEdit, isFull }) {
  return (
    <div className={`bg-slate-50 border border-slate-200 p-4 rounded-xl transition-hover hover:shadow-md ${isFull ? "lg:col-span-3" : ""}`}>
      <div className="flex items-center gap-2 text-indigo-600 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="space-y-2">
        <input 
            type="text"
            value={eng || ""}
            onChange={(e) => onEdit('english', e.target.value)}
            className="w-full text-slate-800 font-medium text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
            placeholder="English"
        />
        {hin !== undefined && (
            <input 
                type="text"
                value={hin || ""}
                onChange={(e) => onEdit('hindi', e.target.value)}
                className="w-full text-slate-600 font-hindi text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500"
                placeholder="Hindi"
            />
        )}
      </div>
    </div>
  );
}