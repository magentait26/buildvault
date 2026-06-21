# BuildVault Linux VPS Docker Deployment Manual

This guide describes how to deploy the **BuildVault** stack (React/Vite Frontend, Laravel 12 Sanctum API, PostgreSQL 16 DB, and Nginx SSL Reverse Proxy) on a high-speed Linux Virtual Private Server (VPS) using Docker Compose.

---

## 🏗️ 1. Complete System Architecture Mappings

Our Docker topology establishes maximum security by walling our PostgreSQL service inside an internal isolated bridge network, while exposing only secure port 80/443 points to the public web.

```
                  [ Public Web Client Request ]
                               │
                ◄─────── HTTPS / Secure SSL ───────►
                               │
                     [ Host Node Port 443 ]
                               │
                     [ Nginx Reverse Proxy ]
                              ┌┴┐
              ┌───────────────┘ └────────────────┐
              ▼                                  ▼
      /api/v1 Core Calls               UI Layout Elements
   [ php-fpm: buildvault-api ]      [ nginx: buildvault-web ]
              │
    [ postgresql: buildvault-db ] (Isolated Network)
```

---

## ⚙️ 2. Step-by-Step VPS Provisioning

### Step A: Connect to your Server
SSH into your clean VPS instance (Ubuntu 22.04 LTS or 24.04 LTS is highly recommended):
```bash
ssh root@your_vps_ip_address
```

### Step B: Install Docker & Docker Compose
Run the official Docker community repository automatic setup script:
```bash
# Update local packages catalogs
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y curl apt-transport-https ca-certificates gnupg lsb-release

# Bind official Docker GPG Keys
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Register stable Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Sync packages and install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Confirm service is active
sudo systemctl status docker --no-pager
```

### Step C: Prepare the Deployment Stack Folder
Transfer the complete compiled directory structures from your build pipeline to `/var/www/buildvault` or create the structure directly:
```bash
mkdir -p /var/www/buildvault
cd /var/www/buildvault
```

---

## 🐳 3. Commands Sequence for Initial Launch

Follow this exact command flow to build, migrate, and run the service components.

### 1. Build and Compile Container Layers
Build the production Docker images for the Laravel application and React frontend compilation. Add the `--no-cache` variable if pulling direct upgrades:
```bash
docker compose build --pull
```

### 2. Configure Environment Context
Create your live production environment files inside the target directories:
```bash
# Configure Laravel secrets
cp ./buildvault-api/.env.example ./buildvault-api/.env

# Generate security key
docker run --rm -v $(pwd)/buildvault-api:/app -w /app php:8.2-cli-alpine php artisan key:generate
```
*Note: Make sure to open `/var/www/buildvault/buildvault-api/.env` and update your `DB_PASSWORD`, `APP_URL`, and database access parameters.*

### 3. Spin Up Live Service Dependencies (Background Daemon)
Launch all containers. This safely initiates the database daemon, routes the isolated network, and prepares resource bindings:
```bash
docker compose up -d
```

### 4. Execute Migrations & Seeds Verification
When booting for the first time, your backend storage schema can be initialized manually, although the custom `docker-entrypoint.sh` is programmed to automatically handle standard migrations checks:
```bash
# Verify manual database scheme migrations
docker compose exec buildvault-api php artisan migrate --force

# Seed starting roles context config
docker compose exec buildvault-api php artisan db:seed --force
```

### 5. Clear and Cache Performance Layers
Warm caching paths inside the API container to establish fast request responses:
```bash
docker compose exec buildvault-api php artisan config:cache
docker compose exec buildvault-api php artisan route:cache
docker compose exec buildvault-api php artisan view:cache
```

---

## 📈 4. Operational Monitoring & Logging Commands

Maintain observability of your database pools and server connections using these commands:

### Check Global Live Logs stream
```bash
docker compose logs -f
```

### Stream Isolated API logs only
```bash
docker compose logs -f buildvault-api
```

### Query Active Container States
Determine active memory footprint, internal port listings, and CPU metrics:
```bash
docker compose ps
docker stats
```

---

## 🔒 5. Deploying Production SSL Certificates (Nginx)

Nginx comes configured mapping Let's Encrypt challenge files. Issue your real certificate using Certbot:

```bash
# 1. Install certbot on the host machine
sudo apt install -y certbot

# 2. Issue certificates for your domain
sudo certbot certonly --webroot -w /var/www/certbot -d docs.bhoomione.in

# 3. Open nginx/default.conf and uncomment the SSL key lines
# ssl_certificate /etc/letsencrypt/live/docs.bhoomione.in/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/docs.bhoomione.in/privkey.pem;

# 4. Gracefully reload the master reverse proxy server
docker compose exec buildvault-nginx nginx -s reload
```

---

## 🛠️ 6. Storage & Database Backups Scheduling

Protect your PostgreSQL database records by setting up automated hourly backups:

```bash
# Register a simple host-side crontab job
crontab -e
```
Add the following line to capture a complete SQL snapshot export every night at 2:00 AM:
```cron
0 2 * * * docker exec buildvault-db pg_dump -U buildvault_admin buildvault_prod > /var/backups/buildvault_$(date +\%F).sql
```
