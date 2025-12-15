# Netlify-də Deployment Təlimatları

Bu sənəd Netlify-də proyekti necə deploy etməyi izah edir.

## 📋 Tələblər

1. **Netlify hesabı** - [netlify.com](https://netlify.com) üzərindən pulsuz yaradın
2. **GitHub/GitLab/Bitbucket repository** - Kodunuz Git repository-də olmalıdır
3. **Backend API URL** - Backend Render-də və ya başqa servisdə deploy olunmalıdır

## 🚀 Deployment Addımları

### 1. Backend-i Deploy Edin (Render-də)

Backend-i əvvəlcə Render-də deploy edin (və ya başqa servisdə):

1. [Render.com](https://render.com) üzərindən yeni Web Service yaradın
2. Repository-nizi bağlayın
3. Aşağıdakı konfiqurasiyanı istifadə edin:
   - **Build Command**: `cd backend && npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command**: `cd backend && npm run start:prod`
   - **Environment Variables**:
     - `DATABASE_URL` - PostgreSQL database URL (Neon-dan)
     - `JWT_SECRET` - JWT token üçün gizli açar
     - `NODE_ENV=production`
     - `PORT=5000`

4. Backend URL-ini qeyd edin (məsələn: `https://mobilsayt-backend.onrender.com`)

### 2. Frontend-i Netlify-də Deploy Edin

#### Seçim 1: Netlify Dashboard-dan (Asan)

1. [Netlify Dashboard](https://app.netlify.com) açın
2. "Add new site" → "Import an existing project" klikləyin
3. Git provider-nizi seçin (GitHub, GitLab, və s.)
4. Repository-nizi seçin
5. Build settings:
   - **Base directory**: `web` (boş buraxın, çünki `netlify.toml` var)
   - **Build command**: `npm install && npm run build` (netlify.toml-də təyin olunub)
   - **Publish directory**: `web/dist` (netlify.toml-də təyin olunub)
6. "Advanced" → "New variable" klikləyin və əlavə edin:
   - **Key**: `VITE_API_URL`
   - **Value**: Backend URL-iniz (məsələn: `https://mobilsayt-backend.onrender.com/api`)
7. "Deploy site" klikləyin

#### Seçim 2: Netlify CLI ilə

```bash
# Netlify CLI quraşdırın
npm install -g netlify-cli

# Netlify-də login olun
netlify login

# Proyekt qovluğuna gedin
cd web

# Environment variable təyin edin
netlify env:set VITE_API_URL "https://mobilsayt-backend.onrender.com/api"

# Deploy edin
netlify deploy --prod
```

### 3. Environment Variables Təyin Edin

Netlify Dashboard-dan aşağıdakı environment variable-ı təyin edin:

- **VITE_API_URL**: Backend API URL-iniz (məsələn: `https://mobilsayt-backend.onrender.com/api`)

**Təyin etmək üçün:**
1. Netlify Dashboard → Site Settings → Environment variables
2. "Add a variable" klikləyin
3. Key: `VITE_API_URL`, Value: Backend URL-iniz
4. "Save" klikləyin

### 4. CORS Konfiqurasiyası

Backend-də Netlify URL-inizi CORS allowed origins-ə əlavə edin:

`backend/src/index.ts` faylında:

```typescript
const allowedOrigins = [
  'https://your-site-name.netlify.app',  // Netlify URL-iniz
  'https://mobilsayt-web.onrender.com',
  // ... digər URL-lər
]
```

### 5. Custom Domain (İstəyə görə)

1. Netlify Dashboard → Domain settings
2. "Add custom domain" klikləyin
3. Domain adınızı daxil edin
4. DNS qeydlərini təyin edin (Netlify təlimatlarına görə)

## 🔄 Continuous Deployment

Netlify avtomatik olaraq Git repository-nizdəki dəyişiklikləri deploy edir:

- **Main/Master branch**-ə push etdikdə → Production deploy
- **Digər branch-lər** → Preview deploy

## 📝 Build Logs

Build prosesini izləmək üçün:
1. Netlify Dashboard → Deploys
2. Hər hansı deploy-a klikləyin
3. "Deploy log" bölməsini açın

## 🐛 Problemlərin Həlli

### Build xətası

- Build log-ları yoxlayın
- `netlify.toml` faylının düzgün olduğunu yoxlayın
- Node versiyasının uyğun olduğunu yoxlayın

### API çağırışları işləmir

- `VITE_API_URL` environment variable-ının düzgün təyin olunduğunu yoxlayın
- Backend CORS konfiqurasiyasını yoxlayın
- Browser console-da xəta mesajlarını yoxlayın

### Routing problemi

- `netlify.toml`-dəki redirects qaydasını yoxlayın
- `_redirects` faylının mövcud olduğunu yoxlayın

## 📚 Əlavə Resurslar

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## ✅ Deployment Yoxlaması

Deployment-dan sonra yoxlayın:

1. ✅ Sayt açılır
2. ✅ Login/Register işləyir
3. ✅ API çağırışları işləyir
4. ✅ Routing düzgün işləyir (refresh etdikdə 404 vermir)
5. ✅ Mobile responsive işləyir

