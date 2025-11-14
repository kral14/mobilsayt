# Deploy Təlimatları - Render

## Tez Başlanğıc

### 1. GitHub Repository Yaratmaq

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mobil-sayt.git
git push -u origin main
```

### 2. Render-də Deploy

1. [Render.com](https://render.com) saytına daxil olun
2. "New +" → "Web Service"
3. GitHub repository-nizi seçin
4. Konfiqurasiya:
   - **Name:** `mobil-sayt-api`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Environment:** `Node`

### 3. Environment Variables

Render dashboard-da "Environment" bölməsində əlavə edin:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 4. Mobil Tətbiqdə API URL

`config/apiConfig.js` faylında production URL-i daxil edin:

```javascript
const PRODUCTION_API_URL = 'https://YOUR-APP-NAME.onrender.com/api';
```

Ətraflı təlimatlar üçün `RENDER_DEPLOY.md` faylına baxın.

