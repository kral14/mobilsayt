# Render-də Deploy Təlimatları

## 1. Render Account Yaratmaq

1. [Render.com](https://render.com) saytına daxil olun
2. "Get Started for Free" düyməsini basın
3. GitHub ilə sign up edin (və ya email ilə)

## 2. GitHub Repository Yaratmaq

1. GitHub-da yeni repository yaradın
2. Bütün faylları commit edin və push edin:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mobil-sayt.git
git push -u origin main
```

## 3. Render-də Web Service Yaratmaq

1. Render dashboard-da "New +" → "Web Service" seçin
2. GitHub repository-nizi seçin
3. Aşağıdakı konfiqurasiyanı daxil edin:

### Basic Settings:
- **Name:** `mobil-sayt-api`
- **Environment:** `Node`
- **Region:** İstədiyiniz region (məsələn: `Oregon (US West)`)
- **Branch:** `main` (və ya `master`)

### Build & Deploy:
- **Build Command:** `npm install`
- **Start Command:** `npm run server`

### Environment Variables Əlavə Etmək:

Web service yaratdıqdan sonra:

1. **Sol menyudan "Environment" bölməsinə** daxil olun
2. **"Add Environment Variable" düyməsini** basın
3. Hər bir variable üçün aşağıdakıları əlavə edin:

#### Variable 1: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- "Save Changes" basın

#### Variable 2: PORT
- **Key:** `PORT`
- **Value:** `10000`
- "Save Changes" basın

#### Variable 3: JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:** `your-very-secure-secret-key-here-change-this`
- "Save Changes" basın

**Qeyd:** `JWT_SECRET` üçün təsadüfi, təhlükəsiz bir string istifadə edin (məsələn: `openssl rand -hex 32`)

#### Variable 4: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** `postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- "Save Changes" basın

**Qeyd:** Bütün variable-ları əlavə etdikdən sonra Render avtomatik olaraq yenidən deploy edəcək.

## 4. Deploy

1. "Create Web Service" düyməsini basın
2. Render avtomatik olaraq build və deploy edəcək
3. Deploy tamamlandıqdan sonra URL alacaqsınız: `https://mobil-sayt-api.onrender.com`

## 5. Mobil Tətbiqdə API URL-i Dəyişdirmək

Deploy tamamlandıqdan sonra, mobil tətbiqdə API URL-i dəyişdirin:

### `config/apiConfig.js` faylında:

```javascript
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  
  // Production URL (Render-dən aldığınız URL)
  return 'https://mobil-sayt-api.onrender.com/api'; // ← Buraya Render URL-inizi yazın
};
```

Və ya environment variable istifadə edin:

```javascript
const PRODUCTION_API_URL = 'https://mobil-sayt-api.onrender.com/api';
const DEVELOPMENT_API_URL = 'http://localhost:3000/api';

export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
```

## 6. Test

1. Render URL-ini browser-də açın: `https://mobil-sayt-api.onrender.com/`
2. API cavabını görməlisiniz
3. Mobil tətbiqdə test edin

## 7. Free Plan Qeydləri

Render free plan-da:
- ⚠️ 15 dəqiqə aktivlik olmadıqdan sonra server "sleep" olur
- ⚠️ İlk request yavaş ola bilər (server oyanır)
- ⚠️ Aylıq 750 saat limit var

Production üçün paid plan tövsiyə olunur.

## 8. Custom Domain (Opsional)

1. Render dashboard-da "Settings" → "Custom Domains"
2. Domain əlavə edin
3. DNS konfiqurasiyasını edin

## Troubleshooting

### Server işləmir:
- Environment variable-ları yoxlayın
- Build log-larına baxın
- Database connection string-i yoxlayın

### Database bağlantısı xətası:
- `DATABASE_URL` environment variable-ı düzgün olmalıdır
- Neon PostgreSQL-də connection string-i yoxlayın

### CORS xətası:
- `server.js`-də CORS artıq konfiqurasiya edilib
- Əgər problem varsa, `app.use(cors())` əvəzinə spesifik origin əlavə edin

