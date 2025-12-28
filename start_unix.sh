#!/bin/bash

echo ""
echo "========================================"
echo "  NATANJOU BUVETTE - Démarrage"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Vérification de MongoDB..."
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}MongoDB est installé${NC}"
else
    echo -e "${YELLOW}ATTENTION: MongoDB ne semble pas installé localement${NC}"
    echo "Assurez-vous d'avoir configuré une connexion MongoDB (locale ou Atlas)"
fi
echo ""

# Démarrage du Backend
echo "Démarrage du Backend (Python)..."
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Backend démarré${NC} (PID: $BACKEND_PID)"

# Attente
echo "Attente du démarrage du backend (5 secondes)..."
sleep 5

# Démarrage du Frontend
echo "Démarrage du Frontend (React)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend démarré${NC} (PID: $FRONTEND_PID)"

echo ""
echo "========================================"
echo -e "  ${GREEN}APPLICATION DÉMARRÉE!${NC}"
echo "========================================"
echo ""
echo "L'application est accessible sur:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""
echo "Codes d'accès:"
echo "  - Administrateur: natanjou2024"
echo "  - Consultation:   2026"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"
echo ""

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Application arrêtée."
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Attendre
wait
