import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Download, FileSpreadsheet, Search, Filter, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [products, setProducts] = useState([]);

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        axios.get(`${API}/sales`),
        axios.get(`${API}/products`),
      ]);
      setSales(salesRes.data);
      setFilteredSales(salesRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllSales = async () => {
    try {
      await axios.delete(`${API}/sales`);
      toast.success("Historique des ventes supprimé");
      setSales([]);
      setFilteredSales([]);
    } catch (error) {
      console.error("Error deleting sales:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyFilters = () => {
    let filtered = [...sales];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(
        (sale) => new Date(sale.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (sale) => new Date(sale.timestamp) <= endDateTime
      );
    }

    // Filter by product
    if (productFilter !== "all") {
      filtered = filtered.filter((sale) => sale.product_name === productFilter);
    }

    setFilteredSales(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, productFilter, sales]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setProductFilter("all");
  };

  // Calculate stats
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Group by product for summary
  const productSummary = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.product_name]) {
      acc[sale.product_name] = { quantity: 0, revenue: 0 };
    }
    acc[sale.product_name].quantity += sale.quantity;
    acc[sale.product_name].revenue += sale.total;
    return acc;
  }, {});

  const exportCSV = () => {
    const headers = ["Date", "Heure", "Produit", "Quantité", "Prix Unitaire", "Total"];
    const rows = filteredSales.map((sale) => {
      const date = new Date(sale.timestamp);
      return [
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR"),
        sale.product_name,
        sale.quantity,
        sale.unit_price.toFixed(2),
        sale.total.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ventes_natanjou_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  if (loading) {
    return (
      <Card className="bg-card border-2 border-border">
        <CardContent className="p-8">
          <div className="skeleton h-64 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-2 border-border" data-testid="sales-filters">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-2"
                data-testid="start-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-2"
                data-testid="end-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="border-2" data-testid="product-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-2"
                data-testid="reset-filters-btn"
              >
                Réinitialiser
              </Button>
              <Button
                onClick={exportCSV}
                className="bg-accent text-accent-foreground"
                data-testid="export-csv-btn"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                    data-testid="delete-sales-btn"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer tout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer l'historique ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes les ventes enregistrées seront supprimées définitivement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllSales}
                      className="bg-destructive text-destructive-foreground"
                      data-testid="confirm-delete-sales-btn"
                    >
                      Supprimer tout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-2 border-border">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Chiffre d'affaires
            </p>
            <p className="font-sans text-3xl font-bold tabular-nums text-secondary mt-2" data-testid="total-revenue">
              {totalRevenue.toFixed(2)} €
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Articles vendus
            </p>
            <p className="font-sans text-3xl font-bold tabular-nums mt-2" data-testid="total-items">
              {totalItems}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-2 border-border">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Transactions
            </p>
            <p className="font-sans text-3xl font-bold tabular-nums mt-2" data-testid="total-transactions">
              {filteredSales.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Summary */}
      {Object.keys(productSummary).length > 0 && (
        <Card className="bg-card border-2 border-border" data-testid="product-summary">
          <CardHeader>
            <CardTitle className="font-serif text-lg font-bold">
              Résumé par produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(productSummary).map(([name, data]) => (
                <div
                  key={name}
                  className="p-4 bg-muted/50 rounded-lg"
                  data-testid={`summary-${name.toLowerCase()}`}
                >
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.quantity} vendus
                  </p>
                  <p className="font-bold text-secondary tabular-nums">
                    {data.revenue.toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Table */}
      <Card className="bg-card border-2 border-border" data-testid="sales-history-table">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold">
            Historique des ventes ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucune vente trouvée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Modifiez les filtres pour voir plus de résultats
              </p>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-border overflow-hidden max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="font-serif font-bold">Date</TableHead>
                    <TableHead className="font-serif font-bold">Heure</TableHead>
                    <TableHead className="font-serif font-bold">Produit</TableHead>
                    <TableHead className="font-serif font-bold text-center">
                      Qté
                    </TableHead>
                    <TableHead className="font-serif font-bold text-right">
                      Prix U.
                    </TableHead>
                    <TableHead className="font-serif font-bold text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((sale) => {
                      const date = new Date(sale.timestamp);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="tabular-nums">
                            {date.toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {date.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {sale.product_name}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {sale.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {sale.unit_price.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-secondary">
                            {sale.total.toFixed(2)} €
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;
