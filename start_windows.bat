@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   NATANJOU BUVETTE - Démarrage
echo ========================================
echo.

echo Vérification de MongoDB...
echo (Assurez-vous que MongoDB est lancé)
echo.

echo Démarrage du Backend (Python)...
start "Natanjou Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

echo Attente du démarrage du backend (5 secondes)...
timeout /t 5 /nobreak >nul

echo Démarrage du Frontend (React)...
start "Natanjou Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   APPLICATION EN COURS DE DÉMARRAGE
echo ========================================
echo.
echo Deux fenêtres de terminal se sont ouvertes:
echo - Backend (API Python)
echo - Frontend (Interface React)
echo.
echo L'application sera accessible dans quelques secondes sur:
echo http://localhost:3000
echo.
echo Codes d'accès:
echo - Administrateur: natanjou2024
echo - Consultation:   2026
echo.
echo Pour arrêter l'application, fermez les deux fenêtres de terminal.
echo.
pause
