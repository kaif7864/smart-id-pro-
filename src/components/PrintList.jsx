import React, { useState, useEffect } from "react";
import { FiPrinter, FiSearch, FiFileText, FiDownload, FiLoader } from "react-icons/fi";
import Sidebar from "./Sidebar";

export default function PrintListPage() {
  const [printList, setPrintList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const API_BASE_URL = "https://smart-id-pro.onrender.com"; // Backend URL (adjust if needed)
  // ✨ Real Data Fetching
  useEffect(() => {
    const fetchPrints = async () => {
      try {
        // LocalStorage se logged-in user ki email nikalna best rahega
        const userEmail = localStorage.getItem("userEmail") || "test@example.com"; 
        const response = await fetch(`${API_BASE_URL}/api/prints?email=${userEmail}`);
        const data = await response.json();
        
        if (response.ok) {
          setPrintList(data);
        }
      } catch (error) {
        console.error("Error fetching prints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrints();
  }, []);

  // ✨ Download Again Function
  const handleDownloadAgain = async (fileUrl, idNumber) => {
    if (!fileUrl) {
    alert("Download link not available");
    return;
  }
   const link = document.createElement("a");
  link.href = fileUrl;
  link.target = "_blank";
  link.download = `${idNumber}_Aadhaar.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // ✨ Search Logic (Updated to use item.id_number)
  const filteredList = printList.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.id_number && item.id_number.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Print List</h1>
            <p className="text-gray-500 mt-1">View and manage your generated ID cards.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 w-full md:w-64 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
              <FiLoader size={32} className="animate-spin mb-4" />
              Loading your history...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">ID Number</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      {/* Backend field 'id_number' use kiya */}
                      <td className="px-6 py-4 text-gray-700 font-medium">
  {item.id_number || item.roll_number || "N/A"}
</td>
                      <td className="px-6 py-4 text-gray-700">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.type === "PAN" ? "bg-orange-50 text-orange-700" :
                          item.type === "AADHAAR" ? "bg-blue-50 text-blue-700" :
                          "bg-green-50 text-green-700"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(item.date).toLocaleDateString()} <br/>
                        <span className="text-[10px]">{new Date(item.date).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 ${item.status === "Printed" ? "text-green-600" : "text-yellow-600"}`}>
                          <span className={`w-2 h-2 rounded-full ${item.status === "Printed" ? "bg-green-500" : "bg-yellow-500"}`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {/* Download Button connected to backend API */}
                           <button 
  onClick={() => handleDownloadAgain(item.file_url, item.id_number)}
  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
>
    <FiDownload size={16} />
</button>
                            <button 
                              onClick={() => handleDownloadAgain(item.file_name, item.id_number)}
                              title="Print Now"
                              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                                <FiPrinter size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && filteredList.length === 0 && (
            <div className="p-20 text-center text-gray-500">
                <FiFileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">No IDs found</p>
                <p className="text-sm">Start by generating a new ID card.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}