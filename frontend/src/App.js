import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function App() {
  const [initialized, setInitialized] = useState(false);

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
        }
      }
    };
    initApp();
  }, []);

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

  return (
    <div className="min-h-screen bg-background grain-texture">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
