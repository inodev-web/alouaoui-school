@echo off
echo ==========================================
echo Starting Alouaoui School Docker Services
echo ==========================================
echo.

REM Check if this is first run (no .env file)
if not exist backend\.env (
    echo This appears to be your first time running the application.
    echo.
    echo Running initial setup...
    echo.
    call docker-setup.bat
    exit /b
)

REM Normal startup
echo Starting Docker containers...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo Services started successfully!
    echo ==========================================
    echo.
    echo Your application is now running:
    echo   - Frontend: http://localhost:5173
    echo   - Backend API: http://localhost/api
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
    echo.
) else (
    echo.
    echo Error starting containers. Please check Docker is running.
    echo.
)

pause

