# Backend Dockerfile
FROM node:18-alpine AS builder

# İş qovluğunu təyin et
WORKDIR /app

# package.json və package-lock.json kopyala
COPY package*.json ./
COPY prisma ./prisma/

# Dependencies quraşdır
RUN npm ci --include=dev

# Prisma Client generate et
RUN npx prisma generate

# Source kodları kopyala
COPY . .

# TypeScript build et
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Production dependencies quraşdır
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

# Build olunmuş faylları kopyala
COPY --from=builder /app/dist ./dist

# Port aç
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serveri başlat
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]

