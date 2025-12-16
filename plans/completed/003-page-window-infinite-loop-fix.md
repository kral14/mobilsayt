---
id: 003
title: Page Window Infinite Loop Bug Fix
status: new
priority: critical
created: 2025-12-16
updated: 2025-12-16
assignee: AI Agent
tags: [bug, critical, window, infinite-loop, musteriler]
dependencies: [001]
---

# Page Window Infinite Loop Bug Fix

## 📊 Status Xülasəsi

- **Ümumi tərəqqi:** 100%
- **Tamamlanmış:** 6/6 task
- **Problemlər:** Həll edildi ✅
- **Status:** Tamamlandı

## 🎯 Məqsəd

"Müştərilər → Alıcılar" səhifəsini açanda pəncərə açılmır və console-da sonsuz dövrə baş verir. Bu bug-ı həll etmək və səhifənin düzgün açılmasını təmin etmək.

## 🐛 Problem Təsviri

**Simptomlar:**
- Navbar-dan "Müştərilər → Alıcılar" klikləndikdə pəncərə açılmır
- Console-da sonsuz log mesajları:
  ```
  windowStore.ts:808 [windowStore] Opening page window: 
  {pageId: 'musteriler-alici', id: 'page-musteriler-alici-4', newCounter: 4, windowCounter: 3}
  ```
- `windowCounter` artır amma pəncərə render olunmur
- Browser donur və ya yavaşlayır

**Təsir:**
- 🔴 Kritik - İstifadəçilər Alıcılar səhifəsinə daxil ola bilmir
- 🔴 Performance problemi - Sonsuz dövrə CPU istifadəsini artırır
- 🔴 UX problemi - Aplikasiya istifadə olunmaz hala düşür

## 🔍 Səbəb Tapıldı

**Kök Səbəb:** `Alicilar.tsx` komponenti `<Layout>` wrapper-i ilə render olunurdu.

**Sonsuz Dövrə Axını:**
```
1. Layout navbar-ı render edir
2. Navbar-da "Alıcılar" button-u var
3. Button klikləndikdə openPageWindow çağırılır
4. openPageWindow <Alicilar /> komponenti yaradır
5. Alicilar komponenti <Layout> render edir
6. Yenidən 1-ci addıma qayıdır → SONSUZ DÖVRƏ ♾️
```

**Problem:** Page window komponentləri artıq `Layout` içərisində (workspace-də) render olunur. Onların özlərində `<Layout>` olmamalıdır!

## ✅ Həll Yolu

**Fix:** `Alicilar.tsx`-dən `<Layout>` wrapper-ini sildik.

**Dəyişikliklər:**
1. `import Layout from '../../components/Layout'` - SİLİNDİ
2. `<Layout>` və `</Layout>` tag-ları - SİLİNDİ
3. Komponent birbaşa content return edir

## 📋 Tamamlanmış Tapşırıqlar

### 1️⃣ Problem Araşdırması
- [x] `Alicilar.tsx` komponentini yoxladıq
- [x] Console log-larını analiz etdik
- [x] Sonsuz dövrə səbəbini tapdıq

### 2️⃣ Səbəbi Müəyyənləşdirmə
- [x] Layout wrapper sonsuz dövrəyə səbəb olur
- [x] `windowStore.ts:808` hər render-də çağırılır
- [x] Component lifecycle problemi müəyyən edildi

### 3️⃣ Fix İmplementasiyası
- [x] Sonsuz dövrə dayandırıldı
- [x] Layout import və wrapper silindi
- [x] Komponent düzgün strukturlaşdırıldı

### 4️⃣ Testing
- [x] "Müştərilər → Alıcılar" klikləyib pəncərə açılır ✅
- [x] Console-da sonsuz log yoxdur ✅
- [x] Pəncərə düzgün render olunur ✅
- [x] Digər səhifələr təsirlənməyib ✅

### 5️⃣ Prevention
- [x] Digər page komponentlərini yoxladıq
- [x] Hamısı düzgün strukturlaşdırılıb (Layout-sız)

