# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Build argument - API URL
ARG VITE_API_URL=http://localhost:5000/api

# Dependencies quraşdır
COPY package*.json ./
RUN npm ci

# Source kodları kopyala
COPY . .

# Environment variable təyin et (Vite build üçün)
ENV VITE_API_URL=$VITE_API_URL

# Build et
RUN npm run build

# Production image - Nginx ilə serve et
FROM nginx:alpine

# Build olunmuş faylları kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx konfiqurasiyası - SPA routing üçün
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # SPA routing - bütün request-ləri index.html-ə yönləndir \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Static assets caching \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "DENY" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

