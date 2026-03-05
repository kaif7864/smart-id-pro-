import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import IDForm from "./services/Pan";
import PrintListPage from "./components/PrintList";
import WalletPage from "./components/WalletPage";
import AddMoneyPage from "./components/AddMoneyPage";
import ComingSoonPage from "./components/ComingSoonPage";
import NotforYou from "./services/marksheets/MarksheetSelection";
import MarksheetSelection from "./services/marksheets/MarksheetSelection";
import MarksheetForm from "./services/marksheets/MarksheetForm";
import AadhaarExtractor from "./services/aadhaar/AadhaarExtractor";

// 🔥 Protected Route Wrapper Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // 1. Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // 2. Logout Function (useCallback is used to prevent recreation on every render)
  const handleLogout = useCallback(() => {
    console.log("Logging out / Session expired");
    setIsAuthenticated(false);
    localStorage.clear(); // 🛡️ Saara sensitive data ek baar mein clear
  }, []);

  // 3. Login Success Function
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  // 4. Session Expiry Watchdog (2 Hour Check)
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const expiry = localStorage.getItem("session_expiry");
      const now = new Date().getTime();

      // 🚨 Agar session expire ho gaya hai (isLoggedIn true hai but time khatam)
      if (isLoggedIn === "true" && expiry && now > parseInt(expiry)) {
        handleLogout();
      }
    };

    // Check on initial load
    checkAuth();

    // Check every 30 seconds for better accuracy
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, [handleLogout]);

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />

        {/* --- Protected Routes --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/generate/:serviceType"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <IDForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><Profile /></ProtectedRoute>}
        />
        <Route
          path="/print-list"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><PrintListPage /></ProtectedRoute>}
        />
        <Route
          path="/wallet"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><WalletPage /></ProtectedRoute>}
        />
        <Route
          path="/add-money"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><AddMoneyPage /></ProtectedRoute>}
        />
        <Route
          path="/coming-soon"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><ComingSoonPage /></ProtectedRoute>}
        />
        <Route
          path="/not-for-you"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><NotforYou /></ProtectedRoute>}
        />

        <Route
          path="/marksheet-selection"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><MarksheetSelection /></ProtectedRoute>}
        />

        <Route
          path="/aadhar"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><AadhaarExtractor /></ProtectedRoute>}
        />
        <Route
          path="/old-2nd"
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><MarksheetForm /></ProtectedRoute>}
        />

        {/* --- 404 handler --- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;