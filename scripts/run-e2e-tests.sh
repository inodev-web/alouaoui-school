#!/bin/bash

# 🧪 Script de Test E2E Local pour Alouaoui School
# Usage: ./scripts/run-e2e-tests.sh [test-suite] [browser]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
DEFAULT_TEST_SUITE="all"
DEFAULT_BROWSER="chrome"
BACKEND_URL="http://127.0.0.1:8000"
FRONTEND_URL="http://localhost:5173"

# Parse arguments
TEST_SUITE="${1:-$DEFAULT_TEST_SUITE}"
BROWSER="${2:-$DEFAULT_BROWSER}"

echo -e "${BLUE}🧪 Alouaoui School - E2E Tests Runner${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "Test Suite: ${YELLOW}$TEST_SUITE${NC}"
echo -e "Browser: ${YELLOW}$BROWSER${NC}"
echo -e "Backend URL: ${YELLOW}$BACKEND_URL${NC}"
echo -e "Frontend URL: ${YELLOW}$FRONTEND_URL${NC}"
echo ""

# Fonction pour vérifier si un service est disponible
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Vérification de $name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name est disponible${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Tentative $attempt/$max_attempts - En attente de $name...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name n'est pas accessible après $max_attempts tentatives${NC}"
    return 1
}

# Fonction pour démarrer le backend Laravel
start_backend() {
    echo -e "${BLUE}🚀 Démarrage du backend Laravel...${NC}"
    
    cd backend
    
    # Vérifier si le serveur est déjà en cours d'exécution
    if curl -s -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Backend déjà en cours d'exécution${NC}"
        cd ..
        return 0
    fi
    
    # Configuration de l'environnement de test
    if [ ! -f ".env.testing" ]; then
        echo -e "${YELLOW}📝 Création du fichier .env.testing...${NC}"
        cp .env.example .env.testing
        php artisan key:generate --env=testing --quiet
        
        # Configuration de la base de données SQLite pour les tests
        cat >> .env.testing << EOF
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DRIVER=array
CACHE_DRIVER=array
QUEUE_CONNECTION=sync
MAIL_MAILER=log
EOF
    fi
    
    # Installation des dépendances si nécessaire
    if [ ! -d "vendor" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances Composer...${NC}"
        composer install --quiet --no-dev --optimize-autoloader
    fi
    
    # Migration et seed de la base de données
    echo -e "${YELLOW}🗄️  Migration de la base de données...${NC}"
    php artisan migrate:fresh --seed --env=testing --force --quiet
    
    # Démarrer le serveur en arrière-plan
    echo -e "${YELLOW}🔧 Démarrage du serveur Laravel...${NC}"
    php artisan serve --host=0.0.0.0 --port=8000 --env=testing > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # Attendre que le serveur soit prêt
    sleep 5
    check_service "$BACKEND_URL/api/health" "Backend Laravel"
}

# Fonction pour démarrer le frontend React
start_frontend() {
    echo -e "${BLUE}🚀 Démarrage du frontend React...${NC}"
    
    cd frontend
    
    # Vérifier si le serveur est déjà en cours d'exécution
    if curl -s -I "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Frontend déjà en cours d'exécution${NC}"
        cd ..
        return 0
    fi
    
    # Installation des dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances npm...${NC}"
        npm ci --prefer-offline --no-audit
    fi
    
    # Installation de Cypress si nécessaire
    if [ ! -d "node_modules/cypress" ]; then
        echo -e "${YELLOW}🧪 Installation de Cypress...${NC}"
        npx cypress install
    fi
    
    # Build du projet
    echo -e "${YELLOW}🔨 Build du projet...${NC}"
    npm run build
    
    # Démarrer le serveur de prévisualisation
    echo -e "${YELLOW}🔧 Démarrage du serveur de prévisualisation...${NC}"
    npm run preview -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    
    # Attendre que le serveur soit prêt
    sleep 5
    check_service "$FRONTEND_URL" "Frontend React"
}

# Fonction pour exécuter les tests Cypress
run_cypress_tests() {
    echo -e "${BLUE}🧪 Exécution des tests Cypress...${NC}"
    
    cd frontend
    
    # Créer les répertoires de rapports
    mkdir -p cypress/reports cypress/screenshots cypress/videos
    
    # Déterminer les specs à exécuter
    local spec_pattern=""
    case "$TEST_SUITE" in
        "all")
            spec_pattern="cypress/e2e/**/*.cy.js"
            ;;
        "auth")
            spec_pattern="cypress/e2e/{login,forgot-password}.cy.js"
            ;;
        "dashboard")
            spec_pattern="cypress/e2e/student-dashboard.cy.js"
            ;;
        "critical")
            spec_pattern="cypress/e2e/{login,events}.cy.js"
            ;;
        *)
            spec_pattern="cypress/e2e/$TEST_SUITE.cy.js"
            ;;
    esac
    
    echo -e "${YELLOW}🎯 Exécution des tests: $spec_pattern${NC}"
    
    # Exécuter Cypress
    local cypress_exit_code=0
    npx cypress run \
        --spec "$spec_pattern" \
        --browser "$BROWSER" \
        --reporter mochawesome \
        --reporter-options "reportDir=cypress/reports,overwrite=false,html=true,json=true,timestamp=mmddyyyy_HHMMss" \
        --config "screenshotOnRunFailure=true,video=true,videoCompression=32" \
        --env "CI=false,ENVIRONMENT=local" || cypress_exit_code=$?
    
    cd ..
    
    return $cypress_exit_code
}

