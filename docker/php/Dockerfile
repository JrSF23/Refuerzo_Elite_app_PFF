# ── Stage: production image ───────────────────────────────────────────────────
FROM php:8.2-fpm

# System dependencies required by Laravel extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
        zip \
        unzip \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        xml \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer from its official image (avoids version drift)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# ── Dependency layer (cached unless composer.json/lock changes) ───────────────
COPY backend/composer.json backend/composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader

# ── Application source ────────────────────────────────────────────────────────
COPY backend/ .

# Finish Composer post-install hooks now that the full source is present
RUN composer run-script post-autoload-dump

# Storage and cache directories must be writable by www-data (PHP-FPM user)
RUN chown -R www-data:www-data \
        /var/www/backend/storage \
        /var/www/backend/bootstrap/cache \
    && chmod -R 775 \
        /var/www/backend/storage \
        /var/www/backend/bootstrap/cache

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
