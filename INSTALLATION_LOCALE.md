# 🍊 Natanjou Buvette - Guide d'Installation Locale

Ce guide vous permet d'installer et d'exécuter l'application Natanjou Buvette sur votre ordinateur personnel.

---

## 📋 Prérequis

Avant de commencer, vous devez installer les logiciels suivants :

### 1. Python 3.8 ou supérieur
- **Windows** : Téléchargez depuis [python.org](https://www.python.org/downloads/)
  - ⚠️ Cochez "Add Python to PATH" lors de l'installation
- **Mac** : `brew install python3`
- **Linux** : `sudo apt install python3 python3-pip`

### 2. Node.js 18 ou supérieur
- **Windows/Mac** : Téléchargez depuis [nodejs.org](https://nodejs.org/)
- **Linux** : 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install nodejs
  ```

### 3. MongoDB
- **Option A - Installation locale** : [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Option B - MongoDB Atlas (Cloud gratuit)** : [mongodb.com/atlas](https://www.mongodb.com/atlas/database)

---

## 📥 Téléchargement du code

### Option 1 : Via GitHub
```bash
git clone https://github.com/VOTRE_USERNAME/natanjou-buvette.git
cd natanjou-buvette
```

### Option 2 : Télécharger le ZIP
1. Sur GitHub, cliquez sur "Code" → "Download ZIP"
2. Extrayez l'archive dans un dossier de votre choix

---

## 🔧 Installation

### Installation Automatique (Recommandée)

**Windows :**
1. Double-cliquez sur `install_windows.bat`
2. Attendez la fin de l'installation

**Mac/Linux :**
```bash
chmod +x install_unix.sh
./install_unix.sh
```

### Installation Manuelle

#### Étape 1 : Backend (Python)
```bash
cd backend
pip install -r requirements.txt
```

#### Étape 2 : Frontend (React)
```bash
cd frontend
npm install
```

#### Étape 3 : Configuration

Créez ou modifiez le fichier `backend/.env` :
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=natanjou_buvette
CORS_ORIGINS=*
```

Créez ou modifiez le fichier `frontend/.env` :
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 🚀 Lancement de l'application

### Lancement Automatique (Recommandé)

**Windows :**
1. Double-cliquez sur `start_windows.bat`

**Mac/Linux :**
```bash
./start_unix.sh
```

### Lancement Manuel

Ouvrez **deux terminaux** :

**Terminal 1 - Backend :**
```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```

---

## 🌐 Accès à l'application

Une fois lancée, ouvrez votre navigateur :

- **Application** : [http://localhost:3000](http://localhost:3000)
- **API Backend** : [http://localhost:8001](http://localhost:8001)

---

## 🔑 Codes d'accès

| Type d'accès | Code |
|--------------|------|
| **Administrateur** (toutes les fonctionnalités) | `natanjou2024` |
| **Consultation** (lecture seule) | `2026` |
| **Réinitialisation / Restauration** | `1967` |

---

## 📁 Structure des fichiers

```
natanjou-buvette/
├── backend/                 # Serveur API (Python/FastAPI)
│   ├── server.py           # Code principal du serveur
│   ├── requirements.txt    # Dépendances Python
│   └── .env               # Configuration (à créer)
│
├── frontend/               # Interface utilisateur (React)
│   ├── src/               # Code source React
│   ├── package.json       # Dépendances Node.js
│   └── .env              # Configuration (à créer)
│
├── install_windows.bat    # Script d'installation Windows
├── install_unix.sh        # Script d'installation Mac/Linux
├── start_windows.bat      # Script de lancement Windows
├── start_unix.sh          # Script de lancement Mac/Linux
└── INSTALLATION_LOCALE.md # Ce guide
```

---

## ❓ Dépannage

### Le backend ne démarre pas
- Vérifiez que MongoDB est lancé
- Vérifiez que le port 8001 n'est pas utilisé
- Vérifiez les logs d'erreur dans le terminal

### Le frontend ne démarre pas
- Vérifiez que Node.js est installé : `node --version`
- Supprimez `node_modules` et relancez `npm install`
- Vérifiez que le port 3000 n'est pas utilisé

### Erreur de connexion à la base de données
- Vérifiez que MongoDB est lancé
- Vérifiez l'URL dans `backend/.env`
- Pour MongoDB Atlas, vérifiez votre connexion internet

### Les données ne s'affichent pas
- Vérifiez que le backend est lancé (http://localhost:8001/health)
- Vérifiez la configuration `REACT_APP_BACKEND_URL` dans `frontend/.env`

---

## 💾 Sauvegarde des données

Pour sauvegarder vos données :
1. Connectez-vous avec le code administrateur (`natanjou2024`)
2. Allez dans l'onglet "Administration"
3. Cliquez sur "Télécharger la sauvegarde"

Pour restaurer :
1. Cliquez sur "Importer une sauvegarde"
2. Sélectionnez votre fichier `.json`
3. Entrez le code `1967` pour confirmer

---

## 📞 Support

Association Natanjou © 2025
