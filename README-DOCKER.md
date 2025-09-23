# 🎓 Alouaoui School - E-Learning Platform

Plateforme d'e-learning et de gestion scolaire construite avec Laravel 11 et React.js.

## 🏗️ Architecture

- **Backend**: Laravel 11 + PHP-FPM
- **Frontend**: React.js + Node.js
- **Web Server**: Nginx
- **Base de données**: MySQL 8.0
- **Cache**: Redis
- **Containerisation**: Docker + Docker Compose

## 🚀 Installation rapide

### Prérequis
- Docker Desktop
- Git

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repo-url>
cd alouaoui-school
```

2. **Construire et démarrer les conteneurs**
```bash
# Avec Make (recommandé)
make build
make up

# Ou avec Docker Compose directement
docker-compose build
docker-compose up -d
```

3. **Installer les dépendances Laravel**
```bash
make laravel-install
# Ou
docker-compose exec php composer install
docker-compose exec php php artisan key:generate
docker-compose exec php php artisan storage:link
```

4. **Exécuter les migrations**
```bash
make laravel-migrate
# Ou
docker-compose exec php php artisan migrate
```

## 📦 Services Docker

| Service | Port | Description |
|---------|------|-------------|
| **nginx** | 80, 443 | Serveur web principal |
| **php** | 9000 | PHP-FPM pour Laravel |
| **mysql** | 3306 | Base de données MySQL |
| **redis** | 6379 | Cache et sessions |
| **node** | 3000, 5173 | Frontend React + Vite |
| **horizon** | - | Queue worker Laravel |

## 🛠️ Commandes utiles

### Avec Make
```bash
make help              # Voir toutes les commandes disponibles
make up                # Démarrer les services
make down              # Arrêter les services
make logs              # Voir les logs
make bash-php          # Shell dans le conteneur PHP
make bash-node         # Shell dans le conteneur Node
make laravel-migrate   # Exécuter les migrations
make fresh             # Installation fraîche complète
```

### Avec Docker Compose
```bash
docker-compose up -d                    # Démarrer en arrière-plan
docker-compose down                     # Arrêter les services
docker-compose logs -f                  # Voir les logs en temps réel
docker-compose exec php bash            # Shell PHP
docker-compose exec php php artisan migrate
```

## 🔧 Configuration

### Variables d'environnement (.env)
```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=alouaoui_school
DB_USERNAME=root
DB_PASSWORD=

REDIS_HOST=redis
```

### URLs d'accès
- **Application**: http://localhost
- **Frontend Dev**: http://localhost:3000
- **API Laravel**: http://localhost/api
- **Horizon Dashboard**: http://localhost/horizon

## 📁 Structure du projet

```
alouaoui-school/
├── backend/                 # Laravel 11
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── Dockerfile.php
│   └── docker-entrypoint.sh
├── frontend/               # React.js
├── docker/                 # Configurations Docker
│   ├── nginx/
│   ├── php/
│   └── mysql/
├── docker-compose.yml      # Services Docker
├── Makefile               # Commandes simplifiées
└── README.md
```

## 🔒 Authentification

Le projet utilise plusieurs méthodes d'authentification :
- **Laravel Sanctum** pour l'authentification SPA
- **JWT Auth** pour l'API mobile
- **Session-based** pour l'administration

## 📊 Monitoring

- **Laravel Horizon** : Dashboard pour les queues Redis
- **Laravel Telescope** : Debugging et monitoring (en développement)

## 🚨 Dépannage

### Problèmes courants

1. **Erreur de permissions**
```bash
docker-compose exec php chown -R laravel:laravel /var/www/storage
docker-compose exec php chmod -R 775 /var/www/storage
```

2. **Cache Laravel**
```bash
make laravel-cache
# Ou
docker-compose exec php php artisan config:clear
docker-compose exec php php artisan cache:clear
```

3. **Redémarrer les services**
```bash
make restart
# Ou
docker-compose restart
```

## 📝 Développement

### Ajout de nouvelles dépendances

**PHP/Laravel**
```bash
make composer cmd="require package/name"
```

**Node.js/React**
```bash
make npm cmd="install package-name"
```

### Tests
```bash
docker-compose exec php php artisan test
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.