@echo off
echo.
echo ========================================
echo   NATANJOU BUVETTE - Demarrage
echo ========================================
echo.

echo Verification de MongoDB...
echo (Assurez-vous que MongoDB est lance)
echo.

echo Demarrage du Backend Python...
start "Natanjou Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

echo Attente du demarrage du backend 5 secondes...
timeout /t 5 /nobreak >nul

echo Demarrage du Frontend React...
start "Natanjou Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   APPLICATION EN COURS DE DEMARRAGE
echo ========================================
echo.
echo Deux fenetres de terminal se sont ouvertes:
echo - Backend (API Python)
echo - Frontend (Interface React)
echo.
echo L application sera accessible dans quelques secondes sur:
echo http://localhost:3000
echo.
echo Codes d acces:
echo - Administrateur: natanjou2024
echo - Consultation:   2026
echo.
echo Pour arreter l application, fermez les deux fenetres de terminal.
echo.
pause
