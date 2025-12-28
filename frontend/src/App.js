import { useEffect, useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Dashboard from "@/pages/Dashboard";
import LoginScreen from "@/components/LoginScreen";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Check if user is authenticated (within last 24 hours)
const checkAuth = () => {
  const auth = localStorage.getItem("natanjou_auth");
  const authTime = localStorage.getItem("natanjou_auth_time");
  const lastActivity = localStorage.getItem("natanjou_last_activity");
  const role = localStorage.getItem("natanjou_role");
  
  if (auth === "true" && authTime) {
    const elapsed = Date.now() - parseInt(authTime);
    const hours24 = 24 * 60 * 60 * 1000;
    
    // Check 24h expiration
    if (elapsed >= hours24) {
      return { authenticated: false, role: null };
    }
    
    // Check 30min inactivity
    if (lastActivity) {
      const inactiveTime = Date.now() - parseInt(lastActivity);
      if (inactiveTime >= SESSION_TIMEOUT) {
        return { authenticated: false, role: null, reason: "inactivity" };
      }
    }
    
    return { authenticated: true, role: role || "admin" };
  }
  return { authenticated: false, role: null };
};

function App() {
  const [initialized, setInitialized] = useState(false);
  const authState = checkAuth();
  const [authenticated, setAuthenticated] = useState(authState.authenticated);
  const [userRole, setUserRole] = useState(authState.role);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (authenticated) {
      localStorage.setItem("natanjou_last_activity", Date.now().toString());
    }
  }, [authenticated]);

  // Handle automatic logout
  const handleLogout = useCallback((showMessage = false, reason = "") => {
    localStorage.removeItem("natanjou_auth");
    localStorage.removeItem("natanjou_auth_time");
    localStorage.removeItem("natanjou_role");
    localStorage.removeItem("natanjou_last_activity");
    setAuthenticated(false);
    setUserRole(null);
    
    if (showMessage && reason === "inactivity") {
      setTimeout(() => {
        toast.info("Session expirée après 30 minutes d'inactivité", {
          duration: 5000,
        });
      }, 500);
    }
  }, []);

  // Check for inactivity timeout
  useEffect(() => {
    if (!authenticated) return;

    // Set initial activity
    updateActivity();

    // Check every minute for inactivity
    const intervalId = setInterval(() => {
      const lastActivity = localStorage.getItem("natanjou_last_activity");
      if (lastActivity) {
        const inactiveTime = Date.now() - parseInt(lastActivity);
        if (inactiveTime >= SESSION_TIMEOUT) {
          handleLogout(true, "inactivity");
        }
      }
    }, 60000); // Check every minute

    // Activity event listeners
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearInterval(intervalId);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [authenticated, updateActivity, handleLogout]);

  // Show message if logged out due to inactivity on page load
  useEffect(() => {
    if (authState.reason === "inactivity") {
      toast.info("Session expirée après 30 minutes d'inactivité", {
        duration: 5000,
      });
    }
  }, []);

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

  const handleLogin = (role) => {
    setAuthenticated(true);
    setUserRole(role);
    localStorage.setItem("natanjou_last_activity", Date.now().toString());
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
          <Route path="/" element={<Dashboard onLogout={() => handleLogout(false)} userRole={userRole} />} />
          <Route path="*" element={<Dashboard onLogout={() => handleLogout(false)} userRole={userRole} />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
