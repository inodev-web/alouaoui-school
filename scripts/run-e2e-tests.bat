@echo off
setlocal enabledelayedexpansion

REM 🧪 Script de Test E2E Windows pour Alouaoui School
REM Usage: scripts\run-e2e-tests.bat [test-suite] [browser]

REM Configuration par défaut
set DEFAULT_TEST_SUITE=all
set DEFAULT_BROWSER=chrome
set BACKEND_URL=http://127.0.0.1:8000
set FRONTEND_URL=http://localhost:5173

REM Parse arguments
set TEST_SUITE=%1
if "%TEST_SUITE%"=="" set TEST_SUITE=%DEFAULT_TEST_SUITE%

set BROWSER=%2
if "%BROWSER%"=="" set BROWSER=%DEFAULT_BROWSER%

echo 🧪 Alouaoui School - E2E Tests Runner (Windows)
echo ============================================
echo Test Suite: %TEST_SUITE%
echo Browser: %BROWSER%
echo Backend URL: %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo.

REM Vérification des prérequis
echo 🔍 Vérification des prérequis...

where php >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PHP n'est pas installé ou pas dans le PATH
    exit /b 1
)

where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Composer n'est pas installé ou pas dans le PATH
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ou pas dans le PATH
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé ou pas dans le PATH
    exit /b 1
)

echo ✅ Tous les prérequis sont satisfaits
echo.

REM Fonction pour vérifier si un service est disponible
:check_service
set service_url=%1
set service_name=%2
set max_attempts=30
set attempt=1

echo 🔍 Vérification de %service_name%...

:check_loop
curl -s -f "%service_url%" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ %service_name% est disponible
    goto :eof
)

echo ⏳ Tentative %attempt%/%max_attempts% - En attente de %service_name%...
timeout /t 2 /nobreak >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto check_loop

echo ❌ %service_name% n'est pas accessible après %max_attempts% tentatives
exit /b 1

REM Démarrage du backend Laravel
:start_backend
echo 🚀 Démarrage du backend Laravel...

cd backend

REM Vérifier si le serveur est déjà en cours d'exécution
curl -s -f "%BACKEND_URL%/api/health" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Backend déjà en cours d'exécution
    cd ..
    goto :eof
)

REM Configuration de l'environnement de test
if not exist ".env.testing" (
    echo 📝 Création du fichier .env.testing...
    copy .env.example .env.testing >nul
    php artisan key:generate --env=testing --quiet
    
    REM Configuration de la base de données SQLite pour les tests
    echo DB_CONNECTION=sqlite >> .env.testing
    echo DB_DATABASE=:memory: >> .env.testing
    echo SANCTUM_STATEFUL_DOMAINS=localhost:5173 >> .env.testing
    echo SESSION_DRIVER=array >> .env.testing
    echo CACHE_DRIVER=array >> .env.testing
    echo QUEUE_CONNECTION=sync >> .env.testing
    echo MAIL_MAILER=log >> .env.testing
)

REM Installation des dépendances si nécessaire
if not exist "vendor" (
    echo 📦 Installation des dépendances Composer...
    composer install --quiet --no-dev --optimize-autoloader
)

REM Migration et seed de la base de données
echo 🗄️  Migration de la base de données...
php artisan migrate:fresh --seed --env=testing --force --quiet

REM Démarrer le serveur en arrière-plan
echo 🔧 Démarrage du serveur Laravel...
start /b php artisan serve --host=0.0.0.0 --port=8000 --env=testing > ../backend.log 2>&1

cd ..

REM Attendre que le serveur soit prêt
timeout /t 5 /nobreak >nul
call :check_service "%BACKEND_URL%/api/health" "Backend Laravel"
goto :eof

REM Démarrage du frontend React
:start_frontend
echo 🚀 Démarrage du frontend React...

cd frontend

REM Vérifier si le serveur est déjà en cours d'exécution
curl -s -I "%FRONTEND_URL%" >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Frontend déjà en cours d'exécution
    cd ..
    goto :eof
)

REM Installation des dépendances si nécessaire
if not exist "node_modules" (
    echo 📦 Installation des dépendances npm...
    npm ci --prefer-offline --no-audit
)

REM Installation de Cypress si nécessaire
if not exist "node_modules\cypress" (
    echo 🧪 Installation de Cypress...
    npx cypress install
)

REM Build du projet
echo 🔨 Build du projet...
npm run build

REM Démarrer le serveur de prévisualisation
echo 🔧 Démarrage du serveur de prévisualisation...
start /b npm run preview -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1

cd ..

REM Attendre que le serveur soit prêt
timeout /t 5 /nobreak >nul
call :check_service "%FRONTEND_URL%" "Frontend React"
goto :eof

REM Exécution des tests Cypress
:run_cypress_tests
echo 🧪 Exécution des tests Cypress...

