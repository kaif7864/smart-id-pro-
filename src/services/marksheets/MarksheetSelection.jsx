import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFileText, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import Sidebar from '../../components/Sidebar';
import ProtectedService from '../../components/ProtectedService';


const marksheets = [
    { 
        id: 'Old_2nd', 
        title: 'Old_Second', 
        year: '2002', 
        cost: 65, 
        color: 'bg-blue-500', 
        path: '/old-2nd' // 👈 Alag URL
    },
    { 
        id: 'caste', 
        title: 'uk caste certificate', 
        board: 'Uk', 
        cost: 65, 
        color: 'bg-indigo-500', 
        path: '/dom' // 👈 Alag URL
    },
    { 
        id: 'graduation', 
        title: 'Graduation Degree', 
        board: 'University', 
        cost: 50, 
        color: 'bg-purple-500', 
        path: '/coming-soon' // 👈 Alag URL
    },

      { 
        id: 'graduation', 
        title: 'Graduation Degree', 
        board: 'University', 
        cost: 50, 
        color: 'bg-purple-500', 
        path: '/coming-soon' 
    },
    // ... baaki items mein bhi 'path' add karein
];

function MarksheetSelection() {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const filteredSheets = marksheets.filter(sheet =>
        sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.board.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ProtectedService>

        
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
                {/* Header Section */}
                <div className="max-w-6xl mx-auto mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">Select Marksheet Type</h1>
                    <p className="text-gray-500 mt-2 text-lg">Choose the year or class to generate your report card</p>

                    {/* Search Bar */}
                    <div className="relative mt-8 max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                            <FiSearch size={20} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search board or class..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSheets.map((sheet) => (
    <div 
        key={sheet.id}
        onClick={() => navigate(sheet.path)} // 🚀 Sidha path par bhejega (No IDs)
        className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
    >
        {/* Accent Color Strip */}
        <div className={`absolute top-0 left-0 w-2 h-full ${sheet.color}`}></div>

        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${sheet.color.replace('bg-', 'bg-opacity-10 ')} ${sheet.color.replace('bg-', 'text-')}`}>
                <FiFileText size={24} />
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                ₹{sheet.cost}
            </span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">
            {sheet.title}
        </h3>
        <p className="text-gray-500 text-sm mt-1 mb-6">{sheet.board || "Report Card"}</p>

        <div className="flex items-center text-indigo-600 font-semibold text-sm">
            Proceed to Generate <FiArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
        </div>
    </div>
))}
                </div>

                {/* No Results State */}
                {filteredSheets.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <FiSearch size={30} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-600">No marksheet found</h3>
                        <p className="text-gray-400">Try searching with a different name</p>
                    </div>
                )}
            </main>
        </div>
        </ProtectedService>
    );
}

export default MarksheetSelection;
