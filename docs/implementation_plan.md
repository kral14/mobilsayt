# Universal Component System

## Məqsəd

Universal komponent sistemi yaratmaq - hər pəncərədə avtomatik olaraq düzgün yerləşən toolbar, table və footer komponentləri.

## Arxitektura

### 1. UniversalWindow (Container)
Pəncərənin əsas strukturu - children-ləri avtomatik yerləşdirir.

**Props:**
- `children`: React.ReactNode
- `padding?`: string (default: '0')

**Layout:**
```
┌─────────────────────────────┐
│   UniversalWindow           │
│  ┌─────────────────────────┐│
│  │  Toolbar (sticky top)   ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  Table (flex: 1)        ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │  Footer (sticky bottom) ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 2. UniversalToolbar (Mövcud)
Artıq var - `UniversalNavbar.tsx`

**Təkmilləşdirmələr:**
- Avtomatik sticky positioning
- Consistent styling
- Icon standardizasiyası

### 3. UniversalTable (DataTable-dan törəmə)
Mövcud DataTable-ı sadələşdirmək və universal etmək.

**Props:**
- `data`: T[]
- `columns`: ColumnConfig[]
- `loading?`: boolean
- `onRowSelect?`: (ids: (number|string)[]) => void
- `onRowClick?`: (row: T) => void
- `selectable?`: boolean (default: true)
- `sortable?`: boolean (default: true)

**Xüsusiyyətlər:**
- Daxili toolbar YOX (toolbar ayrıca komponent)
- Yalnız cədvəl funksionallığı
- Auto scroll
- Column resize, reorder
- Row selection

### 4. UniversalFooter (Yeni)
Statistika və pagination.

**Props:**
- `totalRecords?`: number
- `selectedCount?`: number
- `customContent?`: React.ReactNode

## Təklif olunan dəyişikliklər

### [NEW] [UniversalWindow.tsx](file:///c:/Users/nesib/Desktop/mobilsayt/web/src/components/UniversalWindow.tsx)

Yeni universal pəncərə container komponenti.

```tsx
interface UniversalWindowProps {
  children: React.ReactNode
  padding?: string
}

export default function UniversalWindow({ 
  children, 
  padding = '0' 
}: UniversalWindowProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      padding,
      overflow: 'hidden'
    }}>
      {children}
    </div>
  )
}
```

---

### [NEW] [UniversalTable.tsx](file:///c:/Users/nesib/Desktop/mobilsayt/web/src/components/UniversalTable.tsx)

DataTable-dan sadələşdirilmiş versiya - yalnız cədvəl, toolbar yoxdur.

**Əsas fərqlər:**
- Toolbar render etmir
- Daha sadə props interface
- Avtomatik flex: 1 layout
- Scroll container

---

### [NEW] [UniversalFooter.tsx](file:///c:/Users/nesib/Desktop/mobilsayt/web/src/components/UniversalFooter.tsx)

Footer komponenti - statistika və əlavə məlumat.

```tsx
interface UniversalFooterProps {
  totalRecords?: number
  selectedCount?: number
  customContent?: React.ReactNode
}
```

---

### [MODIFY] [UniversalNavbar.tsx](file:///c:/Users/nesib/Desktop/mobilsayt/web/src/components/UniversalNavbar.tsx)

Mövcud toolbar-ı təkmilləşdirmək:
- Sticky positioning əlavə et
- Consistent background color
- Z-index düzəlt

---

### [MODIFY] [PartnerManager.tsx](file:///c:/Users/nesib/Desktop/mobilsayt/web/src/components/PartnerManager.tsx)

Yeni universal komponentlərdən istifadə edərək refactor et:

```tsx
<UniversalWindow padding="2rem">
  <UniversalNavbar
    onEdit={handleEdit}
    onDelete={handleDelete}
    onRefresh={loadCustomers}
  />
  <UniversalTable
    data={filteredCustomers}
    columns={columns}
    loading={loading}
    onRowSelect={setSelectedIds}
  />
  <UniversalFooter
    totalRecords={customers.length}
    selectedCount={selectedIds.length}
  />
</UniversalWindow>
```

## İstifadə nümunəsi

```tsx
// Hər hansı bir səhifə
function MyPage() {
  return (
    <UniversalWindow>
      <UniversalNavbar 
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <UniversalTable 
        data={myData}
        columns={myColumns}
      />
      <UniversalFooter 
        totalRecords={100}
        selectedCount={5}
      />
    </UniversalWindow>
  )
}
```

## Üstünlüklər

✅ **Konsistent Layout** - Hər pəncərədə eyni struktur
✅ **Avtomatik Positioning** - Komponentlər öz yerlərini tutur
✅ **Reusable** - Bir dəfə yaz, hər yerdə istifadə et
✅ **Maintainable** - Dəyişiklik bir yerdə edilir
✅ **Flexible** - İstənilən kombinasiya mümkündür


## Completed Work (Session Export)

### 1. Core Components
- **UniversalContainer**: 
  - Flexbox layout implementation with dynamic padding support.
  - Initial padding set to prevent content from hitting edges.
  - **Debug Mode**: Added temporary debug borders (Red) to visualize layout logic.
- **UniversalNavbar**:
  - Implemented sticky positioning (top: 0).
  - Compact height reduced to 40px for better vertical space usage.
  - **Toolbar Actions**: Full integration of Add, Edit, Delete, Copy, Print, Refresh, Settings, Search, and Filter actions.
  - **Debug Mode**: Added temporary debug borders (Green).
- **UniversalTable**:
  - Simplified table structure without built-in toolbar.
  - **Interaction Logic**:
    - `Ctrl+A`: Select all rows handler added.
    - `Ctrl+Click`: Toggle row selection logic.
    - `Single Click`: Select row AND enable cell text selection (userSelect: 'text') for easy copying.
    - `Double Click`: Open document/edit mode detected via 300ms threshold.
  - **Debug Mode**: Added temporary debug borders (Blue).
- **UniversalFooter**:
  - Sticky positioning at bottom.
  - Statistics display (Total records, Selected count).
  - **Debug Mode**: Added temporary debug borders (Orange).

### 2. Layout & UI Adjustments
- **Global Layout (CSS)**:
  - `Navbar` height reduced to 40px.
  - `Taskbar` height reduced to 30px.
  - `Window Header` height reduced to ~20px (padding: 2px 15px).
  - `Workspace` top/bottom margins adjusted (top: 50px, bottom: 40px) to match new heights.
- **Visuals**:
  - Added horizontal padding (15px) and vertical padding (5px) to `UniversalContainer` for breathable layout.
  - Blocked browser context menu in `UniversalWindow` for native app-like feel.

### 3. Feature Integrations
- **PartnerManager Refactor**:
  - Fully migrated to use Universal Component System.
  - **Partner Logic**:
    - Automatic code generation for new partners implemented.
    - Code prefixes: `AL` for Buyers, `SAT` for Suppliers.
    - Dynamic type selector in modal.
- **Table Settings**:
  - Created `TableSettingsModal.tsx`.
  - Implemented functionality to toggle column visibility and adjust widths.
  - Integrated settings button in toolbar to open this modal.
