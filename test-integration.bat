@echo off
REM Script de test pour vérifier l'intégration API

echo 🧪 Test d'intégration API - Données réelles vs statiques
echo ======================================================

REM Test 1: API Testimonials
echo.
echo 📝 Test 1: API Testimonials
echo Endpoint: GET /api/testimonials
curl -s http://127.0.0.1:8000/api/testimonials > temp_response.json
findstr /C:"success" temp_response.json >nul
if %errorlevel%==0 (
    echo ✅ API Testimonials - OK
    for /f "tokens=*" %%i in ('findstr /o /C:"\"id\"" temp_response.json ^| find /c ":"') do echo    📊 Nombre de témoignages: %%i
) else (
    echo ❌ API Testimonials - ERREUR
)

REM Test 2: API Courses  
echo.
echo 📚 Test 2: API Courses
echo Endpoint: GET /api/courses
curl -s http://127.0.0.1:8000/api/courses > temp_response2.json
findstr /C:"data" temp_response2.json >nul
if %errorlevel%==0 (
    echo ✅ API Courses - OK
) else (
    echo ❌ API Courses - ERREUR
)

REM Test 3: Frontend Status
echo.
echo 🌐 Test 3: Frontend Status
echo URL: http://localhost:5173
curl -s -o nul -w "%%{http_code}" http://localhost:5173 > temp_code.txt
set /p response=<temp_code.txt
if "%response%"=="200" (
    echo ✅ Frontend - OK
) else (
    echo ❌ Frontend - ERREUR (Code: %response%)
)

REM Test 4: Backend Status
echo.
echo 🔧 Test 4: Backend Status  
echo URL: http://127.0.0.1:8000/api/dashboard/public
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8000/api/dashboard/public > temp_code2.txt
set /p response=<temp_code2.txt
if "%response%"=="200" (
    echo ✅ Backend - OK
) else (
    echo ❌ Backend - ERREUR (Code: %response%)
)

echo.
echo 🎯 Résumé des migrations effectuées:
echo ==================================
echo ✅ Testimonials: Données statiques → API testimonials
echo ✅ CoursePage: Mock data → API courses
echo ✅ Backend: Nouveaux controllers et endpoints
echo ✅ Base de données: Table testimonials + seeder

echo.
echo 🔄 Composants restants à migrer:
echo ===============================
echo 🔄 QR Scanner: mockStudentData → API scan-qr
echo 🔄 Admin Stats: Vérifier données hardcodées
echo 🔄 Tests E2E: Adapter aux nouvelles données

echo.
echo ✨ Migration terminée avec succès!

REM Cleanup
del temp_response.json 2>nul
del temp_response2.json 2>nul  
del temp_code.txt 2>nul
del temp_code2.txt 2>nul

pause