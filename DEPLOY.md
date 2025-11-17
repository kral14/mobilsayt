# Render-də Deploy Təlimatları

## 1. GitHub Repository-sinə Push Edin

```bash
# Git repository-ni başlatın (əgər yoxdursa)
git init

# Bütün faylları əlavə edin
git add .

# Commit edin
git commit -m "Initial commit for Render deployment"

# GitHub repository-sinə push edin
git remote add origin https://github.com/kral14/mobilsayt.git
git branch -M main
git push -u origin main
```

## 2. Render Dashboard-da Service-lər Yaradın

### A. PostgreSQL Database Yaradın

1. Render dashboard-da "New +" → "PostgreSQL" seçin
2. Database yaradın:
   - **Name**: `mobilsayt-db`
   - **Database**: `mobilsayt` (və ya istədiyiniz ad)
   - **User**: Render avtomatik yaradır
   - **Plan**: Free
3. Database yaradıldıqdan sonra **Internal Database URL**-i kopyalayın (məsələn: `postgresql://user:password@host:5432/dbname`)

### B. Backend Service Yaradın

1. Render dashboard-da "New +" → "Web Service" seçin
2. GitHub repository-ni bağlayın: `kral14/mobilsayt`
3. Konfiqurasiya:
   - **Name**: `mobilsayt-backend`
   - **Environment**: `Node`
   - **Region**: İstədiyiniz region (məsələn: Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend` (boş buraxın, çünki build command-də `cd backend` yazırıq)
   - **Build Command**: `cd backend && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

4. **Environment Variables** əlavə edin:
   - `DATABASE_URL`: PostgreSQL database URL (yuxarıda kopyaladığınız)
   - `JWT_SECRET`: Təsadüfi string (məsələn: `openssl rand -hex 32` ilə yaradın)
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render avtomatik təyin edir, amma təyin edə bilərsiniz)

5. **Advanced** → **Health Check Path**: `/api/health`

6. "Create Web Service" düyməsinə basın

7. **Qeyd**: Prisma migration-ları avtomatik olaraq backend start zamanı işə salınacaq (Shell lazım deyil, free plan-də Shell mövcud deyil)

### C. Web Frontend (PC versiyası) Yaradın

1. Render dashboard-da "New +" → "Static Site" seçin
2. GitHub repository-ni bağlayın: `kral14/mobilsayt`
3. Konfiqurasiya:
   - **Name**: `mobilsayt-web`
   - **Branch**: `main`
   - **Root Directory**: `web` (boş buraxın)
   - **Build Command**: `cd web && npm install && npm run build`
   - **Publish Directory**: `web/dist`

4. **Environment Variables** əlavə edin (vacib deyil, `render.yaml` avtomatik təyin edir):
   - `VITE_API_URL`: Backend service URL (məsələn: `https://mobilsayt-backend.onrender.com/api`)
   - **Qeyd**: `render.yaml` faylında `fromService` istifadə olunursa, bu avtomatik təyin olunacaq

5. "Create Static Site" düyməsinə basın

### D. Mobil Frontend Yaradın

1. Render dashboard-da "New +" → "Static Site" seçin
2. GitHub repository-ni bağlayın: `kral14/mobilsayt`
3. Konfiqurasiya:
   - **Name**: `mobilsayt-mobil`
   - **Branch**: `main`
   - **Root Directory**: `mobil` (boş buraxın)
   - **Build Command**: `cd mobil && npm install && npm run build`
   - **Publish Directory**: `mobil/dist`

4. **Environment Variables** əlavə edin (vacib deyil, `render.yaml` avtomatik təyin edir):
   - `VITE_API_URL`: Backend service URL (məsələn: `https://mobilsayt-backend.onrender.com/api`)
   - **Qeyd**: `render.yaml` faylında `fromService` istifadə olunursa, bu avtomatik təyin olunacaq

5. "Create Static Site" düyməsinə basın

## 3. Frontend API URL-ləri

Frontend-lərdə API URL-ləri environment variable-dan oxunur. `render.yaml` faylında `fromService` istifadə olunur, bu səbəbdən `VITE_API_URL` avtomatik təyin olunacaq.

Əgər manual təyin etmək istəsəniz:
- `VITE_API_URL`: Backend service URL + `/api` (məsələn: `https://mobilsayt-backend.onrender.com/api`)

Frontend-lərdə `api.ts` fayllarında `getApiBaseUrl()` funksiyası:
1. Əvvəlcə `VITE_API_URL` environment variable-ını yoxlayır
2. Yoxdursa, localhost üçün `http://localhost:5000/api` istifadə edir
3. Production-da `/api` istifadə edir (proxy ilə)

## 4. CORS Konfiqurasiyası

Backend-də CORS artıq aktivdir (`app.use(cors())`), buna görə frontend-lər backend-ə sorğu göndərə biləcək.

## 5. Test

1. Backend health check: `https://mobilsayt-backend.onrender.com/api/health`
2. Web frontend: `https://mobilsayt-web.onrender.com`
3. Mobil frontend: `https://mobilsayt-mobil.onrender.com`

## Qeydlər

- **Free plan**-də service-lər 15 dəqiqə aktivlik olmadıqda "sleep" rejiminə keçir. İlk sorğu 30-60 saniyə çəkə bilər.
- Database migration-ları backend deploy olduqdan sonra manual olaraq işə salmalısınız (Shell-dən).
- Environment variable-ları dəyişdikdən sonra service-i yenidən deploy etmək lazımdır.

## Problemlər və Həllər

### Backend deploy olmur
- Build log-ları yoxlayın
- `DATABASE_URL` düzgün təyin olunubmu yoxlayın
- Prisma Client generate olunubmu yoxlayın

### Frontend API-ə qoşula bilmir
- `VITE_API_URL` environment variable-ı təyin olunubmu yoxlayın
- Backend CORS aktivdirmi yoxlayın
- Browser console-da xətaları yoxlayın

### Database connection xətası
- `DATABASE_URL` düzgündürmü yoxlayın
- Database service-i aktivdirmi yoxlayın
- Prisma migration-ları işə salın: `npx prisma db push --accept-data-loss`

