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

# Copy initial application shell or entrypoint scripting
COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Change owner permissions of standard directories
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

# Expose standard port for PHP-FPM
EXPOSE 9000

# Declare mountable storage point for Nginx asset sharing
VOLUME ["/var/www/storage"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
