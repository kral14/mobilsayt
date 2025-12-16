# Push Script - Avtomatik Versiya İdarəetməsi

Bu skript git commit və push əməliyyatlarını avtomatik versiya nömrələri ilə icra edir.

## 🎯 Xüsusiyyətlər

- ✅ Avtomatik versiya artırma (v7.1 → v7.2 → v7.3)
- ✅ Git tag yaradır
- ✅ Commit mesajına versiya əlavə edir
- ✅ Major və minor versiya artırma dəstəyi
- ✅ Avtomatik git identity konfiqurasiyası

## 📦 Versiya Formatı

```
v{major}.{minor}
```

Nümunələr:
- `v7.1` - İlk versiya
- `v7.2` - Minor artırma
- `v8.0` - Major artırma

## 🚀 İstifadə

### Əsas İstifadə (Minor Versiya Artırma)

```bash
python push.py -m "commit mesajınız"
```

Bu əmr:
1. Bütün dəyişiklikləri `git add .` ilə əlavə edir
2. Versiya nömrəsini artırır (v7.1 → v7.2)
3. Commit edir: `v7.2: commit mesajınız`
4. Git tag yaradır: `v7.2`
5. Push edir (həm branch, həm də tag)

### Major Versiya Artırma

```bash
python push.py -m "böyük dəyişiklik" --bump major
```

Bu əmr versiya nömrəsini major artırır (v7.5 → v8.0)

### Tag Olmadan Commit

```bash
python push.py -m "mesaj" --no-tag
```

Yalnız commit edir, tag yaratmır.

### Mesaj Olmadan (Avtomatik Mesaj)

```bash
python push.py
```

Avtomatik mesaj: `v7.2: update 2025-12-16 09:55:00 UTC`

### Dəyişiklik Yoxdursa

Əgər heç bir dəyişiklik yoxdursa, yalnız push edir:

```bash
python push.py
# Output: ℹ️  Heç bir dəyişiklik yoxdur, yalnız push icra olunur.
```

## 📋 Parametrlər

| Parametr | Qısa | Default | Açıqlama |
|----------|------|---------|----------|
| `--message` | `-m` | Avtomatik | Commit mesajı |
| `--bump` | - | `minor` | Versiya artırma tipi (`major` və ya `minor`) |
| `--remote` | - | `origin` | Remote repository adı |
| `--branch` | - | `main` | Branch adı |
| `--no-tag` | - | `false` | Tag yaratmamaq |

## 📊 Nümunələr

### 1. Plan sistemi əlavə etmək

```bash
python push.py -m "add plan management system"
```

**Output:**
```
📦 Cari versiya: v7.0
📦 Yeni versiya: v7.1
$ git add .
$ git commit -m v7.1: add plan management system
$ git tag -a v7.1 -m v7.1: add plan management system
🏷️  Tag yaradıldı: v7.1
$ git push origin main
$ git push origin v7.1
✅ Push tamamlandı: v7.1
```

### 2. Bug fix

```bash
python push.py -m "fix window focus issue"
```

**Output:**
```
📦 Cari versiya: v7.1
📦 Yeni versiya: v7.2
...
✅ Push tamamlandı: v7.2
```

### 3. Major release

```bash
python push.py -m "complete MDI window system" --bump major
```

**Output:**
```
📦 Cari versiya: v7.5
📦 Yeni versiya: v8.0
...
✅ Push tamamlandı: v8.0
```

## 🔍 Versiya Tarixini Görmək

```bash
# Bütün tag-ləri görmək
git tag

# Son 5 commit-i versiya ilə görmək
git log --oneline -5

# Müəyyən versiyaya baxmaq
git show v7.1
```

## ⚙️ Konfiqurasiya

### Git Identity

Skript avtomatik olaraq git identity-ni yoxlayır və lazım olduqda təyin edir:

```bash
git config user.name "Git User"
git config user.email "git@localhost"
```

Environment variable-lar ilə override edə bilərsiniz:

```bash
export GIT_USER_NAME="Sizin Adınız"
export GIT_USER_EMAIL="email@example.com"
python push.py -m "mesaj"
```

## 🎓 Versiya Strategiyası

### Minor Versiya (v7.1 → v7.2)

Kiçik dəyişikliklər üçün:
- Bug fixes
- Kiçik feature-lar
- Kod təmizləmə
- Dokumentasiya

### Major Versiya (v7.x → v8.0)

Böyük dəyişikliklər üçün:
- Breaking changes
- Böyük feature-lar
- Arxitektura dəyişiklikləri
- Major refactoring

## 🚨 Xəta Halları

### Git identity yoxdur

```
⚠️  Git user.name yoxdur, lokal olaraq təyin edilir: Git User
⚠️  Git user.email yoxdur, lokal olaraq təyin edilir: git@localhost
```

**Həll:** Environment variable-lar təyin edin və ya global git config-i yeniləyin.

### Command failed

```
❌ Command failed: git push origin main
```

**Həll:** 
- İnternet bağlantınızı yoxlayın
- Remote repository mövcudluğunu yoxlayın
- Authentication məlumatlarınızı yoxlayın

## 💡 Best Practices

1. **Mənalı commit mesajları yazın:**
   ```bash
   python push.py -m "fix invoice modal focus bug"
   ```

2. **Böyük dəyişikliklər üçün major bump istifadə edin:**
   ```bash
   python push.py -m "complete authentication system" --bump major
   ```

3. **Tez-tez commit edin:**
   - Hər feature üçün ayrı commit
   - Kiçik, idarə oluna bilən dəyişikliklər

4. **Tag-ləri silməyin:**
   - Versiya tarixçəsi üçün vacibdir
   - Production deployment-lər üçün istifadə olunur

## 🔗 Əlaqəli Fayllar

- [push.py](push.py) - Əsas skript
- [plans/](plans/) - Plan idarəetmə sistemi
- [.git/](../.git/) - Git repository

## 📝 Changelog

### v7.1 (2025-12-16)
- ✅ Avtomatik versiya idarəetməsi əlavə edildi
- ✅ Git tag dəstəyi
- ✅ Major/minor bump seçimləri
- ✅ Plan idarəetmə sistemi ilə inteqrasiya

## 🎉 Nəticə

İndi hər push avtomatik olaraq versiyalanır və tag-lənir! 🚀

```bash
# Sadəcə bunu yazın:
python push.py -m "your message"

# Və avtomatik olaraq:
# - Versiya artırılır (v7.1 → v7.2)
# - Commit edilir
# - Tag yaradılır
# - Push edilir
```
