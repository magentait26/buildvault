# Production Ready Dockerfile for BuildVault Laravel 12 API
FROM php:8.2-fpm-alpine

# Set system variables
WORKDIR /var/www

# Install essential system dependencies and PHP compilation tools
RUN apk add --no-cache \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    postgresql-dev \
    libzip-dev \
    shadow \
    bash \
    oniguruma-dev

# Install PHP extensions required for Laravel 12 & PostgreSQL
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    xml \
    gd \
    zip \
    opcache

# Configuration - Production OpCache and generic php config
COPY ./local.ini /usr/local/etc/php/conf.d/local.ini

# Install Composer from official multi-stage distribution
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Change owner permissions of standard directories
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

# Copy all application files to the container
COPY . /var/www

# Ensure bootstrap cache exists and has correct permissions/ownership for composer builds
RUN mkdir -p /var/www/bootstrap/cache && \
    chown -R www-data:www-data /var/www && \
    chmod -R 775 /var/www/bootstrap/cache

# Install core framework dependencies
RUN composer install --no-dev --optimize-autoloader

# Run package discovery safely
RUN php artisan package:discover || true

# Correct folders ownership
RUN chown -R www-data:www-data /var/www

# Copy the entrypoint scripting & set permissions
RUN chmod +x /var/www/docker-entrypoint.sh && cp /var/www/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Expose standard port for PHP-FPM
EXPOSE 9000

# Declare mountable storage point for Nginx asset sharing
VOLUME ["/var/www/storage"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
