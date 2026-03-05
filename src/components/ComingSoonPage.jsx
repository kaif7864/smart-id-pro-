import React from "react";
import { FiClock, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // ✨ REUSING SIDEBAR

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      {/* ✨ REUSABLE SIDEBAR */}
      <Sidebar />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        
        {/* Coming Soon Card */}
        <div className="bg-white p-10 md:p-16 rounded-3xl border border-gray-100 shadow-xl text-center max-w-2xl w-full">
          <div className="bg-indigo-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
            <FiClock className="text-indigo-600 w-12 h-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Coming Soon!
          </h1>
          
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            We are working hard to bring this feature to you. 
            Stay tuned for updates!
          </p>
          
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition flex items-center gap-2 mx-auto"
          >
            <FiArrowLeft size={20} />
            Back to Dashboard
          </button>
        </div>
        
      </main>
    </div>
  );
}