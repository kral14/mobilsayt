# 🐳 Docker - Tez Başlanğıc

## 🚀 Birbaşa İşə Sal

```bash
# Bütün proyekti işə sal (database, backend, frontend)
docker-compose up -d

# Logları izlə
docker-compose logs -f

# Dayandır
docker-compose down
```

**URL-lər:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:5000
- 🗄️ Database: localhost:5432

## ⚙️ Environment Variables

`.env` faylı yaradın (`.env.example`-dan kopyalayın):

```bash
cp .env.example .env
```

Sonra `.env` faylını redaktə edin və `JWT_SECRET`-i dəyişdirin.

## 🔄 Yeniləmə

```bash
# Yeni kodları çək
git pull

# Yenidən build et və restart
docker-compose up -d --build
```

## 🧹 Təmizləmə

```bash
# Dayandır və sil
docker-compose down

# Database məlumatları ilə birlikdə sil
docker-compose down -v
```

## 📚 Ətraflı Təlimat

Ətraflı təlimat üçün `DOCKER_DEPLOYMENT.md` faylına baxın.

