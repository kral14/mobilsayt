# Plan İdarəetmə Sistemi

Bu qovluq layihənin bütün planlarını saxlayır və izləyir.

## 📁 Struktur

```
plans/
├── README.md           # Bu fayl
├── PLAN_INDEX.md      # Bütün planların master cədvəli
├── active/            # Aktiv planlar (hazırda işlənilir)
├── completed/         # Tamamlanmış planlar
├── archived/          # Köhnə/ləğv edilmiş planlar
└── templates/         # Plan şablonları
```

## 🎯 Plan Statusları

| Status | Icon | Açıqlama |
|--------|------|----------|
| `new` | 🆕 | Yeni plan, hələ başlanmayıb |
| `in-progress` | 🟡 | Aktiv işlənilir |
| `blocked` | 🔴 | Problem var, davam edə bilmir |
| `completed` | ✅ | Tamamlandı |
| `archived` | 📦 | Ləğv edildi və ya köhnəlib |

## 📝 Yeni Plan Yaratmaq

1. Template-i kopyalayın:
```bash
cp plans/templates/plan-template.md plans/active/00X-plan-name.md
```

2. Plan faylını doldurun (metadata, məqsəd, tapşırıqlar)

3. `PLAN_INDEX.md`-ə əlavə edin

4. Git-ə commit edin:
```bash
git add plans/
git commit -m "feat: add plan 00X - Plan Name"
git push
```

## 🔄 Plan Statusunu Yeniləmək

1. Plan faylında `status` və `updated` field-lərini yeniləyin
2. Tərəqqi % və tapşırıq checklist-i yeniləyin
3. `PLAN_INDEX.md`-də statusu yeniləyin
4. Dəyişiklikləri commit edin

## ✅ Planı Tamamlamaq

1. Plan faylında:
   - `status: completed`
   - Tamamlanma tarixini əlavə edin
   
2. Faylı köçürün:
```bash
git mv plans/active/00X-plan.md plans/completed/00X-plan.md
```

3. `PLAN_INDEX.md` yeniləyin

4. Commit edin:
```bash
git add plans/
git commit -m "feat: complete plan 00X - Plan Name"
git push
```

## 🤖 AI Agent Workflow

AI agent işə başlayanda:

1. `PLAN_INDEX.md` oxuyur
2. Aktiv planları yoxlayır
3. User-in istədiyi və ya ən yüksək prioritetli planı seçir
4. Plan faylını oxuyub tapşırıqlara davam edir
5. Tərəqqi etdikcə plan faylını və index-i yeniləyir

## 📋 Plan Faylı Formatı

Hər plan faylı bu strukturu izləyir:

```markdown
---
id: 001
title: Plan Adı
status: new
priority: high
created: 2025-12-16
updated: 2025-12-16
assignee: AI Agent
tags: [tag1, tag2]
dependencies: []
---

# Plan Adı

## 📊 Status Xülasəsi
- **Ümumi tərəqqi:** 0%
- **Tamamlanmış:** 0/10 task
- **Problemlər:** Yoxdur
- **Növbəti addım:** ...

## 🎯 Məqsəd
[Plan məqsədi]

## 📋 Tapşırıqlar
- [ ] Task 1
- [ ] Task 2

## 🔗 Əlaqəli Fayllar
- [file.tsx](../path/to/file.tsx)

## 📝 Dəyişikliklər Tarixi
### 2025-12-16
- Plan yaradıldı
```

## 🔍 Planları Axtarmaq

```bash
# Status-a görə
grep "status: in-progress" plans/active/*.md

# Tag-a görə
grep "tags:.*ui" plans/**/*.md

# Mətn axtarışı
grep -r "WindowManager" plans/
```

## 💡 Best Practices

- ✅ Planları kiçik, idarə oluna bilən hissələrə bölün
- ✅ Statusu tez-tez yeniləyin
- ✅ Problemləri dərhal qeyd edin
- ✅ Əlaqəli faylları link edin
- ✅ Dəyişiklikləri tarixçədə qeyd edin
- ❌ Çox böyük planlar yaratmayın
- ❌ Köhnə planları silməyin, arxivləyin

## 📞 Kömək

Suallar üçün AI agent-ə müraciət edin və ya bu README-ni yeniləyin.
