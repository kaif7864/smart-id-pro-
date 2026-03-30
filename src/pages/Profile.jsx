import React, { useState, useRef, useEffect } from "react"; // ✨ useEffect imported
import { FiUser, FiMail, FiPhone, FiSave, FiCamera, FiEdit2, FiX, FiArrowLeft} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  // ✨ Real data ke liye state ko empty/initial setup karein
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "https://api.dicebear.com/8.x/adventurer/svg?seed=default", // Default Avatar
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(profileData);
  const fileInputRef = useRef(null);

  // ✨ LOCAL STORAGE SE DATA FETCH KAREIN
  useEffect(() => {
  const userEmail = localStorage.getItem("userEmail"); // Email base query ke liye chahiye

  const fetchProfileFromDB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile?email=${userEmail}`);
      const data = await response.json();

      if (response.ok) {
        // DB se aaya hua real data state mein set karein
        const dbData = {
          name: data.name || "No Name",
          email: data.email,
          phone: data.phone || "Not Provided",
          avatar: data.avatar || "https://api.dicebear.com/8.x/adventurer/svg?seed=default",
        };
        setProfileData(dbData);
        setTempData(dbData);
      }
    } catch (error) {
      console.error("DB Fetch Error:", error);
    }
  };

  if (userEmail) {
    fetchProfileFromDB();
  }
}, []);


  const handleChange = (e) => {
    setTempData({ ...tempData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempData({ ...tempData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

const API_BASE_URL = "https://smart-id-pro.onrender.com"; // Backend URL (adjust if needed)

const handleSave = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tempData.email, // Identity ke liye email zaroori hai
        name: tempData.name,
        phone: tempData.phone,
        avatar: tempData.avatar
      })
    });

    if (response.ok) {
      // ✅ 1. State update karein
      setProfileData(tempData);

      // ✅ 2. Local Storage update karein (taaki dashboard pe bina refresh dikhe)
      localStorage.setItem("userName", tempData.name);
      localStorage.setItem("userPhone", tempData.phone);
      localStorage.setItem("userAvatar", tempData.avatar);

      setIsEditing(false);
      alert("🎉 Database & Profile Updated Successfully!");
    } else {
      alert("Failed to update profile in Database.");
    }
  } catch (error) {
    console.error("Update Error:", error);
    alert("Server error. Please try again.");
  }
};

  const handleCancel = () => {
    setTempData(profileData); // Revert changes
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">

  <div className="flex items-center gap-3">

    {/* Back Arrow */}
    <button
      onClick={() => navigate(-1)}
      className="p-2 rounded-lg hover:bg-gray-200 transition"
    >
      <FiArrowLeft size={20} />
    </button>

    <div>
      <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
      <p className="text-gray-500 mt-1">
        Manage your personal information and security.
      </p>
    </div>

  </div>
            
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              <FiEdit2 size={16} />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="bg-white border border-gray-200 text-red-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition flex items-center gap-2 shadow-sm"
            >
              <FiX size={16} />
              Cancel
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm md:col-span-1 text-center flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={tempData.avatar}
                alt="Profile"
                className="h-28 w-28 rounded-full object-cover border-4 border-indigo-50"
              />
              
              <button 
                onClick={() => isEditing && fileInputRef.current.click()}
                className={`absolute bottom-0 right-0 p-2.5 rounded-full text-white transition ${isEditing ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!isEditing}
              >
                <FiCamera size={16} />
              </button>
              
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
            <p className="text-sm text-gray-500">{profileData.email}</p>
            
            <div className="mt-6 w-full text-left space-y-2 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded-lg text-gray-700">SID-7783992</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Personal Details</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={tempData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full border rounded-xl py-2.5 pl-10 pr-4 ${isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-200" : "border-gray-200 bg-gray-50 cursor-not-allowed"}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiMail />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={tempData.email}
                      disabled={true} // ✨ EMAIL SHOULD NOT BE EDITABLE
                      className="w-full border border-gray-200 bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 cursor-not-allowed text-gray-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <FiPhone />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={tempData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full border rounded-xl py-2.5 pl-10 pr-4 ${isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-200" : "border-gray-200 bg-gray-50 cursor-not-allowed"}`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition flex items-center gap-2"
                  >
                    <FiSave size={18} />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}