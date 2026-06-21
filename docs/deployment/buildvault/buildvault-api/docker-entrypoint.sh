#!/bin/bash
set -e

# Wait for PostgreSQL Database readiness before starting Laravel processes
echo "Checking database connection..."
until php -r "try { new PDO('pgsql:host=' . env('DB_HOST') . ';port=' . env('DB_PORT') . ';dbname=' . env('DB_DATABASE'), env('DB_USERNAME'), env('DB_PASSWORD')); exit(0); } catch (\Exception \$e) { exit(1); }" 2>/dev/null; do
    echo "PostgreSQL state checked: Unavailable. Waiting 3 seconds..."
    sleep 3
done
echo "PostgreSQL is online and fully accepting backend entries."

# Execute standard package sync if vendors are absent (cold bootstrap fallback)
if [ ! -d "/var/www/vendor" ]; then
    echo "Vendor directory not found. Executing composer install..."
    composer install --no-dev --optimize-autoloader --no-interaction
fi

# Ensure storage sub-directories are present and writable
mkdir -p /var/www/storage/framework/{sessions,views,caches}
mkdir -p /var/www/storage/logs
chown -R www-data:www-data /var/www/storage
chmod -R 775 /var/www/storage

# Assert Laravel storage symbolic mappings
if [ ! -d "/var/www/public/storage" ]; then
    echo "Structuring storage symbolic linking..."
    php artisan storage:link --force
fi

# Run database schema migrations
echo "Deploying database changes (php artisan migrate)..."
php artisan migrate --force

# Seed base corporate roles, permissions and administrative profiles
echo "Deploying seeders data catalog..."
php artisan db:seed --force

# Prime configuration and architecture caching for high performance on VPS
echo "Building Laravel configuration and routes warm caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "BuildVault API initialization checks completed successfully."

# Hand over to parent container directive CMD execution
exec "$@"
