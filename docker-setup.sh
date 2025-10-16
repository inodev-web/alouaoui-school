#!/bin/bash

echo "=========================================="
echo "Alouaoui School - Docker Setup Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Stop any running containers
echo "🛑 Stopping any running containers..."
docker-compose down

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
else
    echo "✅ .env file already exists"
fi

# Build and start containers
echo ""
echo "🏗️  Building Docker containers..."
docker-compose build

echo ""
echo "🚀 Starting Docker containers..."
docker-compose up -d

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to be ready..."
sleep 10

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
docker-compose exec -T php composer install

# Generate application key
echo ""
echo "🔑 Generating application key..."
docker-compose exec -T php php artisan key:generate

# Generate JWT secret
echo ""
echo "🔐 Generating JWT secret..."
docker-compose exec -T php php artisan jwt:secret || echo "Note: JWT secret generation skipped (command may not exist)"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T php php artisan migrate --force

# Seed database
echo ""
echo "🌱 Seeding database..."
docker-compose exec -T php php artisan db:seed --force

# Create storage link
echo ""
echo "🔗 Creating storage symbolic link..."
docker-compose exec -T php php artisan storage:link

# Set permissions
echo ""
echo "🔒 Setting proper permissions..."
docker-compose exec -T php chmod -R 775 storage bootstrap/cache
docker-compose exec -T php chown -R www-data:www-data storage bootstrap/cache

# Clear caches
echo ""
echo "🧹 Clearing caches..."
docker-compose exec -T php php artisan config:clear
docker-compose exec -T php php artisan cache:clear
docker-compose exec -T php php artisan route:clear
docker-compose exec -T php php artisan view:clear

echo ""
echo "=========================================="
echo "✅ Setup completed successfully!"
echo "=========================================="
echo ""
echo "Your application is now running:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost/api"
echo "  - MySQL: localhost:3306"
echo "  - Redis: localhost:6379"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop containers: docker-compose down"
echo "  - Restart containers: docker-compose restart"
echo "  - Access PHP container: docker-compose exec php bash"
echo "  - Access database: docker-compose exec mysql mysql -u root alouaoui_school"
echo ""

