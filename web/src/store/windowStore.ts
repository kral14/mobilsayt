import { create } from 'zustand'
import React from 'react'

// Helper funksiyalar (köhnə kodlarla uyğunluq üçün)
export const getLayoutConstraints = () => {
  const navbar = document.querySelector('nav')
  const navbarHeight = navbar ? navbar.offsetHeight : 60
  const taskbarHeight = 50

  return {
    navbarHeight,
    taskbarHeight,
    minY: navbarHeight,
    maxY: window.innerHeight - taskbarHeight,
    minX: 0,
    maxX: window.innerWidth,
    availableHeight: window.innerHeight - navbarHeight - taskbarHeight,
    availableWidth: window.innerWidth
  }
}

export const calculateCenteredPosition = (width: number, height: number) => {
  const constraints = getLayoutConstraints()

  return {
    x: Math.floor((constraints.availableWidth - width) / 2),
    y: Math.floor(constraints.navbarHeight + (constraints.availableHeight - height) / 2)
  }
}

export interface WindowData {
  id: string
  title: string
  content: React.ReactNode
  type: string
  pageId?: string  // Səhifə ID-si (universal windows üçün)
  icon?: string    // Pəncərə ikonu
  position: { x: number; y: number }
  size: { width: number; height: number }
  isMinimized: boolean
  isMaximized: boolean
  normalState: { position: { x: number; y: number }; size: { width: number; height: number } } | null
  zIndex: number
  isVisible?: boolean
  modalType?: string // Köhnə kodlarla uyğunluq üçün
  onRestore?: () => void // Pəncərə bərpa edildikdə
  snapDirection?: SnapDirection // Track snap state
  onClose?: () => void
  onActivate?: () => void
}

interface DragData {
  id: string
  startX: number
  startY: number
  initialLeft: number
  initialTop: number
}

interface ResizeData {
  id: string
  startX: number
  startY: number
  initialWidth: number
  initialHeight: number
  initialLeft: number
  initialTop: number
  direction: string
}

export type SnapDirection = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface SnapAssistState {
  isActive: boolean
  triggerWindowId: string // The window that was just snapped
  targetRect: { x: number; y: number; width: number; height: number } // Area available for the second window
  direction: SnapDirection // Direction for the second window
}

interface WindowStore {
  windows: Map<string, WindowData>
  activeWindowId: string | null
  windowCounter: number
  zIndexCounter: number
  dragData: DragData | null
  resizeData: ResizeData | null
  snapAssist: SnapAssistState | null

