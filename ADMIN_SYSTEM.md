# 🔐 Admin User Sistemi

Admin user sistemi artıq qurulub və istifadəyə hazırdır!

## 📋 Xüsusiyyətlər

### Backend (API)
- ✅ **Admin Authentication Middleware** - Admin icazələrini yoxlayır
- ✅ **User Management API** - İstifadəçi CRUD əməliyyatları
- ✅ **Activity Logs** - Bütün admin əməliyyatları log-lanır
- ✅ **Role-based Access Control** - USER və ADMIN rolları

### Frontend (Web)
- ✅ **Admin Panel** - `/admin` route-da tam funksional admin paneli
- ✅ **User Management UI** - İstifadəçi yaratma, redaktə, silmə
- ✅ **Activity Logs Viewer** - Real-time log görüntüləmə və filtrasiya
- ✅ **Protected Routes** - Admin səhifələri qorunur

### Database
- ✅ **users table** - Yeni field-lər: `full_name`, `role`, `is_admin`, `is_active`
- ✅ **activity_logs table** - Sistem aktivliklərini saxlayır

## 🚀 Quraşdırma

### 1. Database Migration
```bash
cd backend
python migrate_admin_system.py
```

### 2. Prisma Client Yenilə
```bash
cd backend
npx prisma generate
```

### 3. Backend Başlat
```bash
cd backend
npm run dev
```

### 4. Frontend Başlat
```bash
cd web
npm run dev
```

## 👤 İlk Admin User Yaratma

### Variant 1: Database-də manual
```sql
-- Əvvəlcə normal user yarat (web interfeys-dən qeydiyyat)
-- Sonra database-də admin et:
UPDATE users 
SET is_admin = TRUE, role = 'ADMIN' 
WHERE email = 'your@email.com';
```

### Variant 2: API ilə (əgər artıq admin user varsa)
```bash
POST http://localhost:5000/api/admin/users
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "password": "securepassword",
  "full_name": "Admin User",
  "role": "ADMIN",
  "is_admin": true
}
```

## 🔌 API Endpoints

### Admin Routes (Requires Admin Token)
```
GET    /api/admin/users          - Bütün istifadəçiləri əldə et
POST   /api/admin/users          - Yeni istifadəçi yarat
PUT    /api/admin/users/:id      - İstifadəçini yenilə
DELETE /api/admin/users/:id      - İstifadəçini sil
GET    /api/admin/users/stats    - İstifadəçi statistikası
```

### Auth Routes (Public)
```
POST   /api/auth/register        - Qeydiyyat (artıq role dəstəkləyir)
POST   /api/auth/login           - Giriş (role və is_admin qaytarır)
```

## 🎨 Frontend Routes

```
/admin                 - Admin Panel (Protected)
  ├── İstifadəçilər    - User management
  ├── Ayarlar          - System settings (coming soon)
  └── Loglar           - Activity logs viewer
```

## 📊 User Roles

### USER (Default)
- Normal istifadəçi icazələri
- Öz profilini görə və redaktə edə bilər
- Məhsul, qaimə və s. əməliyyatlar edə bilər

### ADMIN
- Bütün USER icazələri
- İstifadəçi idarəetməsi
- Sistem ayarları
- Activity logs görüntüləmə
- Admin panel-ə giriş

## 🔒 Security

### Middleware Protection
```typescript
// Admin-only route
router.use(requireAdmin)

// Authenticated user (admin or user)
router.use(requireAuth)
```

### Token Structure
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "ADMIN",
    "is_admin": true,
    "is_active": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📝 Activity Logs

Hər admin əməliyyatı avtomatik log-lanır:

```typescript
{
  "user_id": 1,
  "action": "İstifadəçi yaradıldı",
  "category": "user",
  "level": "success",
  "details": "Yeni istifadəçi: test@example.com",
  "metadata": {
    "created_user_id": 5,
    "role": "USER"
  },
  "timestamp": "2025-12-13T21:00:00Z"
}
```

### Log Categories
- `window` - Pəncərə əməliyyatları
- `invoice` - Qaimə əməliyyatları
- `user` - İstifadəçi əməliyyatları
- `system` - Sistem əməliyyatları
- `data` - Data əməliyyatları

### Log Levels
- `info` - Məlumat
- `success` - Uğurlu əməliyyat
- `warning` - Xəbərdarlıq
- `error` - Xəta

## 🎯 İstifadə Nümunələri

### Admin Panel-ə Giriş
1. Normal user olaraq qeydiyyatdan keçin
2. Database-də admin edin (yuxarıdakı SQL)
3. Login olun
4. `/admin` səhifəsinə gedin

### Yeni User Yaratma
1. Admin panel-də "İstifadəçilər" tab-ına keçin
2. "➕ Yeni İstifadəçi" düyməsinə basın
3. Formu doldurun
4. "Yarat" düyməsinə basın

### User Redaktə
1. User siyahısında "✏️ Redaktə" düyməsinə basın
2. Məlumatları dəyişdirin
3. "Yenilə" düyməsinə basın

### Activity Logs Görüntüləmə
1. Admin panel-də "Loglar" tab-ına keçin
2. Filter və axtarış istifadə edin
3. Log-a klik edərək metadata görün
4. Export və ya Təmizlə düymələrindən istifadə edin

## 🐛 Troubleshooting

### Prisma Client Xətaları
```bash
# Prisma client-i yenilə
cd backend
npx prisma generate

# Əgər problem davam edirsə
rm -rf node_modules
npm install
npx prisma generate
```

### Database Connection Xətası
```bash
# .env faylını yoxlayın
# DATABASE_URL düzgün olmalıdır
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Admin Icazəsi Xətası
```sql
-- User-in admin olduğunu yoxlayın
SELECT id, email, role, is_admin FROM users WHERE email = 'your@email.com';

-- Admin edin
UPDATE users SET is_admin = TRUE, role = 'ADMIN' WHERE email = 'your@email.com';
```

## 📚 Növbəti Addımlar

- [ ] Email verification sistemi
- [ ] Password reset funksiyası
- [ ] User permissions (custom permissions)
- [ ] Audit trail (detailed activity tracking)
- [ ] Admin dashboard (statistics və charts)
- [ ] Bulk user operations
- [ ] User groups/teams

## 💡 Qeydlər

- Admin user özünü silə bilməz
- Password dəyişdirmə zamanı boş buraxsanız köhnə password qalır
- Bütün admin əməliyyatları activity_logs-da saxlanır
- Frontend-də admin panel yalnız admin user-lər üçün görünür (route protected)
