# Qeydlər və Xəbərdarlıqlar

## CSP (Content Security Policy) Xətaları

Development zamanı konsolda görünən CSP xətaları **normaldır** və tətbiqin işləməsinə təsir etmir.

### Xəta növləri:

1. **Font yükləmə xətaları** - Expo web development zamanı font yükləməsi ilə bağlı
2. **Chrome DevTools xətaları** - Chrome extension-larından gəlir
3. **404 xətaları** - Bəzi Chrome extension-ları `.well-known` endpoint-ləri axtarır

### Bu xətalar:

- ✅ **Tətbiqin işləməsinə təsir etmir**
- ✅ **Production build-də olmaz**
- ✅ **Development zamanı normaldır**

### Xətaları azaltmaq üçün:

1. **Chrome extension-larını söndürün** (development zamanı)
2. **Incognito mode istifadə edin** (extension-lar işləmir)
3. **Firefox istifadə edin** (daha az xəta)

## Backend Server

Backend server `http://localhost:3000` ünvanında işləyir.

### API Endpoints:

- `GET /` - API məlumatları
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Qeydiyyat
- `POST /api/auth/forgot-password` - Şifrəni unutdum
- `GET /api/products` - Məhsullar
- `POST /api/products` - Yeni məhsul
- `GET /api/customers` - Müştərilər
- `POST /api/customers` - Yeni müştəri
- `GET /api/suppliers` - Satıcılar
- `POST /api/suppliers` - Yeni satıcı
- `GET /api/purchases/invoices` - Alış qaimələri
- `POST /api/purchases` - Yeni alış qaiməsi
- `GET /api/sales/invoices` - Satış qaimələri
- `POST /api/sales` - Yeni satış qaiməsi
- `GET /api/warehouse` - Anbar

## Mobil Tətbiq

Mobil tətbiq Expo development server ilə işləyir.

### İstifadə:

1. **iOS Simulator:** `npm run ios` və ya Expo DevTools-dan
2. **Android Emulator:** `npm run android` və ya Expo DevTools-dan
3. **Fiziki cihaz:** Expo Go app ilə QR kod skan edin

## Port Problemləri

Əgər port 3000 istifadə olunursa:

1. **Script avtomatik soruşacaq** və prosesi dayandıra bilər
2. **Manual dayandırma:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /F /PID <PID>
   ```
3. **Başqa port istifadə edin:**
   ```bash
   PORT=3001 npm run server
   ```

## Database

Database Neon PostgreSQL istifadə edir və avtomatik bağlanır.

### Cədvəllər:

- `users` - İstifadəçilər
- `products` - Məhsullar
- `customers` - Müştərilər
- `suppliers` - Satıcılar
- `warehouse` - Anbar
- `purchase_invoices` - Alış qaimələri
- `purchase_invoice_items` - Alış qaiməsi məhsulları
- `sale_invoices` - Satış qaimələri
- `sale_invoice_items` - Satış qaiməsi məhsulları

## Debug Log Mesajları

Bütün kodlarda debug log mesajları var:

- `[INFO]` - Ümumi məlumat
- `[DEBUG]` - Debug məlumatları
- `[SUCCESS]` - Uğurlu əməliyyatlar
- `[WARN]` - Xəbərdarlıqlar
- `[ERROR]` - Xətalar

Log mesajlarını `utils/logger.js` və `utils/serverLogger.js` fayllarında idarə edə bilərsiniz.

