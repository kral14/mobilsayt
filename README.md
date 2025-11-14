# Mobil Sayt - iOS və Android Tətbiqi

Bu layihə React Native və Expo istifadə edərək iOS və Android üçün hazırlanmış mobil tətbiqdir.

## Xüsusiyyətlər

- ✅ Login/Giriş sistemi
- ✅ Şifrəni unutdum funksionallığı
- ✅ Neon PostgreSQL verilənlər bazası ilə inteqrasiya
- ✅ Təhlükəsiz token saxlama (Expo SecureStore)
- ✅ Modern və gözəl UI dizaynı

## Quraşdırma

### Tələblər

- Node.js (v16 və ya daha yeni)
- npm və ya yarn
- Python 3.x (avtomatik başlatma üçün)
- Expo CLI
- iOS üçün: Xcode (yalnız macOS)
- Android üçün: Android Studio

### Addımlar

#### Seçim 1: Avtomatik Başlatma (Tövsiyə olunur) 🚀

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Və ya birbaşa Python ilə:**
```bash
python start.py
```

Bu script avtomatik olaraq:
- ✅ Sistem yoxlamaları aparır (Node.js, npm)
- ✅ Dependencies quraşdırır (əgər lazımsa)
- ✅ Backend serveri işə salır
- ✅ Mobil tətbiqi işə salır

#### Seçim 2: Manual Başlatma

1. **Dependencies quraşdırın:**
```bash
npm install
```

2. **Backend serveri işə salın (birinci terminal):**
```bash
npm run server
```

3. **Mobil tətbiqi işə salın (ikinci terminal):**
```bash
npm start
```

4. **iOS simulator üçün:**
```bash
npm run ios
```

5. **Android emulator üçün:**
```bash
npm run android
```

## Backend API

Layihədə backend API server daxildir. Backend serveri ayrıca işə salmaq lazımdır.

### Backend Serveri İşə Salmaq

1. **Backend serveri başlatın:**
```bash
npm run server
```

Server `http://localhost:3000` ünvanında işə düşəcək.

### API Endpoints

- `POST /api/auth/login` - Giriş
- `POST /api/auth/forgot-password` - Şifrəni unutdum
- `POST /api/auth/register` - Qeydiyyat (opsional)

### Mobil Tətbiq üçün API URL

Mobil tətbiqdə backend API-yə qoşulmaq üçün `services/authService.js` faylında `API_URL` dəyişənini dəyişdirin:

**Emulator/Simulator üçün:**
```javascript
const API_URL = 'http://localhost:3000/api';
```

**Fiziki cihaz üçün:**
Fiziki cihazdan istifadə edirsinizsə, `localhost` əvəzinə kompüterinizin IP ünvanını istifadə edin:
```javascript
const API_URL = 'http://192.168.1.XXX:3000/api'; // IP ünvanınızı daxil edin
```

Windows-da IP ünvanını tapmaq üçün:
```bash
ipconfig
```

Mac/Linux-da:
```bash
ifconfig
```

## Verilənlər Bazası

Layihə Neon PostgreSQL verilənlər bazası ilə işləyir. Database konfiqurasiyası `config/database.js` faylında təyin edilmişdir.

## Struktur

```
mobil-sayt/
├── App.js                 # Ana komponent və navigation
├── screens/              # Ekran komponentləri
│   ├── LoginScreen.js
│   ├── ForgotPasswordScreen.js
│   └── HomeScreen.js
├── services/            # Servis funksiyaları
│   └── authService.js
├── config/              # Konfiqurasiya faylları
│   └── database.js
└── package.json
```

## Qeydlər

- Şifrəni unutdum funksionallığı üçün e-poçt konfiqurasiyası backend-də təyin edilməlidir
- Token-lar Expo SecureStore istifadə edərək təhlükəsiz şəkildə saxlanılır
- Database connection pool istifadə olunur performans üçün

## İstehsal üçün hazırlıq

1. `app.json` faylında bundle identifier və package name-i dəyişdirin
2. Backend API URL-ini production URL ilə dəyişdirin
3. Environment variables istifadə edin məxfi məlumatlar üçün

## ⚠️ Development Xətaları

Development zamanı konsolda görünən CSP (Content Security Policy) xətaları **normaldır** və tətbiqin işləməsinə təsir etmir. Bu xətalar:
- Chrome DevTools extension-larından gəlir
- Expo web development zamanı font yükləməsi ilə bağlıdır
- Production build-də olmaz

Ətraflı məlumat üçün `NOTLAR.md` faylına baxın.

## Dəstək

Hər hansı sualınız varsa, zəhmət olmasa issue açın.

