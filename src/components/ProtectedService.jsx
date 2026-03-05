import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiAlertTriangle, FiClock, FiX } from 'react-icons/fi';

function ProtectedService({ children }) {
    const navigate = useNavigate();
    const location = useLocation(); // Current path track karne ke liye
    const SECRET_PASSWORD = import.meta.env.VITE_SECRET_PASSWORD;

    // 🚀 UNLOCK PATHS: In paths par session chalta rahega
    // Inme wo saare routes daalein jahan timer continue rakhna hai
    const ALLOWED_PATHS = [
        '/selection', 
        '/old-2nd', 
        '/intermediate', 
        '/graduation', 
        '/coming-soon'
    ];

    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(
        sessionStorage.getItem('isProAuthenticated') === 'true'
    );
    const [timeLeft, setTimeLeft] = useState(0);
    const [error, setError] = useState('');

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('isProAuthenticated');
        sessionStorage.removeItem('proSessionEndTime');
        setIsAuthenticated(false);
    }, []);

    // 🔒 Path Tracking Logic: Agar allowed paths ke bahar gaye toh Lock kar do
    useEffect(() => {
        const isAllowed = ALLOWED_PATHS.some(path => location.pathname.startsWith(path));
        
        if (!isAllowed) {
            handleLogout();
        }
    }, [location.pathname, handleLogout]);

    // ⏱️ Timer Logic
    useEffect(() => {
        if (!isAuthenticated) return;

        const calculateTimeLeft = () => {
            const endTime = sessionStorage.getItem('proSessionEndTime');
            if (!endTime) return 0;
            const remaining = Math.round((parseInt(endTime) - Date.now()) / 1000);
            return remaining > 0 ? remaining : 0;
        };

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (remaining <= 0) {
                handleLogout();
                navigate('/'); // Time khatam hone par dashboard
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isAuthenticated, handleLogout, navigate]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === SECRET_PASSWORD) {
            const endTime = Date.now() + 300000; // 5 minute session
            sessionStorage.setItem('isProAuthenticated', 'true');
            sessionStorage.setItem('proSessionEndTime', endTime.toString());
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect Password! Redirecting...');
            // 🚀 Wrong password par dashboard navigation
            setTimeout(() => {
                navigate('/'); 
            }, 1500);
        }
    };

    if (isAuthenticated) {
        return (
            <div className="relative">
                {/* Timer UI */}
                <div className="fixed top-20 right-10 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-mono z-[100] font-bold shadow-red-100">
                    <FiClock className="animate-pulse" /> 
                    Remaining Time-
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                {children}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center relative border border-gray-100">
                <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition">
                    <FiX size={24} />
                </button>
                
                <FiLock className="mx-auto text-6xl text-indigo-600 bg-indigo-50 p-4 rounded-full mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Pro Feature</h2>
                <p className="text-gray-500 text-sm mb-6">Enter password to access this service</p>

                <form onSubmit={handlePasswordSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full border border-gray-200 rounded-xl py-3 px-4 mb-4 outline-none focus:ring-2 focus:ring-indigo-400 text-center text-lg"
                        autoFocus
                    />
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mb-4 justify-center animate-bounce">
                            <FiAlertTriangle /> {error}
                        </div>
                    )}
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all active:scale-95">
                        Unlock Now
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProtectedService;