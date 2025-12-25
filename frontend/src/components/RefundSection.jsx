import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Receipt, Printer, X } from "lucide-react";
import { toast } from "sonner";

export const RefundSection = ({ onRefundComplete }) => {
  const [products, setProducts] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [productsRes, refundsRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/refunds`),
      ]);
      setProducts(productsRes.data);
      setRefunds(refundsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        product_name: products[0].name,
        quantity: 1,
        unit_price: products[0].price,
      },
    ]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === "product_name") {
      const product = products.find((p) => p.name === value);
      newItems[index] = {
        ...newItems[index],
        product_name: value,
        unit_price: product?.price || 0,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const resetForm = () => {
    setMemberName("");
    setReason("");
    setItems([]);
  };

  const submitRefund = async () => {
    if (!memberName.trim()) {
      toast.error("Veuillez saisir le nom de l'adhérent");
      return;
    }
    if (items.length === 0) {
      toast.error("Veuillez ajouter au moins un article");
      return;
    }
    if (!reason.trim()) {
      toast.error("Veuillez saisir le motif du remboursement");
      return;
    }

    try {
      const response = await axios.post(`${API}/refunds`, {
        member_name: memberName,
        items: items,
        total_amount: totalAmount,
        reason: reason,
      });

      toast.success("Remboursement enregistré");
      setCurrentReceipt(response.data);
      setShowReceipt(true);
      resetForm();
      fetchData();
      onRefundComplete?.();
    } catch (error) {
      console.error("Error creating refund:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const viewReceipt = (refund) => {
    setCurrentReceipt(refund);
    setShowReceipt(true);
  };

  const printReceipt = () => {
    if (!currentReceipt) return;

    const printWindow = window.open("", "", "width=400,height=600");
    const date = new Date(currentReceipt.timestamp);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de Remboursement</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 14px;
            }
            .receipt-number {
              text-align: center;
              font-weight: bold;
              margin: 15px 0;
              padding: 10px;
              background: #f0f0f0;
            }
            .info {
              margin: 15px 0;
            }
            .info p {
              margin: 5px 0;
            }
            .items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 15px 0;
              margin: 15px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 16px;
              margin: 15px 0;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .reason {
              margin: 15px 0;
              padding: 10px;
              background: #f9f9f9;
              font-style: italic;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              color: #666;
            }
            .signature {
              margin-top: 40px;
              border-top: 1px solid #000;
              padding-top: 5px;
              text-align: center;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NATANJOU</h1>
            <p>Reçu de Remboursement</p>
          </div>
          
          <div class="receipt-number">
            N° ${currentReceipt.receipt_number}
          </div>
          
          <div class="info">
            <p><strong>Adhérent:</strong> ${currentReceipt.member_name}</p>
            <p><strong>Date:</strong> ${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString("fr-FR")}</p>
          </div>
          
          <div class="items">
            ${currentReceipt.items
              .map(
                (item) => `
              <div class="item">
                <span>${item.quantity}x ${item.product_name}</span>
                <span>${(item.quantity * item.unit_price).toFixed(2)} €</span>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="total">
            <span>TOTAL REMBOURSÉ</span>
            <span>${currentReceipt.total_amount.toFixed(2)} €</span>
          </div>
          
          <div class="reason">
            <strong>Motif:</strong> ${currentReceipt.reason}
          </div>
          
          <div class="signature">
            Signature de l'adhérent
          </div>
          
          <div class="footer">
            <p>Association Natanjou</p>
            <p>Merci de votre confiance</p>
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="skeleton h-96 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <Card className="bg-card border-2 border-border" data-testid="refund-form-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold">
            Nouveau Remboursement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="memberName" className="font-sans font-medium">
              Nom de l'adhérent
            </Label>
            <Input
              id="memberName"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="border-2"
              data-testid="member-name-input"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-sans font-medium">Articles remboursés</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                className="border-2"
                data-testid="add-item-btn"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun article ajouté
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    data-testid={`refund-item-${index}`}
                  >
                    <select
                      value={item.product_name}
                      onChange={(e) =>
                        updateItem(index, "product_name", e.target.value)
                      }
                      className="flex-1 h-10 rounded-lg border-2 border-border bg-input px-3 font-sans"
                      data-testid={`item-product-${index}`}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.price.toFixed(2)} €)
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                      className="w-20 text-center border-2"
                      data-testid={`item-qty-${index}`}
                    />
                    <span className="font-bold tabular-nums w-20 text-right">
                      {(item.quantity * item.unit_price).toFixed(2)} €
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-border">
                <span className="font-serif font-bold">Total à rembourser</span>
                <span className="font-sans text-xl font-bold tabular-nums text-destructive" data-testid="refund-total">
                  {totalAmount.toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="font-sans font-medium">
              Motif du remboursement
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Article défectueux, erreur de commande..."
              className="border-2 min-h-[100px]"
              data-testid="reason-input"
            />
          </div>

          <Button
            onClick={submitRefund}
            disabled={!memberName || items.length === 0 || !reason}
            className="w-full bg-destructive text-destructive-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all rounded-lg font-bold uppercase tracking-wide h-12"
            data-testid="submit-refund-btn"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Enregistrer le remboursement
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="bg-card border-2 border-border" data-testid="refund-history-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold">
            Historique des remboursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refunds.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucun remboursement</p>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-border overflow-hidden">
              <Table data-testid="refunds-table">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-serif font-bold">N° Reçu</TableHead>
                    <TableHead className="font-serif font-bold">Adhérent</TableHead>
                    <TableHead className="font-serif font-bold text-right">
                      Montant
                    </TableHead>
                    <TableHead className="font-serif font-bold text-center">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .slice(0, 10)
                    .map((refund) => (
                      <TableRow key={refund.id} data-testid={`refund-row-${refund.id}`}>
                        <TableCell className="font-mono text-xs">
                          {refund.receipt_number}
                        </TableCell>
                        <TableCell className="font-sans font-medium">
                          {refund.member_name}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-destructive">
                          {refund.total_amount.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewReceipt(refund)}
                            className="border-2"
                            data-testid={`view-receipt-${refund.id}`}
                          >
                            <Receipt className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="receipt-modal">
          <div className="receipt-paper p-8 relative">
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {currentReceipt && (
              <>
                <div className="text-center border-b-2 border-dashed border-gray-200 pb-6 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">
                    NATANJOU
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Reçu de Remboursement
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-3 text-center mb-6">
                  <p className="font-mono text-sm font-bold" data-testid="receipt-number">
                    {currentReceipt.receipt_number}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Adhérent:</span>
                    <span className="font-medium" data-testid="receipt-member">
                      {currentReceipt.member_name}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">
                      {new Date(currentReceipt.timestamp).toLocaleDateString(
                        "fr-FR"
                      )}
                    </span>
                  </p>
                </div>

                <div className="border-t border-b border-dashed border-gray-200 py-4 my-4">
                  {currentReceipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-medium tabular-nums">
                        {(item.quantity * item.unit_price).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-4 border-t-2 border-gray-900">
                  <span className="font-serif text-lg font-bold">
                    TOTAL REMBOURSÉ
                  </span>
                  <span className="font-sans text-2xl font-bold tabular-nums" data-testid="receipt-total">
                    {currentReceipt.total_amount.toFixed(2)} €
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <span className="font-medium">Motif:</span>{" "}
                    <span className="italic">{currentReceipt.reason}</span>
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                  <div className="border-t border-gray-400 pt-2 mx-auto w-48">
                    <p className="text-xs text-gray-500">Signature de l'adhérent</p>
                  </div>
                </div>

                <Button
                  onClick={printReceipt}
                  className="w-full mt-6 bg-primary text-primary-foreground no-print"
                  data-testid="print-receipt-btn"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer le reçu
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundSection;
