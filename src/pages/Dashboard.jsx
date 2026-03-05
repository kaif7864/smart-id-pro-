import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiFileText, FiCreditCard, FiTruck, FiArrowRight, FiList, FiBookOpen, FiCalendar, FiLogOut, FiLoader, FiDownload } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import Sidebar from "../components/Sidebar";
import ComingSoonPage from "../components/ComingSoonPage";
import { GiFirstAidKit } from "react-icons/gi";
import NotforYou from "../services/marksheets/MarksheetForm";

export default function Dashboard() {
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({ userToday: 0, systemTotal: 0 });
  const [recentPrints, setRecentPrints] = useState([]); // ✨ New state for history
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [user, setUser] = useState({
      name: "User",
      avatar: "https://api.dicebear.com/8.x/adventurer/svg?seed=default"
  });



  
useEffect(() => {
    const hasShown = sessionStorage.getItem("welcomeShown");
    if (!hasShown) {
        setShowWelcome(true);
        sessionStorage.setItem("welcomeShown", "true");
        // 5 second baad gayab ho jaye
        setTimeout(() => setShowWelcome(false), 5000);
    }
}, []);


 const API_BASE_URL = "https://smart-id-pro.onrender.com/"; // Backend URL (adjust if needed)

  useEffect(() => {
  const userEmail = localStorage.getItem("userEmail");

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats & User Profile Parallelly
      const [statsRes, profileRes, printsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stats?email=${userEmail}`),
        fetch(`${API_BASE_URL}/api/user/profile?email=${userEmail}`),
        fetch(`${API_BASE_URL}/api/prints?email=${userEmail}`)
      ]);

      const stats = await statsRes.json();
      const profile = await profileRes.json();
      const prints = await printsRes.json();

      if (statsRes.ok) setStatsData(stats);
      
      if (profileRes.ok) {
        setUser({
          name: profile.name || "User",
          avatar: profile.avatar || "https://api.dicebear.com/8.x/adventurer/svg?seed=default"
        });
        // Side benefit: LocalStorage ko bhi update kar dein taaki turant refresh pe gap na dikhe
        localStorage.setItem("userName", profile.name);
      }

      if (printsRes.ok) {
        setRecentPrints(prints.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userEmail) fetchDashboardData();
}, []);


  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("userName"); // Clear local data
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  // ✨ Updated Stats Array
  const stats = [
    { 
        label: "Today's IDs (You)", // 👤 Sirf user ki today's ids
        value: loading ? <FiLoader className="animate-spin inline" /> : statsData.userToday, 
        icon: <FiCalendar className="text-indigo-600" /> 
    },
    { 
        label: "Total IDs (System)", // 🌐 Puri system ki total
        value: loading ? <FiLoader className="animate-spin inline" /> : statsData.systemTotal, 
        icon: <FiList className="text-emerald-600" /> 
    },
  ];

  const services = [
    {
      title: "PAN Card",
      description: "Generate instant PAN ID from extracted data.",
      icon: <FiCreditCard className="text-orange-500 w-7 h-7" />,
      path: "/generate/pan",
      color: "border-orange-100 bg-orange-50"
    },
    {
      title: "Aadhaar Card",
      description: "Convert Aadhaar PDF into a printable Smart ID.",
      icon: <FiFileText className="text-blue-500 w-7 h-7" />,
      path: "/aadhar",
      color: "border-blue-100 bg-blue-50"
    },
    {
      title: "Vehicle RC",
      description: "Smart Digital RC generation for vehicles.",
      icon: <FiTruck className="text-green-500 w-7 h-7" />,
      path: "/coming-soon",
      color: "border-green-100 bg-green-50"
    },
    {
    title: "License",
    description: "Digital Driving License generation.",
    icon: <FiBookOpen className="text-red-500 w-7 h-7" />,
    path: "/coming-soon",
    color: "border-red-100 bg-red-50"
  },
  {
    title: "not for you",
    description: "secret documents",
    icon: <GiFirstAidKit className="text-red-500 w-7 h-7" />,
    path: "/not-for-you",
    color: "border-red-100 bg-red-50"
  },
  ];


  {showWelcome && (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-2xl border-2 border-indigo-500 px-8 py-4 rounded-full flex items-center gap-3 animate-bounce">
        <span className="text-2xl">🎉</span>
        <h2 className="font-bold text-gray-800">Welcome Back, {user.name}!</h2>
    </div>
)}


  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen">
        
        <header className="bg-white border-b border-gray-100 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-3 group">
              <img
                src={user.avatar}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover border-2 border-indigo-100"
              />
              <span className="font-semibold text-gray-700 group-hover:text-indigo-600">{user.name}</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="p-4 bg-indigo-50 rounded-xl">{stat.icon}</div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Available Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <Link 
                  key={index} 
                  to={service.path}
                  className={`group p-6 rounded-2xl border ${service.color} hover:shadow-lg transition-all duration-300 bg-white`}
                >
                  <div className="mb-5">{service.icon}</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h4>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-1 transition-all">
                    Generate <FiArrowRight className="ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Recent Activity</h3>
              <Link to="/print-list" className="text-sm text-indigo-600 font-medium hover:underline">View All</Link>
            </div>
            
            <div className="overflow-x-auto">
              {recentPrints.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name / ID</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPrints.map((print, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 text-sm">{print.name}</p>
                          <p className="text-xs text-gray-400">{print.id_number}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            print.type === 'AADHAAR' ? 'bg-blue-100 text-blue-600' : 
                            print.type === 'PAN' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {print.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(print.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            href={print.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                          >
                            <FiDownload /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FiList size={28} />
                  </div>
                  <p className="text-gray-500 text-sm">No recent IDs generated yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}