# BuildVault Linux VPS Docker Deployment Manual

This guide describes how to deploy the **BuildVault** stack (React/Vite Frontend, Laravel 12 Sanctum API, PostgreSQL 16 DB, and Nginx SSL Reverse Proxy) on an Ubuntu VPS mapped to the locked domain `docs.bhoomione.in` under path `/opt/buildvault`.

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
SSH into your Ubuntu VPS instance:
```bash
ssh root@docs.bhoomione.in
```

### Step B: Install Docker & Docker Compose
Run the official commands to install Docker and its compose plugin:
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
Clone the repository from GitHub into `/opt/buildvault` directly:
```bash
git clone https://github.com/your-org/buildvault.git /opt/buildvault
cd /opt/buildvault
```

---

## 🐳 3. Commands Sequence for Initial Launch

Follow this exact command flow to build, migrate, and run the service components.

### 1. Build and Compile Container Layers
Build the production Docker images for the Laravel application and React frontend compilation:
```bash
docker compose build --pull
```

### 2. Configure Environment Context
Create your live production environment files inside the target directories:
```bash
# Configure Laravel secrets
cp ./buildvault-api/.env.example ./buildvault-api/.env

# Generate security key inside Laravel
docker run --rm -v $(pwd)/buildvault-api:/app -w /app php:8.2-cli-alpine php artisan key:generate
```
*Note: Make sure to open `/opt/buildvault/buildvault-api/.env` and update your `DB_PASSWORD`, `APP_URL` to `https://docs.bhoomione.in`, and Sanctum stateful domain details.*

### 3. Spin Up Live Service Dependencies (Background Daemon)
Launch all containers. This safely initiates the database daemon, routes the isolated network, and prepares resource bindings:
```bash
docker compose up -d
```

### 4. Execute Migrations & Seeds Verification
When booting for the first time, your backend storage schema can be initialized manually:
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

# 3. Open nginx/default.conf and uncomment the SSL key lines:
# ssl_certificate /etc/letsencrypt/live/docs.bhoomione.in/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/docs.bhoomione.in/privkey.pem;

# 4. Gracefully reload the master reverse proxy server
docker compose exec buildvault-nginx nginx -s reload
```

---

## 🛠️ 6. Storage & Database Backups Scheduling

Protect your PostgreSQL database records by setting up automated daily backups:

```bash
# Register a simple host-side crontab job
crontab -e
```
Add the following line to capture a complete SQL snapshot export every night at 2:00 AM:
```cron
0 2 * * * docker exec buildvault-db pg_dump -U buildvault_admin buildvault_prod > /var/backups/buildvault_$(date +\%F).sql
```

---

## 🖥️ 7. Host Nginx Gateway Setup (docs.bhoomione.in)

The browser accesses the application over SSL/HTTPS (`https://docs.bhoomione.in`) on port `443`. To prevent the host Nginx from defaulting to another application (like BhoomiOne) or general fallback blocks on port `443`, you must deploy a server block config that handles **both** port `80` (with HTTPS redirect) and port `443` (SSL with proxy pass to `127.0.0.1:8096`).

Deploy and activate the production-ready host Nginx configuration:

```bash
# 1. Copy the host Nginx configuration from deployment
sudo cp deployment/nginx-host/docs.bhoomione.in.conf /etc/nginx/sites-available/docs.bhoomione.in

# 2. Enable the configuration by symlinking it to sites-enabled
sudo ln -sf /etc/nginx/sites-available/docs.bhoomione.in /etc/nginx/sites-enabled/docs.bhoomione.in

# 3. Handle SSL Certificates with Certbot (if not already initialized)
# This will obtain the Let's Encrypt certificates and set them up
sudo certbot --nginx -d docs.bhoomione.in

# 4. Confirm the configuration has correct syntax
sudo nginx -t

# 5. Gracefully reload the host-level Nginx service to apply changes
sudo systemctl reload nginx
```

### 🔍 Troubleshooting Active Routing Conflicts:
1. **Verify other config files**: Check for any existing server blocks that might intercept `docs.bhoomione.in` inside:
   - `/etc/nginx/sites-enabled/` (e.g. `bhoomione.conf` or default config files)
   - Ensure `server_name` parameters in other files do not capture `docs.bhoomione.in`.
2. **Reload Nginx**: Always run `sudo nginx -t && sudo systemctl reload nginx` after modification to flush old configurations from memory.


