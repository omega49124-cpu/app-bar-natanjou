import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Package, Image, Eye } from "lucide-react";
import { toast } from "sonner";

export const ProductsManager = ({ readOnly = false }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "beverage",
    image_url: "",
  });

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      toast.error("Veuillez saisir un nom de produit");
      return;
    }
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      toast.error("Veuillez saisir un prix valide");
      return;
    }

    try {
      await axios.post(`${API}/products`, {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        image_url: newProduct.image_url || null,
      });

      toast.success(`Produit "${newProduct.name}" ajouté`);
      setNewProduct({ name: "", price: "", category: "beverage", image_url: "" });
      setShowAddDialog(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Erreur lors de l'ajout du produit");
    }
  };

  const handleDeleteProduct = async (product) => {
    try {
      await axios.delete(`${API}/products/${product.id}`);
      toast.success(`Produit "${product.name}" supprimé`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const categoryLabels = {
    beverage: "Boisson",
    dessert: "Dessert",
    alcohol: "Alcool",
    snack: "Snack",
    other: "Autre",
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
    <Card className="bg-card border-2 border-border" data-testid="products-manager">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
          Gestion des Produits
          {readOnly && <Eye className="w-4 h-4 text-yellow-600" />}
        </CardTitle>
        {!readOnly && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-secondary text-secondary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all"
                data-testid="add-product-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="add-product-dialog">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  Nouveau Produit
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nom du produit</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  placeholder="Ex: Coca-Cola"
                  className="border-2"
                  data-testid="product-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productPrice">Prix (€)</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="Ex: 1.50"
                  className="border-2"
                  data-testid="product-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productCategory">Catégorie</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category: value })
                  }
                >
                  <SelectTrigger className="border-2" data-testid="product-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beverage">Boisson</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="alcohol">Alcool</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productImage">URL de l'image (optionnel)</Label>
                <Input
                  id="productImage"
                  value={newProduct.image_url}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="border-2"
                  data-testid="product-image-input"
                />
              </div>
              <Button
                onClick={handleAddProduct}
                className="w-full bg-primary text-primary-foreground mt-4"
                data-testid="confirm-add-product-btn"
              >
                Ajouter le produit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucun produit</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cliquez sur "Ajouter un produit" pour commencer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-muted/30 border-2 border-border overflow-hidden"
                data-testid={`product-card-${product.name.toLowerCase()}`}
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                        {categoryLabels[product.category] || product.category}
                      </p>
                      <p className="font-bold text-lg text-secondary mt-2 tabular-nums">
                        {product.price.toFixed(2)} €
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-testid={`delete-product-${product.name.toLowerCase()}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{product.name}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProduct(product)}
                            className="bg-destructive text-destructive-foreground"
                            data-testid="confirm-delete-btn"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsManager;
