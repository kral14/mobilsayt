# 🚀 Netlify Deployment - Qısa Təlimat

## 1️⃣ Backend-i Deploy Edin (Render)

Backend-i Render-də deploy edin və URL-ini qeyd edin:
- Məsələn: `https://mobilsayt-backend.onrender.com`

## 2️⃣ Netlify-də Frontend Deploy

### GitHub ilə (Ən Asan):

1. **Netlify.com**-a daxil olun
2. **"Add new site"** → **"Import an existing project"**
3. **GitHub**-ı seçin və repository-nizi bağlayın
4. **Build settings**:
   - Base directory: `web` (və ya boş buraxın)
   - Build command: `cd web && npm install && npm run build`
   - Publish directory: `web/dist`
5. **Environment variables** əlavə edin:
   - `VITE_API_URL` = `https://mobilsayt-backend.onrender.com/api`
6. **"Deploy site"** klikləyin

### Netlify CLI ilə:

```bash
# CLI quraşdırın
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd web
netlify env:set VITE_API_URL "https://mobilsayt-backend.onrender.com/api"
netlify deploy --prod
```

## 3️⃣ Backend CORS Təyin Edin

Backend-də Render environment variables-ə əlavə edin:
- `NETLIFY_URL` = Netlify saytınızın URL-i (məsələn: `https://your-site.netlify.app`)

Və ya backend CORS-də avtomatik olaraq `.netlify.app` domain-ləri qəbul olunur.

## ✅ Hazır!

Saytınız deploy olundu. Hər dəfə `main` branch-ə push etdikdə avtomatik deploy olunacaq.

## 📝 Ətraflı Təlimat

Ətraflı təlimat üçün `NETLIFY_DEPLOYMENT.md` faylına baxın.