### 6️⃣ Documentation
- [x] Bug səbəbi dokumentləşdirildi
- [x] Fix izah edildi
- [x] Plan yeniləndi

## 🔗 Əlaqəli Fayllar

- [Alicilar.tsx](../web/src/pages/Musteriler/Alici.tsx) - Problem komponenti
- [Layout.tsx](../web/src/components/Layout.tsx#L349) - handleOpenPage çağırılır
- [windowStore.ts](../web/src/store/windowStore.ts#L771-835) - openPageWindow funksiyası
- [UniversalWindow.tsx](../web/src/components/UniversalWindow.tsx) - Window render

## 🔗 Əlaqəli Planlar

- Plan 001: [MDI Window System](001-mdi-window-system.md) - Window management infrastrukturu

## 📝 Araşdırma Qeydləri

### Console Log Analizi
```
[windowStore] Opening page window: 
{
  pageId: 'musteriler-alici', 
  id: 'page-musteriler-alici-4', 
  newCounter: 4, 
  windowCounter: 3
}
```

**Müşahidələr:**
- `newCounter` artır (4, 5, 6...)
- `windowCounter` state-də artır (3, 4, 5...)
- Amma window render olunmur
- Log sonsuz təkrarlanır

**Hipotez:**
`Alicilar` komponenti render olunanda bir şey `openPageWindow`-u yenidən çağırır.

### Debugging Addımları

1. **`Alicilar.tsx`-ə console.log əlavə et:**
   ```tsx
   console.log('[Alicilar] Component rendered', { timestamp: Date.now() })
   ```

2. **`useEffect` hook-larını yoxla:**
   ```tsx
   useEffect(() => {
     console.log('[Alicilar] useEffect triggered', { deps: [...] })
   }, [deps])
   ```

3. **`openPageWindow` çağırılma yerini tap:**
   ```tsx
   // Layout.tsx:349
   onClick={() => handleOpenPage('musteriler-alici', 'Alıcılar', '👥', Alicilar)}
   ```

4. **Window content render-i yoxla:**
   ```tsx
   // windowStore.ts:814
   content: <Component />
   ```

## 💡 Potensial Həll Yolları

### Həll 1: useEffect Dependency Fix
```tsx
// Əgər problem useEffect-dədirsə
useEffect(() => {
  // Some logic
}, []) // Empty dependency array
```

### Həll 2: Ref İstifadəsi
```tsx
// Əgər state update loop-dursa
const isInitialized = useRef(false)

useEffect(() => {
  if (isInitialized.current) return
  isInitialized.current = true
  // Logic
}, [])
```

### Həll 3: Window Content Memoization
```tsx
// windowStore.ts
const content = useMemo(() => <Component />, [])
```

### Həll 4: Component Lazy Loading
```tsx
// Layout.tsx
const Alicilar = lazy(() => import('../pages/Musteriler/Alici'))
```

## ⚠️ Riskler

- **Data itkisi:** Fix zamanı mövcud data itə bilər
- **Digər səhifələr:** Fix digər page window-ları təsir edə bilər
- **Performance:** Fix performance-ı pisləşdirə bilər

## 🎯 Uğur Meyarları

- [ ] "Müştərilər → Alıcılar" klikləndikdə pəncərə dərhal açılır
- [ ] Console-da sonsuz log yoxdur
- [ ] Pəncərə düzgün render olunur və istifadə oluna bilir
- [ ] Digər səhifələr (Satıcılar, Hesablar və s.) normal işləyir
- [ ] Performance problemi yoxdur
- [ ] Browser donmur

## 📊 Prioritet

**Kritik** - Bu bug istifadəçilərin əsas funksionallığa (Müştəri idarəetməsi) daxil olmasına mane olur.

## 🕐 Təxmini Vaxt

- Araşdırma: 30 dəqiqə
- Fix: 1 saat
- Testing: 30 dəqiqə
- **Cəmi:** ~2 saat
