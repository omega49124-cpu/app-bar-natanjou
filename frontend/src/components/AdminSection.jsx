import { useState, useRef } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Download, 
  Upload, 
  RotateCcw, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  Database,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export const AdminSection = () => {
  const [loading, setLoading] = useState(false);
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetError, setResetError] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreData, setRestoreData] = useState(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const fileInputRef = useRef(null);

  // Backup - Download all data as JSON
  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/backup`);
      const data = response.data;
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `natanjou_backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Sauvegarde téléchargée avec succès");
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Erreur lors de la création de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Restore - Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith(".json")) {
      toast.error("Veuillez sélectionner un fichier JSON");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.data || !data.version) {
          toast.error("Format de fichier invalide");
          return;
        }
        setRestoreData(data);
        setRestoreFileName(file.name);
        setShowRestoreDialog(true);
      } catch (err) {
        toast.error("Erreur de lecture du fichier JSON");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = "";
  };

  // Restore - Confirm and execute
  const handleRestoreConfirm = async () => {
    if (!restoreData) return;
    
    if (restoreCode !== "1967") {
      setRestoreError("Code incorrect");
      return;
    }
    
    setLoading(true);
    setRestoreError("");
    try {
      const response = await axios.post(`${API}/admin/restore`, restoreData);
      toast.success(`Données restaurées: ${response.data.restored.products} produits, ${response.data.restored.sales} ventes`);
      setShowRestoreDialog(false);
      setRestoreData(null);
      setRestoreFileName("");
      setRestoreCode("");
      setRestoreError("");
      
      // Reload page to refresh all data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error restoring data:", error);
      toast.error("Erreur lors de la restauration des données");
    } finally {
      setLoading(false);
    }
  };

  // Factory Reset - Open dialog
  const handleFactoryResetClick = () => {
    setShowFactoryResetDialog(true);
    setResetCode("");
    setResetError("");
  };

  // Factory Reset - Confirm and execute
  const handleFactoryResetConfirm = async () => {
    if (resetCode !== "1967") {
      setResetError("Code incorrect");
      return;
    }
    
    setLoading(true);
    setResetError("");
    
    try {
      await axios.post(`${API}/admin/factory-reset`);
      toast.success("Application remise à zéro avec succès");
      setShowFactoryResetDialog(false);
      setResetCode("");
      
      // Reload page to refresh all data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error factory reset:", error);
      toast.error("Erreur lors de la remise à zéro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="bg-card border-2 border-border">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Administration
          </CardTitle>
          <CardDescription>
            Gérez les sauvegardes et la configuration de l'application
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Backup & Restore Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <Card className="bg-card border-2 border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
              <Download className="w-5 h-5 text-accent" />
              Sauvegarde
            </CardTitle>
            <CardDescription>
              Téléchargez une copie complète de toutes vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/10 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">La sauvegarde inclut :</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Tous les produits et leurs images</li>
                <li>L'état complet du stock</li>
                <li>L'historique des ventes</li>
                <li>Les remboursements</li>
              </ul>
            </div>
            <Button
              onClick={handleBackup}
              disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="backup-btn"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Télécharger la sauvegarde
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="bg-card border-2 border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-secondary" />
              Restauration
            </CardTitle>
            <CardDescription>
              Restaurez vos données à partir d'une sauvegarde
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Attention :</strong> La restauration remplacera toutes les données actuelles par celles de la sauvegarde.
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
              data-testid="restore-file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="outline"
              className="w-full border-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
              data-testid="restore-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer une sauvegarde
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Factory Reset Section */}
      <Card className="bg-card border-2 border-destructive/50">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zone Dangereuse
          </CardTitle>
          <CardDescription>
            Actions irréversibles - Procédez avec précaution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-destructive">Remise à zéro générale</p>
            <p className="text-sm text-muted-foreground">
              Cette action supprimera <strong>TOUTES</strong> les données et réinitialisera l'application comme si elle était utilisée pour la première fois :
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Suppression de tous les produits personnalisés</li>
              <li>Suppression de tout le stock</li>
              <li>Suppression de toutes les ventes</li>
              <li>Suppression de tous les remboursements</li>
              <li>Recréation des 4 produits par défaut avec stock à 0</li>
            </ul>
          </div>
          <Button
            onClick={handleFactoryResetClick}
            variant="outline"
            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
            data-testid="factory-reset-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Remise à zéro générale
          </Button>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md" data-testid="restore-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-secondary" />
              Confirmer la restauration
            </DialogTitle>
            <DialogDescription className="text-base mt-4">
              Vous êtes sur le point de restaurer les données depuis :
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-secondary/10 p-4 rounded-lg">
              <p className="font-mono text-sm break-all">{restoreFileName}</p>
              {restoreData && (
                <div className="mt-3 text-sm text-muted-foreground space-y-1">
                  <p>• {restoreData.data?.products?.length || 0} produits</p>
                  <p>• {restoreData.data?.stock?.length || 0} entrées de stock</p>
                  <p>• {restoreData.data?.sales?.length || 0} ventes</p>
                  <p>• {restoreData.data?.refunds?.length || 0} remboursements</p>
                </div>
              )}
            </div>
            
            <p className="text-sm text-destructive font-medium">
              ⚠️ Toutes les données actuelles seront remplacées.
            </p>

            <div className="space-y-2">
              <Label htmlFor="restoreCode" className="font-medium">
                Entrez le code de confirmation
              </Label>
              <Input
                id="restoreCode"
                type="password"
                value={restoreCode}
                onChange={(e) => {
                  setRestoreCode(e.target.value);
                  setRestoreError("");
                }}
                placeholder="Code de sécurité"
                className="border-2"
                data-testid="restore-code-input"
              />
              {restoreError && (
                <p className="text-sm text-destructive font-medium">{restoreError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRestoreDialog(false);
                  setRestoreData(null);
                  setRestoreFileName("");
                  setRestoreCode("");
                  setRestoreError("");
                }}
                className="flex-1 border-2"
                data-testid="cancel-restore-btn"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRestoreConfirm}
                disabled={!restoreCode || loading}
                className="flex-1 bg-secondary text-secondary-foreground"
                data-testid="confirm-restore-btn"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Restaurer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Factory Reset Confirmation Dialog */}
      <Dialog open={showFactoryResetDialog} onOpenChange={setShowFactoryResetDialog}>
        <DialogContent className="max-w-md" data-testid="factory-reset-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Remise à zéro générale
            </DialogTitle>
            <DialogDescription className="text-base mt-4">
              <strong className="text-destructive">ATTENTION :</strong> Cette action est irréversible !
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-destructive/10 p-4 rounded-lg">
              <li>Tous les <strong>produits</strong> seront supprimés</li>
              <li>Tout le <strong>stock</strong> sera effacé</li>
              <li>Toutes les <strong>ventes</strong> seront supprimées</li>
              <li>Tous les <strong>remboursements</strong> seront effacés</li>
              <li>Les 4 produits par défaut seront recréés</li>
            </ul>
            
            <p className="text-sm text-muted-foreground">
              💡 <strong>Conseil :</strong> Faites une sauvegarde avant de continuer.
            </p>

            <div className="space-y-2">
              <Label htmlFor="factoryResetCode" className="font-medium">
                Entrez le code de confirmation
              </Label>
              <Input
                id="factoryResetCode"
                type="password"
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setResetError("");
                }}
                placeholder="Code de sécurité"
                className="border-2"
                data-testid="factory-reset-code-input"
              />
              {resetError && (
                <p className="text-sm text-destructive font-medium">{resetError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFactoryResetDialog(false)}
                className="flex-1 border-2"
                data-testid="cancel-factory-reset-btn"
              >
                Annuler
              </Button>
              <Button
                onClick={handleFactoryResetConfirm}
                disabled={!resetCode || loading}
                className="flex-1 bg-destructive text-destructive-foreground"
                data-testid="confirm-factory-reset-btn"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Confirmer la remise à zéro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSection;
