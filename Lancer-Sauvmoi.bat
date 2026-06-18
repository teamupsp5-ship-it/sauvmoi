@echo off
REM ============================================================
REM   Sauv'Moi - Lanceur en un clic (Windows)
REM   Double-cliquez sur ce fichier pour demarrer l'application.
REM ============================================================
title Sauv'Moi - Serveur local
cd /d "%~dp0"

echo.
echo   ====================================
echo      Sauv'Moi - demarrage en cours
echo   ====================================
echo.

REM 1) Verifier que Node.js est installe
where node >nul 2>nul
if errorlevel 1 (
  echo   [ERREUR] Node.js n'est pas installe.
  echo   Telechargez-le sur https://nodejs.org puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

REM 2) Installer les dependances la premiere fois seulement
if not exist "node_modules" (
  echo   Premiere utilisation : installation des dependances...
  echo   ^(cela peut prendre une minute, une seule fois^)
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERREUR] L'installation a echoue. Verifiez votre connexion internet.
    pause
    exit /b 1
  )
)

REM 3) Ouvrir le navigateur sur l'application (apres un court delai)
echo   Ouverture du navigateur sur http://localhost:3000 ...
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"

REM 4) Demarrer le serveur (reste ouvert ; fermez cette fenetre pour arreter)
echo.
echo   L'application tourne. NE FERMEZ PAS cette fenetre pendant la demo.
echo   Pour arreter : fermez cette fenetre ou appuyez sur Ctrl+C.
echo.
call npm start

pause
