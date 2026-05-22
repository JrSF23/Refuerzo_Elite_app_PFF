#!/bin/sh
set -e

echo "[entrypoint] Waiting for MySQL to be ready..."
until php -r "new PDO('mysql:host=${DB_HOST};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    sleep 2
done
echo "[entrypoint] MySQL is ready."

echo "[entrypoint] Caching Laravel config, routes and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[entrypoint] Starting PHP-FPM..."
exec "$@"