# Fonction pour générer le rapport final
generate_report() {
    local exit_code=$1
    
    echo -e "${BLUE}📊 Génération du rapport final...${NC}"
    
    cd frontend
    
    # Vérifier si mochawesome-merge est installé globalement
    if ! command -v mochawesome-merge &> /dev/null; then
        echo -e "${YELLOW}📦 Installation de mochawesome-merge...${NC}"
        npm install -g mochawesome-merge mochawesome-report-generator
    fi
    
    # Fusionner les rapports JSON si ils existent
    if ls cypress/reports/*.json 1> /dev/null 2>&1; then
        echo -e "${YELLOW}📋 Fusion des rapports...${NC}"
        mochawesome-merge cypress/reports/*.json > cypress/reports/merged-report.json
        
        # Générer le rapport HTML final
        mochawesome-report-generator cypress/reports/merged-report.json \
            --reportDir cypress/reports \
            --reportTitle "Alouaoui School - E2E Test Results" \
            --reportPageTitle "Tests E2E - $(date '+%Y-%m-%d %H:%M:%S')" \
            --inline
        
        echo -e "${GREEN}📊 Rapport HTML généré: frontend/cypress/reports/merged-report.html${NC}"
    fi
    
    # Compter les résultats
    if [ -f "cypress/reports/merged-report.json" ]; then
        local total_tests=$(jq '.stats.tests // 0' cypress/reports/merged-report.json)
        local passed_tests=$(jq '.stats.passes // 0' cypress/reports/merged-report.json)
        local failed_tests=$(jq '.stats.failures // 0' cypress/reports/merged-report.json)
        local duration=$(jq '.stats.duration // 0' cypress/reports/merged-report.json)
        
        echo -e "${BLUE}📊 Résultats des tests:${NC}"
        echo -e "  Total: ${YELLOW}$total_tests${NC}"
        echo -e "  Réussis: ${GREEN}$passed_tests${NC}"
        echo -e "  Échoués: ${RED}$failed_tests${NC}"
        echo -e "  Durée: ${YELLOW}${duration}ms${NC}"
        
        if [ "$failed_tests" -gt 0 ]; then
            echo -e "${RED}❌ Des tests ont échoué${NC}"
        else
            echo -e "${GREEN}✅ Tous les tests ont réussi${NC}"
        fi
    fi
    
    # Lister les artefacts générés
    echo -e "${BLUE}📁 Artefacts générés:${NC}"
    [ -d "cypress/videos" ] && echo -e "  📹 Vidéos: cypress/videos/"
    [ -d "cypress/screenshots" ] && echo -e "  📸 Screenshots: cypress/screenshots/"
    [ -d "cypress/reports" ] && echo -e "  📊 Rapports: cypress/reports/"
    
    cd ..
}

# Fonction de nettoyage
cleanup() {
    echo -e "${BLUE}🧹 Nettoyage des processus...${NC}"
    
    # Arrêter le backend
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if kill -0 "$backend_pid" 2>/dev/null; then
            echo -e "${YELLOW}🛑 Arrêt du backend (PID: $backend_pid)...${NC}"
            kill "$backend_pid" 2>/dev/null || true
        fi
        rm -f backend.pid
    fi
    
    # Arrêter le frontend
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if kill -0 "$frontend_pid" 2>/dev/null; then
            echo -e "${YELLOW}🛑 Arrêt du frontend (PID: $frontend_pid)...${NC}"
            kill "$frontend_pid" 2>/dev/null || true
        fi
        rm -f frontend.pid
    fi
    
    # Nettoyer les processus orphelins
    pkill -f "php artisan serve" 2>/dev/null || true
    pkill -f "vite preview" 2>/dev/null || true
    
    # Nettoyer les logs
    rm -f backend.log frontend.log
    
    echo -e "${GREEN}✅ Nettoyage terminé${NC}"
}

# Fonction principale
main() {
    local final_exit_code=0
    
    # Trap pour le nettoyage en cas d'interruption
    trap cleanup EXIT INT TERM
    
    echo -e "${BLUE}🚀 Démarrage des services...${NC}"
    
    # Démarrer les services
    start_backend || {
        echo -e "${RED}❌ Échec du démarrage du backend${NC}"
        exit 1
    }
    
    start_frontend || {
        echo -e "${RED}❌ Échec du démarrage du frontend${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Tous les services sont prêts${NC}"
    echo ""
    
    # Exécuter les tests
    run_cypress_tests || final_exit_code=$?
    
    # Générer le rapport
    generate_report $final_exit_code
    
    echo ""
    if [ $final_exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 Tests E2E terminés avec succès !${NC}"
    else
        echo -e "${RED}💥 Tests E2E échoués (code de sortie: $final_exit_code)${NC}"
    fi
    
    return $final_exit_code
}

# Vérifier les prérequis
echo -e "${BLUE}🔍 Vérification des prérequis...${NC}"

# Vérifier PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP n'est pas installé${NC}"
    exit 1
fi

# Vérifier Composer
if ! command -v composer &> /dev/null; then
    echo -e "${RED}❌ Composer n'est pas installé${NC}"
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les prérequis sont satisfaits${NC}"
echo ""

# Afficher l'aide si demandée
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [test-suite] [browser]"
    echo ""
    echo "Test Suites disponibles:"
    echo "  all         - Tous les tests (par défaut)"
    echo "  auth        - Tests d'authentification"
    echo "  dashboard   - Tests du tableau de bord"
    echo "  events      - Tests des événements"
    echo "  profile     - Tests du profil"
    echo "  chapters    - Tests des chapitres"
    echo "  critical    - Tests critiques seulement"
    echo ""
    echo "Navigateurs disponibles:"
    echo "  chrome      - Google Chrome (par défaut)"
    echo "  firefox     - Mozilla Firefox"
    echo "  edge        - Microsoft Edge"
    echo ""
    echo "Exemples:"
    echo "  $0                    # Tous les tests avec Chrome"
    echo "  $0 auth               # Tests d'auth avec Chrome"
    echo "  $0 critical firefox   # Tests critiques avec Firefox"
    exit 0
fi

# Exécuter le main
main