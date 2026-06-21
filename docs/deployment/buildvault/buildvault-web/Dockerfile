# --- Step 01: Node compilation stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Pre-copy dependency manifests to leverage Docker layers caching
COPY package*.json ./

# Install pristine exact dependency tree
RUN npm ci

# Copy full application codebase 
COPY . .

# Copy environment configurations and initiate build run
COPY .env.production .env.production
RUN npm run build

# --- Step 02: High efficiency static serve stage ---
FROM nginx:alpine

# Clear the default Nginx index pages
RUN rm -rf /usr/share/nginx/html/*

# Copy build files compiled from stage 01
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the optimized single page web router config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
