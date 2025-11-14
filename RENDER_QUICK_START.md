# Render Deploy - Tez Başlanğıc

## 1. GitHub Repository Push Edin

```bash
git init
git add .
git commit -m "Ready for Render deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mobil-sayt.git
git push -u origin main
```

## 2. Render-də Web Service Yaratın

1. [render.com](https://render.com) → Login
2. "New +" → "Web Service"
3. GitHub repo-nu seçin
4. Konfiqurasiya:
   - Name: `mobil-sayt-api`
   - Build: `npm install`
   - Start: `npm run server`

## 3. Environment Variables Əlavə Edin

**"Environment" bölməsində** aşağıdakıları əlavə edin:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `JWT_SECRET` | `your-very-secure-secret-key-here` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

## 4. Deploy

1. "Create Web Service" basın
2. Deploy tamamlanmasını gözləyin
3. URL alın: `https://mobil-sayt-api.onrender.com`

## 5. Mobil Tətbiqdə URL Dəyişdirin

`config/apiConfig.js` faylında:

```javascript
const PRODUCTION_API_URL = 'https://mobil-sayt-api.onrender.com/api';
```

## ✅ Hazır!

Ətraflı təlimatlar: `RENDER_DEPLOY.md`

