@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   NATANJOU BUVETTE - Installation
echo ========================================
echo.

echo [1/4] Vérification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installé!
    echo Téléchargez Python depuis: https://www.python.org/downloads/
    echo N'oubliez pas de cocher "Add Python to PATH"
    pause
    exit /b 1
)
echo OK - Python installé

echo.
echo [2/4] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installé!
    echo Téléchargez Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js installé

echo.
echo [3/4] Installation des dépendances Backend (Python)...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation des dépendances Python!
    pause
    exit /b 1
)
cd ..
echo OK - Backend installé

echo.
echo [4/4] Installation des dépendances Frontend (React)...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation des dépendances Node.js!
    pause
    exit /b 1
)
cd ..
echo OK - Frontend installé

echo.
echo ========================================
echo   Configuration des fichiers .env
echo ========================================
echo.

if not exist backend\.env (
    echo MONGO_URL=mongodb://localhost:27017> backend\.env
    echo DB_NAME=natanjou_buvette>> backend\.env
    echo CORS_ORIGINS=*>> backend\.env
    echo Fichier backend\.env créé
) else (
    echo Fichier backend\.env existe déjà
)

if not exist frontend\.env (
    echo REACT_APP_BACKEND_URL=http://localhost:8001> frontend\.env
    echo Fichier frontend\.env créé
) else (
    echo Fichier frontend\.env existe déjà
)

echo.
echo ========================================
echo   INSTALLATION TERMINÉE!
echo ========================================
echo.
echo Pour lancer l'application, exécutez: start_windows.bat
echo.
echo IMPORTANT: Assurez-vous que MongoDB est installé et lancé!
echo Téléchargez MongoDB: https://www.mongodb.com/try/download/community
echo.
pause
