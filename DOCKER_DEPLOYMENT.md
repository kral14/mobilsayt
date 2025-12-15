# 🐳 Docker ilə Deployment

Bu sənəd proyekti Docker konteynerlərində necə işə salmağı izah edir.

## 📋 Tələblər

- [Docker](https://www.docker.com/get-started) quraşdırılmış olmalıdır
- [Docker Compose](https://docs.docker.com/compose/install/) quraşdırılmış olmalıdır

## 🚀 Tez Başlanğıc

### Production Mode

```bash
# Bütün servisləri build et və işə sal
docker-compose up -d

# Logları izlə
docker-compose logs -f

# Dayandır
docker-compose down
```

Bu komanda:
- ✅ PostgreSQL database yaradır
- ✅ Backend API-ni build edir və işə salır
- ✅ Frontend-i build edir və Nginx ilə serve edir

**URL-lər:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

### Development Mode

```bash
# Development mode-da işə sal (yalnız backend və database)
docker-compose -f docker-compose.dev.yml up -d

# Frontend-i ayrıca işə sal (local)
cd web && npm run dev
```

## 🔧 Konfiqurasiya

### Environment Variables

Production üçün `.env` faylı yaradın:

```env
# Database
DATABASE_URL=postgresql://mobilsayt:mobilsayt123@postgres:5432/mobilsayt

# JWT Secret (mütləq dəyişdirin!)
JWT_SECRET=your-very-secure-secret-key-here

# Backend
NODE_ENV=production
PORT=5000

# Frontend API URL
VITE_API_URL=http://localhost:5000/api
```

### Docker Compose Environment Variables

`docker-compose.yml` faylında environment variables təyin edə bilərsiniz:

```yaml
backend:
  environment:
    JWT_SECRET: ${JWT_SECRET:-default-secret}
    DATABASE_URL: ${DATABASE_URL:-postgresql://...}
```

## 📦 Ayrı-ayrı Build

### Backend Build

```bash
cd backend
docker build -t mobilsayt-backend .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  mobilsayt-backend
```

### Frontend Build

```bash
cd web
docker build -t mobilsayt-frontend .
docker run -p 3000:80 mobilsayt-frontend
```

## 🌐 Production Deployment

### Render.com-da Deploy

1. **Backend üçün:**
   - Render-də yeni Web Service yaradın
   - Dockerfile seçin: `backend/Dockerfile`
   - Environment variables təyin edin

2. **Frontend üçün:**
   - Render-də yeni Static Site yaradın
   - Build command: `cd web && npm install && npm run build`
   - Publish directory: `web/dist`

### Railway-da Deploy

1. Railway-da yeni proyekt yaradın
2. GitHub repository-nizi bağlayın
3. `docker-compose.yml` faylını Railway avtomatik tanıyacaq
4. Environment variables təyin edin

### DigitalOcean App Platform

1. App Platform-da yeni app yaradın
2. Dockerfile seçin
3. `docker-compose.yml` istifadə edin

### AWS/GCP/Azure

Bu platformlarda Docker konteynerlərini deploy etmək üçün:
- AWS: ECS, EKS, App Runner
- GCP: Cloud Run, GKE
- Azure: Container Instances, AKS

## 🔍 Troubleshooting

### Database bağlantı problemi

```bash
# Database-in işlədiyini yoxla
docker-compose ps

# Database loglarını yoxla
docker-compose logs postgres

# Database-ə qoşul
docker-compose exec postgres psql -U mobilsayt -d mobilsayt
```

### Backend build xətası

```bash
# Backend loglarını yoxla
docker-compose logs backend

# Backend container-ə daxil ol
docker-compose exec backend sh

# Manual build yoxla
cd backend
docker build -t test-backend .
```

### Frontend build xətası

```bash
# Frontend loglarını yoxla
docker-compose logs frontend

# Build cache təmizlə
docker-compose build --no-cache frontend
```

### Port conflict

Əgər portlar artıq istifadə olunursa, `docker-compose.yml`-də portları dəyişdirin:

```yaml
services:
  backend:
    ports:
      - "5001:5000"  # 5000 əvəzinə 5001
  frontend:
    ports:
      - "3001:80"    # 3000 əvəzinə 3001
```

## 🗄️ Database Migration

### Prisma Migration

```bash
# Backend container-ə daxil ol
docker-compose exec backend sh

# Migration işə sal
npx prisma migrate deploy

# Və ya db push
npx prisma db push
```

### Database Backup

```bash
# Backup yarat
docker-compose exec postgres pg_dump -U mobilsayt mobilsayt > backup.sql

# Restore et
docker-compose exec -T postgres psql -U mobilsayt mobilsayt < backup.sql
```

## 📊 Monitoring

### Container status

```bash
# Bütün container-lərin statusunu yoxla
docker-compose ps

# Resource istifadəsini yoxla
docker stats
```

### Logs

```bash
# Bütün loglar
docker-compose logs -f

# Yalnız backend logları
docker-compose logs -f backend

# Son 100 sətir
docker-compose logs --tail=100 backend
```

## 🔄 Update

```bash
# Yeni kodları çək
git pull

# Yenidən build et
docker-compose build

# Restart et
docker-compose up -d
```

## 🧹 Təmizləmə

```bash
# Container-ləri dayandır və sil
docker-compose down

# Volume-ları da sil (database məlumatları silinəcək!)
docker-compose down -v

# Image-ları sil
docker-compose down --rmi all

# Bütün Docker cache təmizlə
docker system prune -a
```

## ✅ Deployment Checklist

- [ ] Docker və Docker Compose quraşdırılıb
- [ ] `.env` faylı yaradılıb və environment variables təyin olunub
- [ ] `JWT_SECRET` təhlükəsiz secret key ilə dəyişdirilib
- [ ] Database URL düzgün təyin olunub
- [ ] Portlar açıqdır və conflict yoxdur
- [ ] Build uğurla tamamlanıb
- [ ] Health check-lər keçir
- [ ] Frontend backend-ə qoşula bilir
- [ ] Database migration-lar işləyir

## 📚 Əlavə Resurslar

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

