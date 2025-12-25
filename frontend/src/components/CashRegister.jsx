import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingBag, Trash2, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const CashRegister = ({ onSaleComplete, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, stockRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/stock`),
      ]);
      setProducts(productsRes.data);
      setStock(stockRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Get available stock for a product
  const getAvailableStock = (productId) => {
    const stockItem = stock.find((s) => s.product_id === productId);
    return stockItem ? stockItem.stock_final : 0;
  };

  // Get quantity already in cart for a product
  const getCartQuantity = (productId) => {
    const cartItem = cart.find((item) => item.product_id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const addToCart = (product) => {
    const availableStock = getAvailableStock(product.id);
    const inCart = getCartQuantity(product.id);
    
    if (availableStock <= 0) {
      toast.error(`${product.name} - Stock épuisé !`);
      return;
    }
    
    if (inCart >= availableStock) {
      toast.warning(`${product.name} - Stock insuffisant (${availableStock} disponible)`);
      return;
    }

    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const processSale = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      // Process each item in cart as separate sale
      for (const item of cart) {
        await axios.post(`${API}/sales`, {
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }

      toast.success(`Vente enregistrée: ${cartTotal.toFixed(2)} €`, {
        description: `${cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)`,
      });

      clearCart();
      onSaleComplete?.();
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error("Erreur lors de l'enregistrement de la vente");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Products Grid */}
      <div className="lg:col-span-2">
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">
          Produits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="product-card bg-card border-2 border-border hover:border-secondary cursor-pointer overflow-hidden"
              onClick={() => addToCart(product)}
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`product-${product.name.toLowerCase()}`}
            >
              <div className="aspect-square relative overflow-hidden bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground font-bold">
                  {product.price.toFixed(2)} €
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-sans font-bold text-foreground">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                  {product.category}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-1">
        <Card className="bg-card border-2 border-border sticky top-4" data-testid="cart">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Panier
              </h2>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid="clear-cart-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Panier vide</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliquez sur un produit pour l'ajouter
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-slide-in"
                    data-testid={`cart-item-${item.product_name.toLowerCase()}`}
                  >
                    <div className="flex-1">
                      <p className="font-sans font-medium text-foreground">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {item.unit_price.toFixed(2)} € × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="qty-btn bg-background hover:bg-destructive hover:text-white border border-border"
                        data-testid={`decrease-${item.product_name.toLowerCase()}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="qty-btn bg-background hover:bg-accent hover:text-white border border-border"
                        data-testid={`increase-${item.product_name.toLowerCase()}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="qty-btn text-destructive hover:bg-destructive hover:text-white"
                        data-testid={`remove-${item.product_name.toLowerCase()}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t-2 border-dashed border-border pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-serif text-lg font-bold">Total</span>
                    <span className="font-sans text-2xl font-bold tabular-nums text-secondary" data-testid="cart-total">
                      {cartTotal.toFixed(2)} €
                    </span>
                  </div>
                  <Button
                    onClick={processSale}
                    disabled={processing}
                    className="w-full bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all rounded-lg font-bold uppercase tracking-wide h-14 text-lg"
                    data-testid="validate-sale-btn"
                  >
                    {processing ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Valider
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashRegister;
