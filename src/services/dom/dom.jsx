import React, { useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // useNavigate add kiya
import Keyboard from "react-simple-keyboard";
import Draggable from "react-draggable"; 
import { ResizableBox } from "react-resizable";
import "react-simple-keyboard/build/css/index.css";
import "react-resizable/css/styles.css";

// Icons
import { FiTrash2, FiLoader, FiCheckCircle, FiCreditCard } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import { User, MapPin, Hash, Camera, Keyboard as KeyboardIcon, X, GripHorizontal, Home, ArrowLeft } from "lucide-react";

// Components
import Sidebar from "../../components/Sidebar";
import ProtectedService from "../../components/ProtectedService";

const BASE_URL = "https://smart-id-pro.onrender.com";

export default function HindiIDForm() {
  const { serviceType } = useParams();
  const navigate = useNavigate(); // Navigation handle karne ke liye
  const serviceLabel = serviceType || "ID";

  const [formData, setFormData] = useState({
    name: "", fatherName: "", state: "", district: "", 
    tehsil: "", street: "", address: "", idNumber: "", date: ""
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [inputName, setInputName] = useState("name");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboard = useRef();
  const nodeRef = useRef(null);

  const [walletBalance, setWalletBalance] = useState(0); 
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (showKeyboard && keyboard.current) {
      keyboard.current.setInput(value);
    }
  };

  const onKeyboardChange = (input) => {
    setFormData(prev => ({ ...prev, [inputName]: input }));
  };

  const onFocus = (name) => {
    setInputName(name);
    if (keyboard.current) {
      keyboard.current.setInput(formData[name] || "");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const checkBalance = async () => {
    const userEmail = localStorage.getItem("userEmail");
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance?email=${userEmail}`);
      setWalletBalance(response.data.balance || 0);
    } catch (error) {
      console.error("Error fetching balance", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) return alert("कृपया फोटो अपलोड करें");
    setLoading(true);
    await checkBalance();
    setLoading(false);
    setShowPaymentModal(true);
  };

  const generateID = async (paymentMethod) => {
  const userEmail = localStorage.getItem("userEmail");
  setLoading(true);
  setShowPaymentModal(false);

  try {
    const data = new FormData();
    
    // PAN Card ki tarah har field ko individually add karein
    if (photo) data.append("files", photo); // Backend 'files' dhoond raha hai
    data.append("email", userEmail);
    data.append("payment_method", paymentMethod);
    data.append("name", formData.name);
    data.append("fatherName", formData.fatherName);
    data.append("idNumber", formData.idNumber);
    data.append("state", formData.state);
    data.append("district", formData.district);
    data.append("tehsil", formData.tehsil);
    data.append("date", formData.date);
    data.append("address", formData.address);

    const response = await axios.post(`${BASE_URL}/dom`, data, {
      responseType: 'blob' // File download ke liye zaroori
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Hindi_ID.jpg');
    document.body.appendChild(link);
    link.click();

    setMessage({ type: "success", text: "आईडी सफलतापूर्वक बन गई! ✅" });
  } catch (error) {
    setMessage({ type: "error", text: "सर्वर त्रुटि" });
  } finally {
    setLoading(false);
  }
};


  return (
    <ProtectedService>
    <div className="min-h-screen bg-[#f3f4f6] flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 relative">
        
        {/* Navigation Header */}
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold transition-all bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} /> वापस जाएँ
          </button>
          
          <div className="hidden md:block">
            <span className="text-xs font-bold text-gray-400 bg-gray-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Service: {serviceLabel}
            </span>
          </div>
        </div>

        {/* Floating Keyboard Toggle */}
        <button 
          onClick={() => setShowKeyboard(!showKeyboard)}
          className={`fixed bottom-8 right-8 z-[5000] p-5 rounded-full shadow-2xl transition-all ${showKeyboard ? 'bg-red-500 scale-110' : 'bg-indigo-600'} text-white hover:scale-110 active:scale-95`}
        >
          {showKeyboard ? <X size={28} /> : <KeyboardIcon size={28} />}
        </button>

        <div className="bg-white shadow-xl rounded-3xl p-6 md:p-10 w-full max-w-5xl border border-gray-100 mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 capitalize">{serviceLabel} हिंदी फॉर्म</h2>
            <div className="h-1 w-20 bg-indigo-600 mx-auto mt-2 rounded-full"></div>
          </div>

          {message.text && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl mb-8 text-sm font-bold ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {message.type === "success" ? <FiCheckCircle size={20} /> : <FiLoader size={20} className="animate-spin" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Basics */}
            <div className="space-y-5">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">व्यक्तिगत जानकारी</h4>
              <div className="relative">
                <User className="absolute left-4 top-[38px] text-gray-400" size={18} />
                <label className="text-xs font-bold text-gray-500 ml-1">आवेदक का नाम</label>
                <input name="name" value={formData.name} placeholder="नाम दर्ज करें" className="form-input-styled mt-1" onFocus={() => onFocus("name")} onChange={handleChange} required />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-[38px] text-gray-400" size={18} />
                <label className="text-xs font-bold text-gray-500 ml-1">पिता/पति का नाम</label>
                <input name="fatherName" value={formData.fatherName} placeholder="पिता का नाम" className="form-input-styled mt-1" onFocus={() => onFocus("fatherName")} onChange={handleChange} required />
              </div>
              <div className="relative">
                <Hash className="absolute left-4 top-[38px] text-gray-400" size={18} />
                <label className="text-xs font-bold text-gray-500 ml-1">आईडी नंबर</label>
                <input name="idNumber" value={formData.idNumber} placeholder="ID Number" className="form-input-styled mt-1" onFocus={() => onFocus("idNumber")} onChange={handleChange} required />
              </div>
            </div>

            {/* Column 2: Location */}
            <div className="space-y-5">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">पता और विवरण</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">एरिया </label>
                  <input name="state" value={formData.state} placeholder="एरिया " className="form-input-styled !pl-4 mt-1" onFocus={() => onFocus("state")} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">ज़िला</label>
                  <input name="district" value={formData.district} placeholder="ज़िला" className="form-input-styled !pl-4 mt-1" onFocus={() => onFocus("district")} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">तहसील</label>
                  <input name="tehsil" value={formData.tehsil} placeholder="तहसील" className="form-input-styled !pl-4 mt-1" onFocus={() => onFocus("tehsil")} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">दिनांक</label>
                  <input name="date" type="date" value={formData.date} placeholder="DD/MM/YYYY" className="form-input-styled !pl-4 mt-1" onFocus={() => onFocus("date")} onChange={handleChange} required />
                </div>
              </div>
              <div className="relative">
                <Home className="absolute left-4 top-[38px] text-gray-400" size={18} />
                <label className="text-xs font-bold text-gray-500 ml-1">पूरा पता</label>
                <textarea name="address" value={formData.address} placeholder="गली, मोहल्ला, मकान नंबर..." className="form-input-styled mt-1 !h-24 !pt-3" onFocus={() => onFocus("address")} onChange={handleChange} required />
              </div>
            </div>

            {/* Column 3: Media & Action */}
            <div className="space-y-5">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">मीडिया</h4>
              <div className="h-48 border-2 border-dashed border-gray-200 rounded-3xl p-4 bg-gray-50 flex flex-col items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden group">
                {photoPreview ? (
                  <div className="text-center">
                    <img src={photoPreview} alt="Preview" className="h-28 w-28 rounded-2xl object-cover shadow-lg mb-3 mx-auto" />
                    <button type="button" onClick={() => {setPhoto(null); setPhotoPreview(null)}} className="text-red-500 flex items-center gap-1 text-xs font-bold mx-auto bg-white px-3 py-1 rounded-full shadow-sm">
                      <FiTrash2/> हटाएँ
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="text-indigo-500" size={32} />
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <p className="text-gray-500 text-[11px] font-bold text-center">फोटो अपलोड करें</p>
                  </>
                )}
              </div>
              
              <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 mt-6 flex items-center justify-center gap-2">
                 {loading ? <FiLoader className="animate-spin" /> : null}
                 {loading ? "प्रक्रिया में..." : `सबमिट करें`}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[6000] backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCreditCard size={40} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black mb-2">भुगतान करें</h3>
            <p className="text-gray-500 mb-8 font-bold">कुल शुल्क: <span className="text-indigo-600 text-xl">₹65.00</span></p>
            
            <div className="space-y-3">
              <button onClick={() => generateID("wallet")} disabled={walletBalance < 0} className="w-full flex items-center justify-between p-5 border-2 border-gray-100 rounded-3xl hover:border-indigo-600 transition-all group">
                <div className="flex items-center gap-4">
                  <LuWallet className="text-indigo-600" size={24} />
                  <span className="font-bold text-gray-700">Wallet Pay</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${walletBalance < 65 ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
                  ₹{walletBalance}
                </span>
              </button>

              {/* <button onClick={() => generateID("razorpay")} className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-3xl hover:border-green-600 transition-all">
                <FiCreditCard className="text-green-600" size={24} />
                <span className="font-bold text-gray-700">Online Pay</span>
              </button> */}
            </div>
            
            <button onClick={() => setShowPaymentModal(false)} className="mt-8 text-gray-400 font-bold hover:text-red-500 transition-colors uppercase text-xs tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {/* --- KEYBOARD --- */}
      {showKeyboard && (
        <Draggable nodeRef={nodeRef} handle=".drag-handle">
          <div ref={nodeRef} className="fixed top-20 right-10 z-[9999]">
            <ResizableBox width={500} height={350} className="bg-white rounded-[32px] shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="drag-handle bg-slate-900 p-5 flex justify-between text-white cursor-move items-center">
                <span className="text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                  <GripHorizontal size={14}/> कीबोर्ड : {inputName}
                </span>
                <X size={20} className="cursor-pointer hover:text-red-400" onClick={() => setShowKeyboard(false)} />
              </div>
              <div className="flex-grow p-3 bg-gray-50">
                <Keyboard
                  keyboardRef={r => (keyboard.current = r)}
                  onChange={onKeyboardChange}
                  layout={{
                    default: [
                      "१ २ ३ ४ ५ ६ ७ ८ ९ ० - {bksp}",
                      "ौ ै ा ी ू ब ह ग द ज ड ़ ो े",
                      "ि ु क त ज च ट प ि ु",
                      "अ आ इ ई उ ऊ ऋ ए ऐ ओ औ",
                      "क ख ग घ ङ च छ ज झ ञ",
                      "ट ठ ड ढ ण त थ द ध न",
                      "प फ ब भ म य र ल व श",
                      "ष स ह ळ क्ष ज्ञ {space}"
                    ]
                  }}
                  display={{ "{bksp}": "⌫", "{space}": "Space" }}
                />
              </div>
            </ResizableBox>
          </div>
        </Draggable>
      )}

      <style jsx global>{`
        .form-input-styled {
          width: 100%; padding: 0.9rem 1rem 0.9rem 3.2rem; background-color: #f8fafc;
          border: 2px solid #f1f5f9; border-radius: 1.2rem; outline: none; transition: 0.3s;
          font-weight: 600; font-size: 0.95rem; color: #1e293b;
        }
        .form-input-styled:focus { border-color: #4f46e5; background-color: white; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1); }
        .form-input-styled::placeholder { color: #94a3b8; font-weight: 500; }
        .hg-button { background: white !important; border-bottom: 3px solid #e2e8f0 !important; border-radius: 8px !important; }
        .hg-button:active { border-bottom: 0 !important; transform: translateY(2px); }
      `}</style>
    </div>
    </ProtectedService>
  );
}