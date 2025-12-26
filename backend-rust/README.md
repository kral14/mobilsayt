# Rust Backend

## 🚀 Server Başlatma

### Production Mode (Sürətli):
```powershell
.\start.ps1
```
və ya
```cmd
start.bat
```

### Development Mode (Auto-reload):
```powershell
.\start-dev.ps1
```

---

## 📝 Konfiqurasiya

Server avtomatik aşağıdakı parametrlərlə işə düşür:
- **Host:** 0.0.0.0 (bütün interfeyslər)
- **Port:** 8080
- **Database:** Neon PostgreSQL

---

## 🔧 Manual Başlatma

Əgər manual başlatmaq istəyirsinizsə:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:HOST="0.0.0.0"
$env:PORT="8080"
cargo run --release
```

---

## ✅ Test

Server işə düşdükdə test edin:
```powershell
curl http://localhost:8080/api/health
curl http://localhost:8080/api/products?limit=5
```

---

## 📊 Performans

- **Node.js:** ~1285ms (50 məhsul)
- **Rust:** ~614ms (50 məhsul)
- **Fərq:** 2.1x daha sürətli! 🚀
