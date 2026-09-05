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

# Suite contra MySQL 8 real. SQLite no vale para validar migraciones: no tiene
# ALTER TABLE de verdad, así que un dropColumn sobre una columna con índices
# pasa en verde ahí y puede fallar en producción.
#
# Levanta un contenedor EFÍMERO con las dependencias de desarrollo, porque la
# imagen se construye sin ellas. Su vendor, su bootstrap/cache y su storage son
# suyos, de modo que el contenedor que sirve la aplicación no se toca.
test-mysql:
	MSYS_NO_PATHCONV=1 docker compose --env-file $(ENV_FILE) run --rm --no-deps \
	  -v /var/www/backend/bootstrap/cache -v /var/www/backend/storage \
	  laravel sh -c 'composer install --no-interaction --no-scripts --prefer-dist -q \
	    && mkdir -p storage/framework/cache/data storage/framework/sessions \
	                storage/framework/views storage/logs \
	    && php artisan config:clear -q \
	    && vendor/bin/phpunit -c phpunit.mysql.xml'

# Crea la base que usa test-mysql. Una sola vez: cada ejecución la vacía sola.
setup-db-test:
	docker compose exec mysql sh -c 'mysql -uroot -p"$$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS refuerzo_elite_v2_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON refuerzo_elite_v2_test.* TO \"$$MYSQL_USER\"@\"%\"; FLUSH PRIVILEGES;"'

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
        setup-db setup-db-test build-frontend test test-mysql shell shell-db logs logs-laravel logs-nginx clean
