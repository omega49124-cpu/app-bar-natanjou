import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn } from "lucide-react";
import NatanjouLogo from "@/components/NatanjouLogo";

export const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API}/auth/verify`, { password });
      // Save auth state
      localStorage.setItem("natanjou_auth", "true");
      localStorage.setItem("natanjou_auth_time", Date.now().toString());
      onLogin();
    } catch (err) {
      setError("Mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grain-texture flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-2 border-border shadow-xl" data-testid="login-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <NatanjouLogo className="h-16 w-auto text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-foreground">
            Accès Buvette
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Entrez le mot de passe pour accéder à l'application
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-sans font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-2 pl-10 h-12"
                  autoFocus
                  data-testid="password-input"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium" data-testid="error-message">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all rounded-lg font-bold uppercase tracking-wide h-12"
              data-testid="login-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Accéder
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Association Natanjou © {new Date().getFullYear()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;
