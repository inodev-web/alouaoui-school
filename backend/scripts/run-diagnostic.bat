@echo off
echo Script de diagnostic Windows
echo ===========================

cd /d "%~dp0\.."

echo.
echo Verification de PHP...
php --version
if %errorlevel% neq 0 (
    echo Erreur: PHP non trouve
    pause
    exit /b 1
)

echo.
echo Verification de Laravel...
php artisan --version
if %errorlevel% neq 0 (
    echo Erreur: Laravel non configure
    pause
    exit /b 1
)

echo.
echo Lancement du diagnostic...
php scripts/diagnose-auth.php

echo.
echo Diagnostic termine. Appuyez sur une touche pour continuer...
pause