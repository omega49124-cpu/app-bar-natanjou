import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import LoginScreen from "@/components/LoginScreen";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Check if user is authenticated (within last 24 hours)
const checkAuth = () => {
  const auth = localStorage.getItem("natanjou_auth");
  const authTime = localStorage.getItem("natanjou_auth_time");
  
  if (auth === "true" && authTime) {
    const elapsed = Date.now() - parseInt(authTime);
    const hours24 = 24 * 60 * 60 * 1000;
    return elapsed < hours24;
  }
  return false;
};

function App() {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(checkAuth());

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if products exist, if not seed data
        const response = await axios.get(`${API}/products`);
        if (response.data.length === 0) {
          await axios.post(`${API}/seed`);
        }
        setInitialized(true);
      } catch (e) {
        console.error("Error initializing app:", e);
        // Try to seed anyway
        try {
          await axios.post(`${API}/seed`);
          setInitialized(true);
        } catch (err) {
          console.error("Failed to seed:", err);
          setInitialized(true); // Still show app even if seed fails
        }
      }
    };
    initApp();
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("natanjou_auth");
    localStorage.removeItem("natanjou_auth_time");
    setAuthenticated(false);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-sans text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background grain-texture">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
          <Route path="*" element={<Dashboard onLogout={handleLogout} />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
