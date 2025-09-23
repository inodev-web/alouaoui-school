#!/bin/bash

# Attendre que MySQL soit prêt
echo "Waiting for MySQL to be ready..."
while ! nc -z mysql 3306; do
    sleep 1
done
echo "MySQL is ready!"

# Se placer dans le répertoire Laravel
cd /var/www

# Installer les dépendances si vendor n'existe pas
if [ ! -d "vendor" ]; then
    echo "Installing Composer dependencies..."
    composer install --no-dev --optimize-autoloader
fi

# Générer la clé d'application si elle n'existe pas
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Générer la clé d'application
php artisan key:generate --force

# Créer les liens symboliques pour storage
php artisan storage:link

# Exécuter les migrations
echo "Running database migrations..."
php artisan migrate --force

# Publier les assets de Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force

# Publier les assets de Horizon
php artisan vendor:publish --provider="Laravel\Horizon\HorizonServiceProvider" --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Laravel setup completed!"

# Démarrer PHP-FPM
exec php-fpm
