@echo off
echo ==========================================
echo Alouaoui School - Docker Setup Script
echo ==========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo Error: Docker Compose is not installed. Please install Docker Compose first.
        pause
        exit /b 1
    )
)

echo Docker and Docker Compose are installed
echo.

REM Stop any running containers
echo Stopping any running containers...
docker-compose down

REM Create .env file if it doesn't exist
if not exist backend\.env (
    echo Creating .env file from .env.example...
    copy backend\.env.example backend\.env
) else (
    echo .env file already exists
)

REM Build and start containers
echo.
echo Building Docker containers...
docker-compose build

echo.
echo Starting Docker containers...
docker-compose up -d

REM Wait for MySQL to be ready
echo.
echo Waiting for MySQL to be ready...
timeout /t 15 /nobreak

REM Install backend dependencies
echo.
echo Installing backend dependencies...
docker-compose exec -T php composer install

REM Generate application key
echo.
echo Generating application key...
docker-compose exec -T php php artisan key:generate

REM Generate JWT secret
echo.
echo Generating JWT secret...
docker-compose exec -T php php artisan jwt:secret 2>nul || echo Note: JWT secret generation skipped

REM Run migrations
echo.
echo Running database migrations...
docker-compose exec -T php php artisan migrate --force

REM Seed database
echo.
echo Seeding database...
docker-compose exec -T php php artisan db:seed --force

REM Create storage link
echo.
echo Creating storage symbolic link...
docker-compose exec -T php php artisan storage:link

REM Set permissions
echo.
echo Setting proper permissions...
docker-compose exec -T php chmod -R 775 storage bootstrap/cache
docker-compose exec -T php chown -R www-data:www-data storage bootstrap/cache

REM Clear caches
echo.
echo Clearing caches...
docker-compose exec -T php php artisan config:clear
docker-compose exec -T php php artisan cache:clear
docker-compose exec -T php php artisan route:clear
docker-compose exec -T php php artisan view:clear

echo.
echo ==========================================
echo Setup completed successfully!
echo ==========================================
echo.
echo Your application is now running:
echo   - Frontend: http://localhost:5173
echo   - Backend API: http://localhost/api
echo   - MySQL: localhost:3306
echo   - Redis: localhost:6379
echo.
echo Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop containers: docker-compose down
echo   - Restart containers: docker-compose restart
echo   - Access PHP container: docker-compose exec php bash
echo   - Access database: docker-compose exec mysql mysql -u root alouaoui_school
echo.
pause