cd frontend

REM Créer les répertoires de rapports
if not exist "cypress\reports" mkdir cypress\reports
if not exist "cypress\screenshots" mkdir cypress\screenshots
if not exist "cypress\videos" mkdir cypress\videos

REM Déterminer les specs à exécuter
set spec_pattern=cypress/e2e/**/*.cy.js
if "%TEST_SUITE%"=="auth" set spec_pattern=cypress/e2e/{login,forgot-password}.cy.js
if "%TEST_SUITE%"=="dashboard" set spec_pattern=cypress/e2e/student-dashboard.cy.js
if "%TEST_SUITE%"=="critical" set spec_pattern=cypress/e2e/{login,events}.cy.js
if not "%TEST_SUITE%"=="all" (
    if not "%TEST_SUITE%"=="auth" (
        if not "%TEST_SUITE%"=="dashboard" (
            if not "%TEST_SUITE%"=="critical" (
                set spec_pattern=cypress/e2e/%TEST_SUITE%.cy.js
            )
        )
    )
)

echo 🎯 Exécution des tests: %spec_pattern%

REM Exécuter Cypress
npx cypress run --spec "%spec_pattern%" --browser "%BROWSER%" --reporter mochawesome --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true,timestamp=mmddyyyy_HHMMss" --config "screenshotOnRunFailure=true,video=true,videoCompression=32" --env "CI=false,ENVIRONMENT=local"

set cypress_exit_code=%errorlevel%
cd ..
exit /b %cypress_exit_code%

REM Génération du rapport final
:generate_report
set exit_code=%1

echo 📊 Génération du rapport final...

cd frontend

REM Vérifier si mochawesome-merge est installé globalement
where mochawesome-merge >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installation de mochawesome-merge...
    npm install -g mochawesome-merge mochawesome-report-generator
)

REM Fusionner les rapports JSON si ils existent
if exist "cypress\reports\*.json" (
    echo 📋 Fusion des rapports...
    mochawesome-merge cypress/reports/*.json > cypress/reports/merged-report.json
    
    REM Générer le rapport HTML final
    mochawesome-report-generator cypress/reports/merged-report.json --reportDir cypress/reports --reportTitle "Alouaoui School - E2E Test Results" --reportPageTitle "Tests E2E" --inline
    
    echo ✅ Rapport HTML généré: frontend\cypress\reports\merged-report.html
)

echo 📊 Résultats des tests générés dans cypress\reports\
echo 📹 Vidéos disponibles dans cypress\videos\
echo 📸 Screenshots disponibles dans cypress\screenshots\

cd ..
goto :eof

REM Nettoyage des processus
:cleanup
echo 🧹 Nettoyage des processus...

REM Tuer les processus PHP et Node.js
taskkill /f /im php.exe >nul 2>nul
taskkill /f /im node.exe >nul 2>nul

REM Nettoyer les logs
if exist "backend.log" del backend.log
if exist "frontend.log" del frontend.log

echo ✅ Nettoyage terminé
goto :eof

REM Fonction principale
:main
echo 🚀 Démarrage des services...

REM Démarrer les services
call :start_backend
if %errorlevel% neq 0 (
    echo ❌ Échec du démarrage du backend
    call :cleanup
    exit /b 1
)

call :start_frontend
if %errorlevel% neq 0 (
    echo ❌ Échec du démarrage du frontend
    call :cleanup
    exit /b 1
)

echo ✅ Tous les services sont prêts
echo.

REM Exécuter les tests
call :run_cypress_tests
set final_exit_code=%errorlevel%

REM Générer le rapport
call :generate_report %final_exit_code%

echo.
if %final_exit_code% equ 0 (
    echo 🎉 Tests E2E terminés avec succès !
) else (
    echo 💥 Tests E2E échoués ^(code de sortie: %final_exit_code%^)
)

REM Nettoyage
call :cleanup

exit /b %final_exit_code%

REM Afficher l'aide si demandée
if "%1"=="--help" goto help
if "%1"=="-h" goto help
goto main

:help
echo Usage: %0 [test-suite] [browser]
echo.
echo Test Suites disponibles:
echo   all         - Tous les tests ^(par défaut^)
echo   auth        - Tests d'authentification
echo   dashboard   - Tests du tableau de bord
echo   events      - Tests des événements
echo   profile     - Tests du profil
echo   chapters    - Tests des chapitres
echo   critical    - Tests critiques seulement
echo.
echo Navigateurs disponibles:
echo   chrome      - Google Chrome ^(par défaut^)
echo   firefox     - Mozilla Firefox
echo   edge        - Microsoft Edge
echo.
echo Exemples:
echo   %0                    # Tous les tests avec Chrome
echo   %0 auth               # Tests d'auth avec Chrome
echo   %0 critical firefox   # Tests critiques avec Firefox
exit /b 0