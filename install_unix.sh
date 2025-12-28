#!/bin/bash

echo ""
echo "========================================"
echo "  NATANJOU BUVETTE - Installation"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Vérification Python
echo "[1/4] Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERREUR: Python3 n'est pas installé!${NC}"
    echo "Installez Python:"
    echo "  - Mac: brew install python3"
    echo "  - Linux: sudo apt install python3 python3-pip"
    exit 1
fi
echo -e "${GREEN}OK${NC} - Python $(python3 --version)"

# Vérification Node.js
echo ""
echo "[2/4] Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERREUR: Node.js n'est pas installé!${NC}"
    echo "Téléchargez Node.js depuis: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}OK${NC} - Node.js $(node --version)"

# Installation Backend
echo ""
echo "[3/4] Installation des dépendances Backend (Python)..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}ERREUR lors de l'installation des dépendances Python!${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}OK${NC} - Backend installé"

# Installation Frontend
echo ""
echo "[4/4] Installation des dépendances Frontend (React)..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERREUR lors de l'installation des dépendances Node.js!${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}OK${NC} - Frontend installé"

# Configuration des fichiers .env
echo ""
echo "========================================"
echo "  Configuration des fichiers .env"
echo "========================================"
echo ""

if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=natanjou_buvette
CORS_ORIGINS=*
EOF
    echo "Fichier backend/.env créé"
else
    echo "Fichier backend/.env existe déjà"
fi

if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo "Fichier frontend/.env créé"
else
    echo "Fichier frontend/.env existe déjà"
fi

# Rendre les scripts exécutables
chmod +x start_unix.sh

echo ""
echo "========================================"
echo -e "  ${GREEN}INSTALLATION TERMINÉE!${NC}"
echo "========================================"
echo ""
echo "Pour lancer l'application, exécutez: ./start_unix.sh"
echo ""
echo "IMPORTANT: Assurez-vous que MongoDB est installé et lancé!"
echo "  - Mac: brew services start mongodb-community"
 echo "  - Linux: sudo systemctl start mongod"
echo ""