  // Pəncərə əməliyyatları
  createWindow: (type: string, content: React.ReactNode, icon?: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  activateWindow: (id: string) => void
  snapWindow: (id: string, direction: SnapDirection) => void
  closeSnapAssist: () => void

  // Page window əməliyyatları
  openPageWindow: (pageId: string, title: string, icon: string, content: React.ReactNode, size?: { width: number; height: number }) => void
  isPageOpen: (pageId: string) => boolean
  focusPage: (pageId: string) => void

  // Köhnə metodlar (uyğunluq üçün)
  addWindow: (window: Partial<WindowData>) => void
  removeWindow: (id: string) => void
  updateWindow: (id: string, data: Partial<WindowData>) => void

  // Drag və resize
  startDrag: (id: string, e: React.MouseEvent) => void
  drag: (e: MouseEvent) => void
  stopDrag: () => void
  startResize: (id: string, e: React.MouseEvent, direction: string) => void
  resize: (e: MouseEvent) => void
  stopResize: () => void
  handleScreenResize: () => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: new Map(),
  activeWindowId: null,
  windowCounter: 0,
  zIndexCounter: 100,
  dragData: null,
  resizeData: null,
  snapAssist: null,

  // Yeni pəncərə yarat
  createWindow: (type: string, content: React.ReactNode) => {
    const state = get()
    const id = `window-${state.windowCounter + 1}`
    const newCounter = state.windowCounter + 1
    const newZIndex = state.zIndexCounter + 1

    const newWindow: WindowData = {
      id,
      title: `${type} #${newCounter}`,
      content,
      type,
      position: { x: 50 + (newCounter * 30), y: 50 + (newCounter * 30) },
      size: { width: 500, height: 400 },
      isMinimized: false,
      isMaximized: false,
      normalState: null,
      zIndex: newZIndex
    }

    const newWindows = new Map(state.windows)
    newWindows.set(id, newWindow)

    set({
      windows: newWindows,
      activeWindowId: id,
      windowCounter: newCounter,
      zIndexCounter: newZIndex
    })
  },

  // Pəncərəni bağla
  closeWindow: (id: string) => {
    const state = get()
    const newWindows = new Map(state.windows)
    newWindows.delete(id)

    set({
      windows: newWindows,
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId
    })
  },

  // Pəncərəni minimize et
  minimizeWindow: (id: string) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, isMinimized: true })

    set({ windows: newWindows })
  },

  // Pəncərəni restore et
  restoreWindow: (id: string) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const newZIndex = state.zIndexCounter + 1
    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, isMinimized: false, zIndex: newZIndex })

    set({
      windows: newWindows,
      activeWindowId: id,
      zIndexCounter: newZIndex
    })
  },

  // Pəncərəni maximize et
  maximizeWindow: (id: string) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const newWindows = new Map(state.windows)

    if (!window.isMaximized) {
      // Maximize et
      newWindows.set(id, {
        ...window,
        normalState: {
          position: window.position,
          size: window.size
        },
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 }, // CSS-də 100% olacaq
        isMaximized: true
      })
    } else {
      // Restore et
      if (window.normalState) {
        newWindows.set(id, {
          ...window,
          position: window.normalState.position,
          size: window.normalState.size,
          isMaximized: false,
          normalState: null
        })
      }
    }

    set({ windows: newWindows })
  },

  // Pəncərəni aktiv et
  activateWindow: (id: string) => {
    const state = get()
    if (state.activeWindowId === id) return

    const window = state.windows.get(id)
    if (!window) return

    const newZIndex = state.zIndexCounter + 1
    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, zIndex: newZIndex })

    set({
      windows: newWindows,
      activeWindowId: id,
      zIndexCounter: newZIndex
    })
  },

  // Drag başlat
  startDrag: (id: string, e: React.MouseEvent) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window || window.isMaximized) return

    // Pəncərəni aktiv et
    get().activateWindow(id)

    set({
      dragData: {
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialLeft: window.position.x,
        initialTop: window.position.y
      }
    })

    // Event listeners əlavə et
    document.addEventListener('mousemove', get().drag)
    document.addEventListener('mouseup', get().stopDrag)
  },

  // Drag
  drag: (e: MouseEvent) => {
    const state = get()
    if (!state.dragData) return

    const dx = e.clientX - state.dragData.startX
    const dy = e.clientY - state.dragData.startY

    const window = state.windows.get(state.dragData.id)
    if (!window) return

    const workspace = document.getElementById('workspace')
    if (!workspace) return

    const newLeft = state.dragData.initialLeft + dx
    const newTop = state.dragData.initialTop + dy

    // Workspace sərhədləri daxilində saxla
    const maxLeft = workspace.clientWidth - window.size.width
    const maxTop = workspace.clientHeight - window.size.height

    let finalLeft = Math.max(0, Math.min(newLeft, maxLeft))
    let finalTop = Math.max(0, Math.min(newTop, maxTop))

    // MAGNETISM LOGIC (20px threshold)
    const MAGNET_THRESHOLD = 20

    // Top Magnetism
    if (Math.abs(finalTop) < MAGNET_THRESHOLD) {
      finalTop = 0
    }

    // Bottom Magnetism
    if (Math.abs(finalTop + window.size.height - workspace.clientHeight) < MAGNET_THRESHOLD) {
      finalTop = workspace.clientHeight - window.size.height
    }

    // Left Magnetism
    if (Math.abs(finalLeft) < MAGNET_THRESHOLD) {
      finalLeft = 0
    }

    // Right Magnetism
    if (Math.abs(finalLeft + window.size.width - workspace.clientWidth) < MAGNET_THRESHOLD) {
      finalLeft = workspace.clientWidth - window.size.width
    }

    const newWindows = new Map(state.windows)
    newWindows.set(state.dragData.id, {
      ...window,
      position: { x: finalLeft, y: finalTop },
      snapDirection: undefined // Clear snap on drag
    })

    set({ windows: newWindows })
  },

  // Drag dayandır
  stopDrag: () => {
    document.removeEventListener('mousemove', get().drag)
    document.removeEventListener('mouseup', get().stopDrag)
    set({ dragData: null })
  },

  // Resize başlat
  startResize: (id: string, e: React.MouseEvent, direction: string) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window || window.isMaximized) return

    // Pəncərəni aktiv et
    get().activateWindow(id)

    set({
      resizeData: {
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialWidth: window.size.width,
        initialHeight: window.size.height,
        initialLeft: window.position.x,
        initialTop: window.position.y,
        direction
      }
    })

    // Event listeners əlavə et
    document.addEventListener('mousemove', get().resize)
    document.addEventListener('mouseup', get().stopResize)
  },

  // Resize
  resize: (e: MouseEvent) => {
    const state = get()
    if (!state.resizeData) return

    const dx = e.clientX - state.resizeData.startX
    const dy = e.clientY - state.resizeData.startY

    const window = state.windows.get(state.resizeData.id)
    if (!window) return

    let newWidth = state.resizeData.initialWidth
    let newHeight = state.resizeData.initialHeight
    let newX = state.resizeData.initialLeft
    let newY = state.resizeData.initialTop
    const direction = state.resizeData.direction

    // Horizontal resize
    if (direction.includes('e')) {
      newWidth = Math.max(300, state.resizeData.initialWidth + dx)
    } else if (direction.includes('w')) {
      newWidth = Math.max(300, state.resizeData.initialWidth - dx)
      newX = state.resizeData.initialLeft + (state.resizeData.initialWidth - newWidth)
    }

    // Vertical resize
    if (direction.includes('s')) {
      newHeight = Math.max(200, state.resizeData.initialHeight + dy)

      // Bottom Magnetism (Resize)
      const workspace = document.getElementById('workspace')
      if (workspace && Math.abs(newY + newHeight - workspace.clientHeight) < 20) {
        newHeight = workspace.clientHeight - newY
      }

    } else if (direction.includes('n')) {
      newHeight = Math.max(200, state.resizeData.initialHeight - dy)
      newY = state.resizeData.initialTop + (state.resizeData.initialHeight - newHeight)

      // Top Magnetism (Resize)
      if (Math.abs(newY) < 20) {
        const diff = newY // Distance to top (0)
        newY = 0
        newHeight = newHeight + diff
      }
    }

    const newWindows = new Map(state.windows)
    newWindows.set(state.resizeData.id, {
      ...window,
      size: { width: newWidth, height: newHeight },
      position: { x: newX, y: newY },
      snapDirection: undefined // Clear snap on resize
    })

    set({ windows: newWindows })
  },

  stopResize: () => {
    document.removeEventListener('mousemove', get().resize)
    document.removeEventListener('mouseup', get().stopResize)
    set({ resizeData: null })
  },

  // Snap Window Logic
  snapWindow: (id: string, direction: SnapDirection) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const constraints = getLayoutConstraints()
    const { availableWidth, availableHeight } = constraints

    let x = 0
    let y = 0
    let width = availableWidth
    let height = availableHeight

    // Calculate Snap Rect
    if (direction === 'left') {
      width = availableWidth / 2
    } else if (direction === 'right') {
      x = availableWidth / 2
      width = availableWidth / 2
    } else if (direction === 'top-left') {
      width = availableWidth / 2
      height = availableHeight / 2
    } else if (direction === 'top-right') {
      x = availableWidth / 2
      width = availableWidth / 2
      height = availableHeight / 2
    } else if (direction === 'bottom-left') {
      y = availableHeight / 2
      width = availableWidth / 2
      height = availableHeight / 2
    } else if (direction === 'bottom-right') {
      x = availableWidth / 2
      y = availableHeight / 2
      width = availableWidth / 2
      height = availableHeight / 2
    }

    // Apply snap to current window
    const newWindows = new Map(state.windows)
    newWindows.set(id, {
      ...window,
      position: { x, y },
      size: { width, height },
      isMaximized: false, // Semi-maximized state
      normalState: window.normalState || { position: window.position, size: window.size },
      snapDirection: direction // Save snap direction
    })

    // Determine Snap Assist Target Rect (Opposite side)
    let assistRect = null
    let assistDirection: SnapDirection | null = null

    if (direction === 'left') {
      assistRect = { x: availableWidth / 2, y: 0, width: availableWidth / 2, height: availableHeight }
      assistDirection = 'right'
    } else if (direction === 'right') {
      assistRect = { x: 0, y: 0, width: availableWidth / 2, height: availableHeight }
      assistDirection = 'left'
    }
    // For corners, maybe assist isn't automatic or logic is complex. 
    // Implementing simpler assist for Left/Right first as per request

    set({
      windows: newWindows,
      activeWindowId: id,
      snapAssist: assistRect && assistDirection ? {
        isActive: true,
        triggerWindowId: id,
        targetRect: assistRect,
        direction: assistDirection
      } : null
    })
  },

  closeSnapAssist: () => {
    set({ snapAssist: null })
  },

  handleScreenResize: () => {
    const state = get()
    const workspace = document.getElementById('workspace')
    if (!workspace) return

    const { clientWidth, clientHeight } = workspace
    const newWindows = new Map(state.windows)
    let hasChanges = false


    newWindows.forEach((window, id) => {
      // 1. If Maximized, update size (already handled by CSS usually, but explicit check good)
      if (window.isMaximized) return

      // 2. If Snapped, re-calculate based on new dimensions
      if (window.snapDirection) {
        // Note: getLayoutConstraints uses window.innerWidth, but we can rely on workspace dims too. 
        // Let's use clean math based on workspace client dimensions from checking explicitly.

        let x = 0
        let y = 0
        let width = clientWidth
        let height = clientHeight
        const direction = window.snapDirection

        if (direction === 'left') {
          width = clientWidth / 2
        } else if (direction === 'right') {
          x = clientWidth / 2
          width = clientWidth / 2
        } else if (direction === 'top-left') {
          width = clientWidth / 2
          height = clientHeight / 2
        } else if (direction === 'top-right') {
          x = clientWidth / 2
          width = clientWidth / 2
          height = clientHeight / 2
        } else if (direction === 'bottom-left') {
          y = clientHeight / 2
          width = clientWidth / 2
          height = clientHeight / 2
        } else if (direction === 'bottom-right') {
          x = clientWidth / 2
          y = clientHeight / 2
          width = clientWidth / 2
          height = clientHeight / 2
        }

        newWindows.set(id, {
          ...window,
          position: { x, y },
          size: { width, height }
        })
        hasChanges = true
        return
      }

      let { x, y } = window.position
      let { width, height } = window.size
      let changed = false

      // Keep within bounds
      if (x + width > clientWidth) {
        if (width > clientWidth) width = clientWidth
        x = Math.max(0, clientWidth - width)
        changed = true
      }

      if (y + height > clientHeight) {
        if (height > clientHeight) height = clientHeight
        y = Math.max(0, clientHeight - height)
        changed = true
      }

      if (changed) {
        newWindows.set(id, {
          ...window,
          position: { x, y },
          size: { width, height }
        })
        hasChanges = true
      }
    })

    if (hasChanges) {
      set({ windows: newWindows })
    }
  },

  // Page window əməliyyatları
  openPageWindow: (pageId: string, title: string, icon: string, content: React.ReactNode, size = { width: 900, height: 600 }) => {
    const state = get()

    // Əgər artıq açıqdırsa, fokus ver
    // Əgər artıq açıqdırsa, fokus ver (BU HİSSƏNİ SİLİRİK Kİ ÇOXLU PƏNCƏRƏ AÇILSIN)
    // if (get().isPageOpen(pageId)) {
    //   get().focusPage(pageId)
    //   return
    // }

    const newCounter = state.windowCounter + 1
    // Unique ID for multiple instances: page-{pageId}-{counter}
    const id = `page-${pageId}-${newCounter}`
    const newZIndex = state.zIndexCounter + 1

    // Mərkəzi pozisiya hesabla + offset
    const centered = calculateCenteredPosition(size.width, size.height)
    const offset = (newCounter % 10) * 30 // Cascade effect
    let position = { x: centered.x + offset, y: centered.y + offset }

    // Load saved preferences
    let initialSize = size
    let initialIsMaximized = false

    try {
      const stored = localStorage.getItem(`window-pref-${pageId}`)
      if (stored) {
        const prefs = JSON.parse(stored)
        if (prefs.size) initialSize = prefs.size
        if (prefs.isMaximized) initialIsMaximized = prefs.isMaximized
        // Saved position logic could be added here if desired, but centering is usually safer for new sessions
      }
    } catch (e) {
      console.error('Failed to load window preferences:', e)
    }

    console.log('[windowStore] Opening page window:', { pageId, id, newCounter, windowCounter: state.windowCounter })

    const newWindow: WindowData = {
      id,
      title,
      content,
      type: 'page',
      pageId,
      icon,
      position,
      size: initialSize,
      isMinimized: false,
      isMaximized: initialIsMaximized,
      normalState: null,
      zIndex: newZIndex
    }

    const newWindows = new Map(state.windows)
    newWindows.set(id, newWindow)

    set({
      windows: newWindows,
      activeWindowId: id,
      windowCounter: newCounter,
      zIndexCounter: newZIndex
    })
  },

  isPageOpen: (pageId: string) => {
    const state = get()
    return Array.from(state.windows.values()).some(w => w.pageId === pageId)
  },

  focusPage: (pageId: string) => {
    const state = get()
    const window = Array.from(state.windows.values()).find(w => w.pageId === pageId)
    if (window) {
      get().activateWindow(window.id)
      // Əgər minimize edilmişdirsə, restore et
      if (window.isMinimized) {
        get().restoreWindow(window.id)
      }
    }
  },

  // Köhnə metodlar implementasiyası
  addWindow: (windowData: Partial<WindowData>) => {
    const state = get()

    // ID yoxdursa generate et
    const id = windowData.id || `window-${state.windowCounter + 1}`

    if (state.windows.has(id)) {
      get().updateWindow(id, windowData)
      get().activateWindow(id)
      return
    }

    const newCounter = state.windowCounter + 1
    const newZIndex = state.zIndexCounter + 1

    const newWindow: WindowData = {
      id,
      title: windowData.title || 'Adsız Pəncərə',
      content: windowData.content || null,
      type: windowData.type || 'modal',
      position: windowData.position || { x: 50 + (newCounter * 20), y: 50 + (newCounter * 20) },
      size: windowData.size || { width: 500, height: 400 },
      isMinimized: windowData.isMinimized || false,
      isMaximized: windowData.isMaximized || false,
      isVisible: windowData.isVisible !== undefined ? windowData.isVisible : true,
      normalState: null,
      zIndex: newZIndex,
      ...windowData
    } as WindowData

    const newWindows = new Map(state.windows)
    newWindows.set(id, newWindow)

    set({
      windows: newWindows,
      activeWindowId: id,
      windowCounter: newCounter,
      zIndexCounter: newZIndex
    })
  },

  removeWindow: (id: string) => {
    get().closeWindow(id)
  },

  updateWindow: (id: string, data: Partial<WindowData>) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, ...data })

    set({ windows: newWindows })
  }
}))
