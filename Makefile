ENV_FILE ?= .env.docker

# ── Arranque ──────────────────────────────────────────────────────────────────
up:
	docker compose --env-file $(ENV_FILE) up -d

down:
	docker compose down

restart:
	docker compose --env-file $(ENV_FILE) restart

# ── Construcción de imágenes ──────────────────────────────────────────────────
build:
	docker compose --env-file $(ENV_FILE) build --no-cache

build-fast:
	docker compose --env-file $(ENV_FILE) build

# ── Primer arranque completo (build + up + migrate + seed) ───────────────────
setup: build up wait migrate seed
	@echo ""
	@echo "✓ Refuerzo Elite listo en http://localhost"
	@echo "  Admin:    admin / Admin12345!"
	@echo "  Profesor: mgarcia / Teacher12345!"

wait:
	@echo "Esperando a que MySQL esté listo..."
	@sleep 10

# ── Base de datos ─────────────────────────────────────────────────────────────
migrate:
	docker compose exec laravel php artisan migrate --force

migrate-fresh:
	docker compose exec laravel php artisan migrate:fresh --force

seed:
	docker compose exec laravel php artisan db:seed --force

setup-db: migrate-fresh seed

# Verifica que ninguna fila de negocio quedó sin organización tras el backfill.
# Devuelve código de salida distinto de cero si encuentra huérfanas, para poder
# usarlo como puerta en un despliegue. Ver docs/migration-multi-org.md
verify-tenancy:
	docker compose exec laravel php artisan tenancy:verify

# ── Frontend ──────────────────────────────────────────────────────────────────
build-frontend:
	cd frontend && npm run build

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	docker compose exec laravel php artisan test

# ── Shell y logs ─────────────────────────────────────────────────────────────
shell:
	docker compose exec laravel bash

shell-db:
	docker compose exec mysql mysql -u root -p$(MYSQL_ROOT_PASSWORD) $(MYSQL_DATABASE)

logs:
	docker compose logs -f

logs-laravel:
	docker compose logs -f laravel

logs-nginx:
	docker compose logs -f nginx

# ── Limpieza ──────────────────────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans

.PHONY: up down restart build build-fast setup wait migrate migrate-fresh seed \
        setup-db build-frontend test shell shell-db logs logs-laravel logs-nginx clean
