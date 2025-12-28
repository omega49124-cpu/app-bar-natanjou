import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ReceiptText, TrendingUp, Settings, History, LogOut, Shield, Trophy, Eye } from "lucide-react";
import CashRegister from "@/components/CashRegister";
import StockTable from "@/components/StockTable";
import RefundSection from "@/components/RefundSection";
import ProductsManager from "@/components/ProductsManager";
import SalesHistory from "@/components/SalesHistory";
import AdminSection from "@/components/AdminSection";
import NatanjouLogo from "@/components/NatanjouLogo";

export default function Dashboard({ onLogout, userRole = "admin" }) {
  const [stats, setStats] = useState(null);
  const [totalStats, setTotalStats] = useState(null);
  const [activeTab, setActiveTab] = useState("caisse");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const isViewer = userRole === "viewer";

  const fetchStats = async () => {
    try {
      const [todayRes, totalRes] = await Promise.all([
        axios.get(`${API}/stats/today`),
        axios.get(`${API}/stats/total`)
      ]);
      setStats(todayRes.data);
      setTotalStats(totalRes.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Refresh data when switching to caisse tab
  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "caisse") {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-8 shadow-lg no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NatanjouLogo className="h-12 w-auto" />
            <div>
              <p className="font-sans text-sm opacity-80">
                Gestion de la Buvette
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {totalStats && (
              <div className="text-right border-r border-primary-foreground/20 pr-6">
                <p className="text-xs uppercase tracking-widest opacity-60">
                  CA Total (permanent)
                </p>
                <p className="font-sans text-2xl font-bold tabular-nums text-yellow-300">
                  {totalStats.total_revenue.toFixed(2)} €
                </p>
              </div>
            )}
            {stats && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest opacity-60">
                  Recette du jour
                </p>
                <p className="font-sans text-2xl font-bold tabular-nums">
                  {stats.net_revenue.toFixed(2)} €
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-8 py-6 no-print">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card border-2 border-border shadow-sm" data-testid="stat-sales">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ventes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-2xl font-bold tabular-nums">
                {stats?.total_sales?.toFixed(2) || "0.00"} €
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.num_transactions || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border shadow-sm" data-testid="stat-items">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-2xl font-bold tabular-nums">
                {stats?.total_items || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">vendus aujourd'hui</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border shadow-sm" data-testid="stat-refunds">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ReceiptText className="w-4 h-4" />
                Remboursements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-2xl font-bold tabular-nums text-destructive">
                {totalStats?.total_refunds?.toFixed(2) || "0.00"} €
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalStats?.num_refunds || 0} total (permanent)
              </p>
              {stats?.total_refunds > 0 && (
                <p className="text-xs text-destructive/70 mt-1">
                  dont {stats.total_refunds.toFixed(2)} € aujourd'hui
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border shadow-sm" data-testid="stat-net">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Net du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-2xl font-bold tabular-nums text-accent">
                {stats?.net_revenue?.toFixed(2) || "0.00"} €
              </p>
              <p className="text-xs text-muted-foreground mt-1">recette nette</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-sm" data-testid="stat-total">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-yellow-700 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                CA Permanent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-2xl font-bold tabular-nums text-yellow-700">
                {totalStats?.total_revenue?.toFixed(2) || "0.00"} €
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {totalStats?.num_transactions || 0} ventes totales
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-muted p-1 rounded-xl mb-6 no-print" data-testid="main-tabs">
            <TabsTrigger
              value="caisse"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-caisse"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Caisse
            </TabsTrigger>
            <TabsTrigger
              value="stock"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-stock"
            >
              <Package className="w-4 h-4 mr-2" />
              Stock
            </TabsTrigger>
            <TabsTrigger
              value="remboursements"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-refunds"
            >
              <ReceiptText className="w-4 h-4 mr-2" />
              Remboursements
            </TabsTrigger>
            <TabsTrigger
              value="historique"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-history"
            >
              <History className="w-4 h-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger
              value="produits"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-products"
            >
              <Settings className="w-4 h-4 mr-2" />
              Produits
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="rounded-lg px-6 py-2 font-sans font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
              data-testid="tab-admin"
            >
              <Shield className="w-4 h-4 mr-2" />
              Administration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="caisse" className="animate-fade-in">
            <CashRegister onSaleComplete={fetchStats} refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="stock" className="animate-fade-in">
            <StockTable onStockChange={fetchStats} />
          </TabsContent>

          <TabsContent value="remboursements" className="animate-fade-in">
            <RefundSection onRefundComplete={fetchStats} />
          </TabsContent>

          <TabsContent value="historique" className="animate-fade-in">
            <SalesHistory onSaleChange={fetchStats} />
          </TabsContent>

          <TabsContent value="produits" className="animate-fade-in">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="admin" className="animate-fade-in">
            <AdminSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-primary/5 py-4 px-8 text-center no-print">
        <p className="text-sm text-muted-foreground">
          Association Natanjou © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
