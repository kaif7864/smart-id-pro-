import axios from "axios";

const API_BASE = "https://smart-id-pro.onrender.com/"; // change if needed

export const extractAadhaar = async (file, password) => {
  try {
    const formData = new FormData();
    
    // Flask ke 'request.files['file']' se match karne ke liye 'file' use karein
    formData.append('file', file);

    // Password ko form data mein append karein
    if (password) {
      formData.append('password', password);
    }

    const response = await axios.post(
      `${API_BASE}/extract-aadhaar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Agar backend status error bhej raha hai (jaise incorrect password)
    if (response.data.status === "error") {
      alert(response.data.message); // User ko error dikhayein
      throw new Error(response.data.message);
    }

    return response.data;

  } catch (error) {
    console.error("Extract Service Error:", error);
    // Detail error message alert karein
    const errMsg = error.response?.data?.message || error.message || "Server connection failed";
    alert("Extraction Error: " + errMsg);
    throw error;
  }
};