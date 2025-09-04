import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import the new Header component
import Header from "./components/layout/Header";

// Auth Components
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";

// Page Components - Now cleanly separated
import Dashboard from "./pages/Dashboard";
import ManualSync from "./pages/ManualSync"; // This will be the refactored EbayApiAccountingHelper
import AutoSync from "./pages/AutoSync";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Authentication screens
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              eBay API Helper
            </h1>
            <p className="text-xl text-gray-600">
              Sync your eBay transactions with FreeAgent
            </p>
          </div>

          {authMode === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              switchToRegister={() => setAuthMode("register")}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              switchToLogin={() => setAuthMode("login")}
            />
          )}
        </div>
      </div>
    );
  }

  // Main app with clean separation
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Use the new Header component */}
        <Header user={user} onLogout={handleLogout} />

        {/* Clean main content */}
        <main className="flex-1">
          <Routes>
            {/* Dashboard - Overview only */}
            <Route path="/dashboard" element={<Dashboard user={user} />} />

            {/* Manual Sync - The actual syncing functionality */}
            <Route path="/sync" element={<ManualSync user={user} />} />

            {/* Auto Sync */}
            <Route path="/auto-sync" element={<AutoSync />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
