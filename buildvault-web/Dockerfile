# --- Step 01: Node compilation stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests from context root
COPY package*.json ./

# Install precise dependencies
RUN npm install

# Copy full application configuration files from root
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY components/ ./components/
COPY lib/ ./lib/

# Set production env flag & compile assets
ENV NODE_ENV=production
RUN npm run build

# --- Step 02: High efficiency static serve stage ---
FROM nginx:alpine

# Clear default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy build files compiled from stage 01
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the optimized single page web router config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
