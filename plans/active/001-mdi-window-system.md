---
id: 001
title: MDI Window System
status: in-progress
priority: high
created: 2025-12-09
updated: 2025-12-17
assignee: AI Agent
tags: [ui, windows, mdi, desktop, architecture]
dependencies: []
---

# MDI Window System

## 📊 Status Xülasəsi

- **Ümumi tərəqqi:** 90%
- **Tamamlanmış:** 9/10 task
- **Problemlər:** -
- **Növbəti addım:** Verification və Documentation

## 🎯 Məqsəd

Desktop OS (Windows/macOS) kimi window idarəetmə sistemi yaratmaq. İstifadəçilər eyni anda bir neçə "app" (məsələn, Invoice detalları) aça biləcək, onları drag edib resize edə biləcək və taskbar vasitəsilə idarə edəcəklər.

## 🏗️ Arxitektura

**Registry Pattern** istifadə edirik:
1. **WindowManager** - əməliyyat sistemi kimi
2. **Apps (Components)** - açar ilə qeydiyyatdan keçir (məsələn, `'invoice'`, `'customer'`)
3. Kodun istənilən yerindən `openApp('invoice', { id: 5 })` çağıra bilərsən

## 📋 Tapşırıqlar

### 1️⃣ Store Layer
- [x] `windowStore.ts` - `WindowInfo` generic `componentKey` istifadə edir

### 2️⃣ Component Layer
- [x] `WindowRegistry.tsx` - komponentləri map edir
- [x] `WindowFrame.tsx` - window frame (title bar, buttons, resize, drag)
- [x] `WindowManager.tsx` - bütün windowları render edir
- [x] `Layout.tsx` - WindowManager əlavə edildi
- [x] `InvoiceModal.tsx` - WindowManager ilə işləmək üçün adapt edilir

### 3️⃣ Page Layer
- [x] `Satis.tsx` - lokal modal state silindi, windowStore istifadə edir
- [x] Event listener (invoice-update) əlavə et

### 4️⃣ Window Management Features
- [x] Drag & drop
- [x] Resize
- [x] Focus handling
- [x] Minimize/Maximize/Close
- [x] Taskbar integration
- [x] Cross-page persistence

## 🔗 Əlaqəli Fayllar

- [WindowManager.tsx](../web/src/components/WindowManager.tsx)
- [WindowFrame.tsx](../web/src/components/WindowFrame.tsx)
- [WindowRegistry.tsx](../web/src/components/WindowRegistry.tsx)
- [windowStore.ts](../web/src/store/windowStore.ts)
- [Layout.tsx](../web/src/components/Layout.tsx)
- [InvoiceModal.tsx](../web/src/components/InvoiceModal.tsx)
- [Satis.tsx](../web/src/pages/Qaimeler/Satis.tsx)

## 📝 Dəyişikliklər Tarixi

### 2025-12-17
- Window focus problemi həll edildi
- Invoice update event listener əlavə edildi
- Status: in-progress (90% tamamlandı)

### 2025-12-15
- Window focus problemi aşkarlandı (z-index conflict)
- Status: in-progress (60% tamamlandı)
- Post-pull xətaları həll edildi

### 2025-12-09
- İlk plan yaradıldı
- Əsas komponentlər implement edildi:
  - WindowManager, WindowFrame, WindowRegistry
  - windowStore yeniləndi
  - Layout-a əlavə edildi
- Drag, resize, minimize/maximize funksiyaları əlavə edildi

## 🐛 Məlum Problemlər

### 🔴 Kritik: Window Focus Handling
**Status:** ✅ Həll edildi
**Həll:** Z-index idarəetməsi düzəldildi.

## ✅ Verification Plan

### Manual Verification
1. **Open Multiple Windows:**
   - "Satis Qaimeleri"-yə get
   - Invoice #1-ə "Edit" klik et → Window açılır
   - Invoice #2-yə "Edit" klik et → İkinci window açılır
   - Hər ikisi görünür ✅

2. **Window Management:**
   - Invoice #1-i sağa drag et ✅
   - Invoice #2-ni resize et ✅
   - Invoice #1-ə klik et (önə gəlməli) ✅
   - Invoice #1-i minimize et ✅
   - Taskbar-dan Invoice #1-i restore et ✅

3. **Cross-Page Persistence:**
   - Windowlar açıq olarkən "Ana Səhifə"-yə get
   - Windowlar açıq qalır ✅

4. **Closing:**
   - Invoice #1-i bağla
   - Taskbar-dan silinir ✅

## 💡 Növbəti Addımlar

1. Verification keçirmək
2. Documentation yeniləmək
3. Əlavə testlər et
4. Dokumentasiya yenilə

## 🎓 Öyrənilənlər

- Registry pattern çox effektivdir, yeni komponentlər əlavə etmək asandır
- Global state (zustand) window idarəetməsi üçün idealdır
- Cross-page persistence istifadəçi təcrübəsini yaxşılaşdırır
- Z-index management kompleks ola bilər, diqqətli planlaşdırma lazımdır
