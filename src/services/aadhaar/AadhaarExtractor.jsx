import React, { useState, useEffect } from "react";
import axios from "axios";
import { extractAadhaar } from "./extractService";
import Sidebar from "../../components/Sidebar"; // ✨ Sidebar Imported

const AadhaarExtractor = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState(""); // ✨ New Password State
    const [loading, setLoading] = useState(false);
    const [genLoading, setGenLoading] = useState(false);
    const [rawText, setRawText] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("wallet");
    const [userEmail, setUserEmail] = useState("");
    const API_BASE_URL = import.meta.env.VITE_API_URL; // Backend URL (adjust if needed)

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail") || "user@example.com";
        setUserEmail(storedEmail);
    }, []);

    const [data, setData] = useState({
        name_english: "", name_hindi: "",
        father_english: "", father_hindi: "",
        dob: "", gender: "male",
        aadhaar_number: "", vid_number: "",
        issued_date: "", details_as_on: "",
        address_english: "", address_hindi: "",
        photo_base64: ""
    });

    const handleExtract = async () => {
        if (!file) return alert("Please select a PDF first");
        try {
            setLoading(true);
            // Agar backend password support karta hai toh extractAadhaar me password pass karein
            const result = await extractAadhaar(file, password);

            const genderMap = { 'M': 'male', 'F': 'female' };
            const backendGender = result.gender?.toUpperCase();
            const finalGender = genderMap[backendGender] || "male";

            setRawText(result.raw_text || "");
            setData({
                name_english: result.name_english || "",
                name_hindi: result.name_hindi || "",
                father_english: result.father_english || "",
                father_hindi: result.father_hindi || "",
                dob: result.dob || "",
                gender: finalGender,
                aadhaar_number: result.aadhaar_number || "",
                vid_number: result.vid_number || "",
                issued_date: result.issued_date || "",
                details_as_on: result.details_as_on || "",
                address_english: result.address_english || "",
                address_hindi: result.address_hindi || "",
                photo_base64: result.photo_base64 || ""
            });
        } catch (error) {
            alert("Extraction failed!");
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoReplace = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setData(prev => ({ ...prev, photo_base64: reader.result.split(',')[1] }));
        };
        reader.readAsDataURL(file);
    }
};
    // Separate function for actual file download logic
    const executeDownload = async () => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (key !== "photo_base64" && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        formData.append("email", userEmail);
        formData.append("payment_method", paymentMethod);

        if (data.photo_base64) {
            const base64Data = data.photo_base64.replace(/^data:image\/\w+;base64,/, "");
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
            formData.append("photo", blob, "user_photo.png");
        }

        const response = await axios.post(
            `${API_BASE_URL}/generate-aadhaar`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                responseType: "blob",
            }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${data.name_english || "aadhaar"}_smart_card.pdf`;
        link.click();
    };




    const validateForm = () => {
    const requiredFields = [
        "name_english",
        "name_hindi",
        // "father_english",
        // "father_hindi",
        "dob",
        "aadhaar_number",
        "vid_number",
        "issued_date",
        "details_as_on",
        "address_english",
        "address_hindi"
    ];

    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === "") {
            alert(`Please fill ${field.replace("_", " ")}`);
            return false;
        }
    }

    if (!data.photo_base64) {
        alert("Please upload photo");
        return false;
    }

    return true;
};

    const handleGenerate = async () => {
        if (!validateForm()) return;
    try {
        if (!userEmail) return alert("User session not found!");
        setGenLoading(true);

        const amount = 20.00; // Aadhaar cost in Rupees

        if (paymentMethod === "razorpay") {
            // Step 1: Create Order on Backend
            const orderRes = await axios.post(`${API_BASE_URL}/api/create-order`, {
                email: userEmail,
                amount: amount
            });

            // Check if order was created
            if (!orderRes.data.id) throw new Error("Order creation failed");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // 🔥 APNI REAL KEY YAHA DAALEIN
                amount: orderRes.data.amount, // Paise mein backend se hi aata hai
                currency: orderRes.data.currency,
                name: "SmartID Pro",
                description: "Aadhaar Card Generation",
                order_id: orderRes.data.id,
                handler: async (response) => {
                    // Step 3: Verify & Generate after payment success
                    try {
                        const verifyRes = await axios.post(`${API_BASE_URL}/api/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            email: userEmail,
                            amount: amount // Recharge amount in Rupees
                        });

                        if (verifyRes.data.status === "success") {
                            // Proceed to download
                            await executeDownload();
                            setFormData(initialState);
                        } else {
                            alert("Payment verification failed at server!");
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Verification Error: " + (e.response?.data?.message || "Unknown error"));
                    }
                    
                },
                prefill: {
                    email: userEmail
                },
                theme: { color: "#4f46e5" },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                alert("Payment Failed: " + response.error.description);
            });
            rzp.open();
        } else {
            // Wallet logic
            await executeDownload();
        }

    } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || "Generation failed. Check balance.");
    } finally {
        setGenLoading(false);
    }
};


    const InputBox = ({ label, value, onChange, icon }) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                <input
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    value={value}
                    onChange={onChange}
                />
            </div>
        </div>
    );


    return (
        <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900">
            {/* ✨ Sidebar Added */}
            <Sidebar />

            <main className="flex-1 overflow-y-auto h-screen py-8 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                AADHAAR <span className="text-indigo-600">PRO MAKER</span>
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Smart Extraction & PDF Generation System
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-bold text-indigo-700">{userEmail}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT PANEL */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-50">
                                <h3 className="font-bold mb-4">📂 UPLOAD SOURCE</h3>

                                <input type="file" accept=".pdf" className="hidden"
                                    id="file-input"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                <label
                                    htmlFor="file-input"
                                    className="cursor-pointer block border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 mb-4"
                                >
                                    <div className="text-4xl mb-3">📄</div>
                                    <p className="text-sm font-bold text-slate-600 break-words overflow-hidden text-ellipsis">
                                        {file
                                            ? file.name.length > 35
                                                ? file.name.substring(0, 35) + "..."
                                                : file.name
                                            : "Select Aadhaar PDF"}
                                    </p>
                                </label>

                                {/* ✨ PDF Password Optional Field */}
                                <div className="mb-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">PDF Password (Optional)</label>
                                    <input 
                                        type="password"
                                        placeholder="Enter PDF password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>

                                <button onClick={handleExtract}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-colors">
                                    {loading ? "⌛ EXTRACTING..." : "⚡ START EXTRACTION"}
                                </button>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
                                <h3 className="font-bold mb-4">💳 PAYMENT & PRINT (₹20.00)</h3>
                                <select value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-slate-800 rounded-xl py-3 px-4 mb-4 outline-none border border-slate-700">
                                    <option value="wallet">💰 Wallet (₹20.00)</option>
                                    <option value="razorpay">💳 Razorpay Online</option>
                                </select>
                                <button
  onClick={handleGenerate}
  disabled={genLoading}
  className={`w-full font-black py-4 rounded-2xl shadow-lg transition-colors 
  ${genLoading 
    ? "bg-green-300 cursor-not-allowed" 
    : "bg-green-500 hover:bg-green-400 text-white"}`}
>
  {genLoading ? "GENERATING... 🔄" : "✅ PAY & DOWNLOAD PDF"}
</button>
                            </div>
                        </div>

                        {/* FORM PANEL */}
                        <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl border border-slate-50">
                            <h3 className="text-xl font-black mb-6 border-b pb-4">
                                📝 VERIFY & EDIT DETAILS
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputBox label="Name (English)" icon="👤"
                                    value={data.name_english}
                                    onChange={(e) => setData({ ...data, name_english: e.target.value })}
                                />
                                <InputBox label="नाम (Hindi)" icon="🇮🇳"
                                    value={data.name_hindi}
                                    onChange={(e) => setData({ ...data, name_hindi: e.target.value })}
                                />
                                <InputBox label="Father Name (English)" icon="👨"
                                    value={data.father_english}
                                    onChange={(e) => setData({ ...data, father_english: e.target.value })}
                                />
                                <InputBox label="पिता का नाम (Hindi)" icon="🇮🇳"
                                    value={data.father_hindi}
                                    onChange={(e) => setData({ ...data, father_hindi: e.target.value })}
                                />
                                <InputBox label="Date of Birth" icon="📅"
                                    value={data.dob}
                                    onChange={(e) => setData({ ...data, dob: e.target.value })}
                                />
                                <InputBox label="Aadhaar Number" icon="🔢"
                                    value={data.aadhaar_number}
                                    onChange={(e) => setData({ ...data, aadhaar_number: e.target.value })}
                                />
                                <InputBox label="VID Number" icon="🆔"
                                    value={data.vid_number}
                                    onChange={(e) => setData({ ...data, vid_number: e.target.value })}
                                />
                                <InputBox label="Issued Date" icon="🗓"
                                    value={data.issued_date}
                                    onChange={(e) => setData({ ...data, issued_date: e.target.value })}
                                />
                                <InputBox label="Details As On" icon="🔍"
                                    value={data.details_as_on}
                                    onChange={(e) => setData({ ...data, details_as_on: e.target.value })}
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Gender</label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setData({ ...data, gender: "male" })}
                                            className={`flex-1 py-2 rounded-lg font-bold transition-all ${data.gender === "male" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500"}`}
                                        >
                                            MALE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData({ ...data, gender: "female" })}
                                            className={`flex-1 py-2 rounded-lg font-bold transition-all ${data.gender === "female" ? "bg-pink-600 text-white shadow-md" : "text-slate-500"}`}
                                        >
                                            FEMALE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <textarea rows="2"
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Address (English)"
                                    value={data.address_english}
                                    onChange={(e) => setData({ ...data, address_english: e.target.value })}
                                />
                                <textarea rows="2"
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="पता (Hindi)"
                                    value={data.address_hindi}
                                    onChange={(e) => setData({ ...data, address_hindi: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* PHOTO PANEL */}
                        <div className="lg:col-span-3">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-50 text-center">
                                <h3 className="font-bold mb-4">🖼 PHOTO PREVIEW</h3>

                                <div className="relative group">
                                    {data.photo_base64 ? (
                                        <img
                                            src={data.photo_base64.startsWith("data:image") ? data.photo_base64 : `data:image/png;base64,${data.photo_base64}`}
                                            alt="Extracted"
                                            className="w-full h-64 object-cover rounded-2xl border shadow-md"
                                        />
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed rounded-2xl">
                                            No Photo
                                        </div>
                                    )}

                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 text-sm font-bold">
                                            📸 CHANGE PHOTO
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoReplace}
                                        />
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">*Click photo to replace</p>
                            </div>
                            <div className="mt-6">
    <h3 className="font-bold mb-2">📄 RAW EXTRACTED DATA</h3>

    <textarea
        value={rawText}
        readOnly
        rows="10"
        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono text-slate-700 overflow-y-auto"
        placeholder="Extracted Aadhaar text will appear here..."
    />
</div>
                        </div>

                        
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AadhaarExtractor;