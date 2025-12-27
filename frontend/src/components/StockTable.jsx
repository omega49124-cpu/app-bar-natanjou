import { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Printer, RefreshCw, Save, FileSpreadsheet, Calculator, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const StockTable = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetError, setResetError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const printRef = useRef(null);

  const fetchStock = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
      setStock(response.data);
    } catch (error) {
      console.error("Error fetching stock:", error);
      toast.error("Erreur lors du chargement du stock");
    } finally {
      setLoading(false);
    }
  };

  const recalculateStock = async () => {
    setRecalculating(true);
    try {
      await axios.post(`${API}/stock/recalculate`);
      toast.success("Stock recalculé à partir des ventes");
      fetchStock();
    } catch (error) {
      console.error("Error recalculating stock:", error);
      toast.error("Erreur lors du recalcul");
    } finally {
      setRecalculating(false);
    }
  };

  const handleResetClick = () => {
    setShowResetDialog(true);
    setResetCode("");
    setResetError("");
  };

  const handleResetConfirm = async () => {
    if (resetCode !== "natanjou2024") {
      setResetError("Code incorrect");
      return;
    }

    setResetting(true);
    setResetError("");
    
    try {
      await axios.post(`${API}/stock/reset`);
      toast.success("Base de données réinitialisée avec succès");
      setShowResetDialog(false);
      setResetCode("");
      fetchStock();
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const startEditing = (item) => {
    setEditingId(item.product_id);
    setEditValues({
      stock_initial: item.stock_initial,
      achats: item.achats,
      ventes: item.ventes,
      pertes: item.pertes,
      stock_final: item.stock_final,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (productId) => {
    try {
      // Calculate stock_final automatically: stock_initial + achats - ventes - pertes
      const calculatedStockFinal = 
        (editValues.stock_initial || 0) + 
        (editValues.achats || 0) - 
        (editValues.ventes || 0) - 
        (editValues.pertes || 0);
      
      const dataToSend = {
        ...editValues,
        stock_final: calculatedStockFinal
      };
      
      await axios.put(`${API}/stock/${productId}`, dataToSend);
      toast.success("Stock mis à jour");
      fetchStock();
      cancelEditing();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open("", "", "width=800,height=600");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tableau de Stock - Natanjou</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
            }
            h1 {
              text-align: center;
              margin-bottom: 5px;
            }
            h2 {
              text-align: center;
              font-size: 14px;
              color: #666;
              margin-top: 0;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 10px;
              text-align: center;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .negative {
              color: red;
            }
          </style>
        </head>
        <body>
          <h1>Association Natanjou</h1>
          <h2>Tableau de Stock - ${new Date().toLocaleDateString("fr-FR")}</h2>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock Initial</th>
                <th>Achats</th>
                <th>Ventes</th>
                <th>Pertes</th>
                <th>Stock Final</th>
              </tr>
            </thead>
            <tbody>
              ${stock
                .map(
                  (item) => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.stock_initial}</td>
                  <td>${item.achats}</td>
                  <td>${item.ventes}</td>
                  <td>${item.pertes}</td>
                  <td class="${item.stock_final < 0 ? "negative" : ""}">${item.stock_final}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Imprimé le ${new Date().toLocaleString("fr-FR")}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const exportCSV = () => {
    const headers = ["Produit", "Stock Initial", "Achats", "Ventes", "Pertes", "Stock Final", "Date"];
    const rows = stock.map((item) => [
      item.product_name,
      item.stock_initial,
      item.achats,
      item.ventes,
      item.pertes,
      item.stock_final,
      item.date,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock_natanjou_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Association Natanjou", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Tableau de Stock", 105, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 105, 38, { align: "center" });
    
    // Table data
    const tableData = stock.map((item) => [
      item.product_name,
      item.stock_initial.toString(),
      `+${item.achats}`,
      `-${item.ventes}`,
      `-${item.pertes}`,
      item.stock_final.toString(),
    ]);
    
    // Generate table using autoTable
    autoTable(doc, {
      startY: 45,
      head: [["Produit", "Stock Initial", "Achats", "Ventes", "Pertes", "Stock Final"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [66, 139, 130],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 45 },
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Genere le ${new Date().toLocaleString("fr-FR")}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Stock Final = Stock Initial + Achats - Ventes - Pertes",
      105,
      pageHeight - 15,
      { align: "center" }
    );
    
    // Save
    doc.save(`stock_natanjou_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Export PDF telecharge");
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
    <Card className="bg-card border-2 border-border" data-testid="stock-table-card">
      <CardHeader className="flex flex-row items-center justify-between no-print">
        <CardTitle className="font-serif text-xl font-bold">
          Tableau de Stock
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={recalculateStock}
            disabled={recalculating}
            className="border-2 border-accent text-accent hover:bg-accent hover:text-white"
            data-testid="recalculate-stock-btn"
          >
            {recalculating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            Recalculer
          </Button>
          <Button
            variant="outline"
            onClick={fetchStock}
            className="border-2"
            data-testid="refresh-stock-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            className="border-2"
            data-testid="export-stock-csv-btn"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
            data-testid="export-stock-pdf-btn"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-secondary text-secondary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all"
            data-testid="print-stock-btn"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button
            variant="outline"
            onClick={handleResetClick}
            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
            data-testid="reset-stock-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md" data-testid="reset-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Réinitialisation complète
            </DialogTitle>
            <DialogDescription className="text-base mt-4">
              <strong className="text-destructive">ATTENTION :</strong> Cette action va remettre à zéro :
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-destructive/10 p-4 rounded-lg">
              <li>Toutes les <strong>ventes</strong> seront supprimées</li>
              <li>Le compteur de <strong>ventes</strong> du stock passera à 0</li>
              <li>Le <strong>stock final</strong> sera recalculé</li>
            </ul>
            
            <p className="text-sm text-muted-foreground">
              Les données de <strong>stock initial</strong>, <strong>achats</strong> et <strong>pertes</strong> seront conservées.
            </p>

            <div className="space-y-2">
              <Label htmlFor="resetCode" className="font-medium">
                Entrez le code de confirmation
              </Label>
              <Input
                id="resetCode"
                type="password"
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setResetError("");
                }}
                placeholder="Code de sécurité"
                className="border-2"
                data-testid="reset-code-input"
              />
              {resetError && (
                <p className="text-sm text-destructive font-medium">{resetError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="flex-1 border-2"
                data-testid="cancel-reset-btn"
              >
                Annuler
              </Button>
              <Button
                onClick={handleResetConfirm}
                disabled={!resetCode || resetting}
                className="flex-1 bg-destructive text-destructive-foreground"
                data-testid="confirm-reset-btn"
              >
                {resetting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Confirmer la réinitialisation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CardContent ref={printRef}>
        <div className="rounded-lg border-2 border-border overflow-hidden">
          <Table className="stock-table" data-testid="stock-table">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-serif font-bold text-foreground">
                  Produit
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center">
                  Stock Initial
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center">
                  Achats
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center">
                  Ventes
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center">
                  Pertes
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center">
                  Stock Final
                </TableHead>
                <TableHead className="font-serif font-bold text-foreground text-center no-print">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item) => (
                <TableRow key={item.id} data-testid={`stock-row-${item.product_name.toLowerCase()}`}>
                  <TableCell className="font-sans font-medium">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.product_id ? (
                      <Input
                        type="number"
                        value={editValues.stock_initial}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            stock_initial: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center mx-auto"
                        data-testid="edit-stock-initial"
                      />
                    ) : (
                      <span className="tabular-nums">{item.stock_initial}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.product_id ? (
                      <Input
                        type="number"
                        value={editValues.achats}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            achats: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center mx-auto"
                        data-testid="edit-achats"
                      />
                    ) : (
                      <span className="tabular-nums text-accent font-medium">
                        +{item.achats}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.product_id ? (
                      <Input
                        type="number"
                        value={editValues.ventes}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            ventes: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center mx-auto"
                        data-testid="edit-ventes"
                      />
                    ) : (
                      <span className="tabular-nums text-secondary font-medium">
                        -{item.ventes}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.product_id ? (
                      <Input
                        type="number"
                        value={editValues.pertes}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            pertes: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center mx-auto"
                        data-testid="edit-pertes"
                      />
                    ) : (
                      <span className="tabular-nums text-destructive font-medium">
                        -{item.pertes}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingId === item.product_id ? (
                      <Input
                        type="number"
                        value={editValues.stock_final}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            stock_final: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center mx-auto"
                        data-testid="edit-stock-final"
                      />
                    ) : (
                      <span
                        className={`tabular-nums font-bold text-lg ${
                          item.stock_final < 0
                            ? "text-destructive"
                            : item.stock_final === 0
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {item.stock_final}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center no-print">
                    {editingId === item.product_id ? (
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(item.product_id)}
                          className="bg-accent text-accent-foreground"
                          data-testid="save-stock-btn"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          data-testid="cancel-edit-btn"
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(item)}
                        className="border-2"
                        data-testid={`edit-btn-${item.product_name.toLowerCase()}`}
                      >
                        Modifier
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Stock Final = Stock Initial + Achats - Ventes - Pertes
        </p>
      </CardContent>
    </Card>
  );
};

export default StockTable;
