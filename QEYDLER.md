# QR Kod və Network Bağlantısı Qeydləri

## Problem: "Veri Bulunmadi" Xətası

Fiziki cihazda (QR kod ilə) tətbiq işlədikdə "veri bulunmadi" xətası görünürsə, bu network bağlantısı problemi ola bilər.

## Həll:

### 1. Backend Serveri Yenidən Başlatın

Backend server indi bütün network interface-lərində dinləyir (`0.0.0.0`). Serveri yenidən başlatın:

```bash
npm run server
```

Server başladıqdan sonra konsolda IP ünvanınızı görəcəksiniz:
```
Network URL: http://172.16.1.63:3000/api
```

### 2. API URL Konfiqurasiyası

`config/apiConfig.js` faylı avtomatik olaraq Expo development server-in IP ünvanını tapır. 

**Əgər avtomatik işləmirsə**, manual dəyişdirin:

```javascript
// config/apiConfig.js faylını açın və getApiUrl() funksiyasını dəyişdirin:

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  
  // Manual IP ünvanı (sizin IP ünvanınızı daxil edin)
  return 'http://172.16.1.63:3000/api'; // ← Buraya IP ünvanınızı yazın
};
```

### 3. Firewall Yoxlaması

Windows Firewall backend serverə icazə verməlidir:

1. Windows Firewall-u açın
2. "Advanced settings" → "Inbound Rules" → "New Rule"
3. Port → TCP → 3000 → Allow
4. OK

Və ya development zamanı firewall-u müvəqqəti söndürün.

### 4. Eyni Wi-Fi Şəbəkəsi

- ✅ Kompüter və mobil cihaz **eyni Wi-Fi şəbəkəsində** olmalıdır
- ❌ Fərqli şəbəkələrdə olsalar, bağlantı işləməyəcək

### 5. Test

1. **Backend serverin işlədiyini yoxlayın:**
   - Kompüterdə: `http://localhost:3000/`
   - Mobil cihazdan browser-də: `http://172.16.1.63:3000/` (IP ünvanınızı daxil edin)

2. **Əgər mobil cihazdan açılırsa**, network bağlantısı işləyir ✅

3. **Əgər açılmırsa**, firewall və ya network problemi var ❌

## Debug:

### Mobil tətbiqdə konsol log-ları:

1. Expo DevTools-da "Logs" bölməsinə baxın
2. `[API Config] API_URL:` mesajını yoxlayın
3. Xəta mesajlarını oxuyun

### Əgər hələ də işləmirsə:

1. `config/apiConfig.js` faylında manual IP ünvanı daxil edin
2. Mobil tətbiqi yenidən yükləyin (reload)
3. Backend serverin işlədiyini yoxlayın

## IP Ünvanını Tapmaq:

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

"IPv4 Address" sətrini tapın - bu sizin IP ünvanınızdır.
