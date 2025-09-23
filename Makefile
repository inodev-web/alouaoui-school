# Makefile pour le projet Alouaoui School

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER = docker
BACKEND_CONTAINER = alouaoui-school-php
FRONTEND_CONTAINER = alouaoui-school-node

# Commandes de base
.PHONY: help build up down restart logs

help: ## Afficher cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Construire tous les conteneurs
	$(DOCKER_COMPOSE) build

up: ## Démarrer tous les services
	$(DOCKER_COMPOSE) up -d

down: ## Arrêter tous les services
	$(DOCKER_COMPOSE) down

restart: ## Redémarrer tous les services
	$(DOCKER_COMPOSE) restart

logs: ## Voir les logs de tous les services
	$(DOCKER_COMPOSE) logs -f

# Commandes Laravel
.PHONY: laravel-install laravel-migrate laravel-seed laravel-cache

laravel-install: ## Installer Laravel (première fois)
	$(DOCKER_COMPOSE) exec php composer install
	$(DOCKER_COMPOSE) exec php php artisan key:generate
	$(DOCKER_COMPOSE) exec php php artisan storage:link

laravel-migrate: ## Exécuter les migrations Laravel
	$(DOCKER_COMPOSE) exec php php artisan migrate

laravel-seed: ## Exécuter les seeders
	$(DOCKER_COMPOSE) exec php php artisan db:seed

laravel-cache: ## Vider et reconstruire le cache Laravel
	$(DOCKER_COMPOSE) exec php php artisan config:cache
	$(DOCKER_COMPOSE) exec php php artisan route:cache
	$(DOCKER_COMPOSE) exec php php artisan view:cache

# Commandes de développement
.PHONY: bash-php bash-node composer npm

bash-php: ## Ouvrir un bash dans le conteneur PHP
	$(DOCKER_COMPOSE) exec php bash

bash-node: ## Ouvrir un bash dans le conteneur Node
	$(DOCKER_COMPOSE) exec node sh

composer: ## Exécuter une commande Composer (ex: make composer cmd="install")
	$(DOCKER_COMPOSE) exec php composer $(cmd)

npm: ## Exécuter une commande npm (ex: make npm cmd="install")
	$(DOCKER_COMPOSE) exec node npm $(cmd)

# Commandes de maintenance
.PHONY: clean clean-volumes fresh

clean: ## Nettoyer les conteneurs et images inutilisés
	$(DOCKER) system prune -f

clean-volumes: ## Supprimer tous les volumes (ATTENTION: supprime les données)
	$(DOCKER_COMPOSE) down -v
	$(DOCKER) volume prune -f

fresh: ## Installation fraîche complète
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d
	sleep 10
	make laravel-install
	make laravel-migrate

# Commandes de monitoring
.PHONY: status ps top

status: ## Voir le statut des conteneurs
	$(DOCKER_COMPOSE) ps

ps: ## Alias pour status
	$(DOCKER_COMPOSE) ps

top: ## Voir l'utilisation des ressources
	$(DOCKER) stats