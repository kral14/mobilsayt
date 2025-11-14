# Render-də Environment Variables Əlavə Etmək - Addım Addım

## 📋 Addım 1: Render Dashboard-a Daxil Olun

1. [Render.com](https://render.com) saytına daxil olun
2. Login edin

## 📋 Addım 2: Web Service Yaratın (Əgər hələ yaratmamısınızsa)

1. Dashboard-da **"New +"** düyməsini basın
2. **"Web Service"** seçin
3. GitHub repository-nizi seçin
4. Aşağıdakı məlumatları daxil edin:
   - **Name:** `mobil-sayt-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Plan:** `Free` (və ya istədiyiniz plan)

## 📋 Addım 3: Environment Variables Əlavə Etmək

Web service yaratdıqdan sonra:

### 3.1. Environment Bölməsinə Daxil Olun

1. Sol menyudan **"Environment"** bölməsinə daxil olun
2. Və ya service səhifəsində **"Environment"** tab-ına basın

### 3.2. Variable-ları Əlavə Edin

Hər bir variable üçün aşağıdakı addımları təkrarlayın:

#### ✅ Variable 1: NODE_ENV

1. **"Add Environment Variable"** düyməsini basın
2. **Key:** `NODE_ENV` yazın
3. **Value:** `production` yazın
4. **"Save Changes"** basın

#### ✅ Variable 2: PORT

1. Yenidən **"Add Environment Variable"** düyməsini basın
2. **Key:** `PORT` yazın
3. **Value:** `10000` yazın
4. **"Save Changes"** basın

#### ✅ Variable 3: JWT_SECRET

1. Yenidən **"Add Environment Variable"** düyməsini basın
2. **Key:** `JWT_SECRET` yazın
3. **Value:** `your-very-secure-secret-key-here` yazın
   - **Qeyd:** Daha təhlükəsiz key üçün: `openssl rand -hex 32` komandasını işlədin
4. **"Save Changes"** basın

#### ✅ Variable 4: DATABASE_URL

1. Yenidən **"Add Environment Variable"** düyməsini basın
2. **Key:** `DATABASE_URL` yazın
3. **Value:** Aşağıdakı string-i kopyalayıb yapışdırın:
   ```
   postgresql://neondb_owner:npg_NVL31qxTnQrC@ep-wild-queen-adh4tc1u-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
4. **"Save Changes"** basın

## 📋 Addım 4: Deploy

1. Bütün variable-ları əlavə etdikdən sonra
2. Render **avtomatik olaraq yenidən deploy** edəcək
3. Deploy tamamlandıqdan sonra URL alacaqsınız: `https://mobil-sayt-api.onrender.com`

## 📋 Addım 5: Deploy Status Yoxlamaq

1. **"Events"** bölməsinə baxın - deploy prosesini görə bilərsiniz
2. **"Logs"** bölməsinə baxın - server log-larını görə bilərsiniz
3. Deploy uğurlu olduqda, **"Live"** status görünəcək

## ✅ Nəticə

Bütün environment variable-lar əlavə edildikdən sonra:
- ✅ Server avtomatik deploy olunacaq
- ✅ Database bağlantısı işləyəcək
- ✅ API hazır olacaq

## 🔍 Screenshot Təsviri:

```
Render Dashboard
├── Your Services
│   └── mobil-sayt-api
│       ├── Overview
│       ├── Environment  ← Buraya basın
│       ├── Events
│       ├── Logs
│       └── Settings
│
Environment səhifəsində:
├── Environment Variables
│   ├── [Add Environment Variable] ← Buraya basın
│   │   ├── Key: NODE_ENV
│   │   ├── Value: production
│   │   └── [Save Changes]
│   │
│   ├── [Add Environment Variable]
│   │   ├── Key: PORT
│   │   ├── Value: 10000
│   │   └── [Save Changes]
│   │
│   └── ... (digər variable-lar)
```

## ⚠️ Qeydlər:

- Environment variable-lar **sensitive məlumatlar** üçündür
- `JWT_SECRET` üçün **təhlükəsiz, təsadüfi** bir key istifadə edin
- `DATABASE_URL` düzgün olmalıdır
- Variable-ları dəyişdirdikdən sonra Render avtomatik deploy edəcək
