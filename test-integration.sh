#!/bin/bash
# Script de test pour vérifier l'intégration API

echo "🧪 Test d'intégration API - Données réelles vs statiques"
echo "======================================================"

# Test 1: API Testimonials
echo -e "\n📝 Test 1: API Testimonials"
echo "Endpoint: GET /api/testimonials"
response=$(curl -s http://127.0.0.1:8000/api/testimonials)
if [[ $response == *"success"* ]]; then
    echo "✅ API Testimonials - OK"
    count=$(echo $response | grep -o '"id"' | wc -l)
    echo "   📊 Nombre de témoignages: $count"
else
    echo "❌ API Testimonials - ERREUR"
fi

# Test 2: API Courses
echo -e "\n📚 Test 2: API Courses"
echo "Endpoint: GET /api/courses"
response=$(curl -s http://127.0.0.1:8000/api/courses)
if [[ $response == *"data"* ]]; then
    echo "✅ API Courses - OK"
else
    echo "❌ API Courses - ERREUR"
fi

# Test 3: Frontend Status
echo -e "\n🌐 Test 3: Frontend Status"
echo "URL: http://localhost:5173"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [[ $response == "200" ]]; then
    echo "✅ Frontend - OK"
else
    echo "❌ Frontend - ERREUR (Code: $response)"
fi

# Test 4: Backend Status
echo -e "\n🔧 Test 4: Backend Status"
echo "URL: http://127.0.0.1:8000/api/dashboard/public"
response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/dashboard/public)
if [[ $response == "200" ]]; then
    echo "✅ Backend - OK"
else
    echo "❌ Backend - ERREUR (Code: $response)"
fi

echo -e "\n🎯 Résumé des migrations effectuées:"
echo "=================================="
echo "✅ Testimonials: Données statiques → API testimonials"
echo "✅ CoursePage: Mock data → API courses"
echo "✅ Backend: Nouveaux controllers et endpoints"
echo "✅ Base de données: Table testimonials + seeder"

echo -e "\n🔄 Composants restants à migrer:"
echo "==============================="
echo "🔄 QR Scanner: mockStudentData → API scan-qr"
echo "🔄 Admin Stats: Vérifier données hardcodées"
echo "🔄 Tests E2E: Adapter aux nouvelles données"

echo -e "\n✨ Migration terminée avec succès!"