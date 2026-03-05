// src/services/makerService.js

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL; // change if needed

export const generateAadhaar = async (data, paymentMethod) => {
  try {
    const response = await axios.post(
      `${API_BASE}/generate-aadhaar`,
      {
        ...data,
        payment_method: paymentMethod
      },
      {
        responseType: "blob", // Important for PDF download
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;

  } catch (error) {
    console.error("Maker Service Error:", error);
    throw error;
  }
};