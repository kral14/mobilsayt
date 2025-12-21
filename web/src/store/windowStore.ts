import { create } from 'zustand'
import React from 'react'
import { logActivity } from './logStore'

// Helper funksiyalar (köhnə kodlarla uyğunluq üçün)
export const getLayoutConstraints = () => {
  const navbar = document.querySelector('nav')
  const navbarHeight = navbar ? navbar.offsetHeight : 60
  // TASKBAR_HEIGHT Layout-dan import edilə bilməz (circular dependency), ona görə burada sabit
  const taskbarHeight = 25

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
  isPinned?: boolean // Pəncərə bərkidilib?
  normalState: { position: { x: number; y: number }; size: { width: number; height: number } } | null
  zIndex: number
  isVisible?: boolean
  modalType?: string // Köhnə kodlarla uyğunluq üçün
  onRestore?: () => void // Pəncərə bərpa edildikdə
  snapDirection?: SnapDirection // Track snap state
  onClose?: () => void
  onBeforeClose?: () => boolean // Bağlanmadan əvvəl yoxlama (true = bağla, false = ləğv et)
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
  togglePinWindow: (id: string) => void // Pəncərəni bərkit/aç
  closeSnapAssist: () => void

  // Page window əməliyyatları
  openPageWindow: (pageId: string, title: string, icon: string, content: React.ReactNode, size?: { width: number; height: number }) => void
  isPageOpen: (pageId: string) => boolean
  closePageWindow: (pageId: string) => void // Close all windows with this pageId
  focusPage: (pageId: string) => void
  focusMainContent: () => number // Yeni metod: Main content-i önə gətirir

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

let dragRafId: number | null = null

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
      isPinned: false,
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
    const window = state.windows.get(id)

    // Əgər bərkidilibsə bağlama
    if (window?.isPinned) {
      return
    }

    // onBeforeClose yoxlaması
    if (window?.onBeforeClose) {
      console.log(`[DEBUG] closeWindow: check onBeforeClose for ${id}`)
      const shouldClose = window.onBeforeClose()
      console.log(`[DEBUG] closeWindow: onBeforeClose result for ${id}: ${shouldClose}`)
      if (!shouldClose) {
        console.log(`[DEBUG] closeWindow: aborting close for ${id}`)
        return
      }
    } else {
      console.log(`[DEBUG] closeWindow: NO onBeforeClose handler for ${id}`)
    }

    const newWindows = new Map(state.windows)
    newWindows.delete(id)

    set({
      windows: newWindows,
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId
    })

    // onClose callback-i çağır (modal cleanup üçün)
    if (window?.onClose) {
      window.onClose()
    }
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

    console.log('[SIZE_CHANGE] maximizeWindow çağırıldı', {
      id,
      currentSize: window.size,
      currentPosition: window.position,
      isMaximized: window.isMaximized,
      normalState: window.normalState,
      stack: new Error().stack
    })

    const newWindows = new Map(state.windows)

    if (!window.isMaximized) {
      // Maximize et
      console.log('[SIZE_CHANGE] Maximize edilir', {
        id,
        oldSize: window.size,
        newSize: { width: 0, height: 0 },
        reason: 'maximize'
      })

      logActivity(
        'window',
        'Pəncərə maximize edildi',
        `Pəncərə "${window.title}" maksimum ölçüyə gətirildi`,
        'info',
        { windowId: id, title: window.title, action: 'maximize' }
      )

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
      const restorePosition = window.normalState?.position || window.position
      const restoreSize = window.normalState?.size || { width: 900, height: 700 }

      console.log('[SIZE_CHANGE] Restore edilir', {
        id,
        oldSize: window.size,
        newSize: restoreSize,
        reason: 'restore',
        normalState: window.normalState
      })

      logActivity(
        'window',
        'Pəncərə restore edildi',
        `Pəncərə "${window.title}" əvvəlki ölçüsünə qaytarıldı`,
        'info',
        { windowId: id, title: window.title, action: 'restore', size: restoreSize }
      )

      newWindows.set(id, {
        ...window,
        position: restorePosition,
        size: restoreSize,
        isMaximized: false,
        normalState: null
      })
    }

    set({ windows: newWindows })
  },

  // Pəncərəni bərkit/aç
  togglePinWindow: (id: string) => {
    const state = get()
    const window = state.windows.get(id)
    if (!window) return

    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, isPinned: !window.isPinned })

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

    // RAF throttle
    // RAF throttle
    if (dragRafId) {
      cancelAnimationFrame(dragRafId)
    }

    dragRafId = requestAnimationFrame(() => {
      set((prev) => {
        // Double check dragData exists inside RAF async
        if (!prev.dragData) return {}

        const newWindows = new Map(prev.windows)
        // Check window exists again
        const currentWindow = newWindows.get(state.dragData!.id)

        if (currentWindow) {
          newWindows.set(state.dragData!.id, {
            ...currentWindow,
            position: { x: finalLeft, y: finalTop },
            snapDirection: undefined // Clear snap on drag
          })
        }
        dragRafId = null
        return { windows: newWindows }
      })
    })
  },

  // Drag dayandır
  stopDrag: () => {
    if (dragRafId) {
      cancelAnimationFrame(dragRafId)
      dragRafId = null
    }
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

    const oldSize = { width: window.size.width, height: window.size.height }

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

    console.log('[SIZE_CHANGE] Resize tətbiq edilir', {
      id: state.resizeData.id,
      oldSize,
      newSize: { width: newWidth, height: newHeight },
      oldPosition: window.position,
      newPosition: { x: newX, y: newY },
      direction,
      dx,
      dy,
      reason: 'manual_resize'
    })

    // Performance optimization: Don't log on every resize event
    // logActivity(
    //   'window',
    //   'Pəncərə ölçüsü dəyişdirildi',
    //   `Pəncərə manual resize edildi (${direction})`,
    //   'info',
    //   {
    //     windowId: state.resizeData.id,
    //     direction,
    //     oldSize,
    //     newSize: { width: newWidth, height: newHeight },
    //     delta: { dx, dy }
    //   }
    // )

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

    console.log('[SIZE_CHANGE] snapWindow çağırıldı', {
      id,
      direction,
      currentSize: window.size,
      currentPosition: window.position,
      stack: new Error().stack
    })

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

    console.log('[SIZE_CHANGE] Snap tətbiq edilir', {
      id,
      direction,
      oldSize: window.size,
      newSize: { width, height },
      oldPosition: window.position,
      newPosition: { x, y },
      reason: 'snap'
    })

    logActivity(
      'window',
      `Pəncərə snap edildi: ${direction}`,
      `Pəncərə "${window.title}" ekranın ${direction} tərəfinə snap edildi`,
      'info',
      {
        windowId: id,
        title: window.title,
        direction,
        newSize: { width, height },
        newPosition: { x, y }
      }
    )

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
    console.log('[SIZE_CHANGE] handleScreenResize çağırıldı', {
      workspaceSize: { width: clientWidth, height: clientHeight },
      windowCount: state.windows.size,
      stack: new Error().stack
    })

    const newWindows = new Map(state.windows)
    let hasChanges = false


    newWindows.forEach((window, id) => {
      // 1. If Maximized, update size (already handled by CSS usually, but explicit check good)
      if (window.isMaximized) return

      // 2. If Snapped, re-calculate based on new dimensions
      if (window.snapDirection) {
        console.log('[SIZE_CHANGE] Snapped window yenidən hesablanır', {
          id,
          direction: window.snapDirection,
          oldSize: window.size,
          workspaceSize: { width: clientWidth, height: clientHeight }
        })

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

        console.log('[SIZE_CHANGE] Snap yenidən tətbiq edildi', {
          id,
          direction,
          newSize: { width, height },
          newPosition: { x, y },
          reason: 'screen_resize_snap'
        })

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
        console.log('[SIZE_CHANGE] Ekran ölçüsünə görə düzəliş', {
          id,
          oldSize: window.size,
          newSize: { width, height },
          oldPosition: window.position,
          newPosition: { x, y },
          reason: 'screen_resize_bounds_check'
        })

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

    // Load saved preferences first to check allowMultipleInstances
    let allowMultipleInstances = false // Default: yalnız 1 dəfə açıla bilər
    let initialSize = size
    let initialIsMaximized = false

    try {
      const stored = localStorage.getItem(`window-pref-${pageId}`)
      if (stored) {
        const prefs = JSON.parse(stored)
        if (prefs.allowMultipleInstances !== undefined) {
          allowMultipleInstances = prefs.allowMultipleInstances
        }
        if (prefs.size) initialSize = prefs.size
        if (prefs.isMaximized) initialIsMaximized = prefs.isMaximized
      }
    } catch (e) {
      console.error('Failed to load window preferences:', e)
    }

    // Əgər allowMultipleInstances false-dursa və artıq açıqdırsa, fokus ver
    if (!allowMultipleInstances && get().isPageOpen(pageId)) {
      get().focusPage(pageId)
      return
    }

    const newCounter = state.windowCounter + 1
    // Unique ID for multiple instances: page-{pageId}-{counter}
    const id = `page-${pageId}-${newCounter}`
    const newZIndex = state.zIndexCounter + 1

    // Constraint constants
    const NAVBAR_HEIGHT = 40
    const TASKBAR_HEIGHT = 25
    const FOOTER_HEIGHT = 25  // Global Footer height
    const BOTTOM_MARGIN = 40  // Increased safety margin to 40px to ensure it stays well above footer

    // Total space reserved at the bottom (Taskbar + Footer + Margin)
    const RESERVED_BOTTOM = TASKBAR_HEIGHT + FOOTER_HEIGHT + BOTTOM_MARGIN

    // 1. Height Constraint - Calculate max available height in workspace
    const maxAvailableHeight = window.innerHeight - NAVBAR_HEIGHT - RESERVED_BOTTOM

    if (initialSize.height > maxAvailableHeight) {
      console.log(`[windowStore] Reducing window height from ${initialSize.height} to ${maxAvailableHeight} to fit screen`)
      initialSize.height = maxAvailableHeight
    }

    // 2. Initial Position Calculation with Constraints
    const centered = calculateCenteredPosition(initialSize.width, initialSize.height)
    const offset = (newCounter % 10) * 30 // Cascade effect

    let y = centered.y + offset
    const x = centered.x + offset

    // 3. Vertical Position Constraint (Bottom Check)
    // Ensure the window bottom (y + height) does NOT exceed the reserved bottom limit
    const hardBottomLimit = window.innerHeight - RESERVED_BOTTOM

    if (y + initialSize.height > hardBottomLimit) {
      y = hardBottomLimit - initialSize.height

      // Safety check: if pushing it up hits the navbar, we must shrink the window
      if (y < NAVBAR_HEIGHT) {
        y = NAVBAR_HEIGHT
        initialSize.height = hardBottomLimit - NAVBAR_HEIGHT
      }
    }

    // 4. Vertical Position Constraint (Top Check - Navbar)
    if (y < NAVBAR_HEIGHT) {
      y = NAVBAR_HEIGHT
    }

    let position = { x, y }

    if (import.meta.env.MODE === 'development') {
      console.log('[windowStore] Opening page window:', { pageId, id, newCounter, position, size: initialSize })
    }

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

  // Close page window by pageId (closes all instances with this pageId)
  closePageWindow: (pageId: string) => {
    const state = get()
    const windowsToClose = Array.from(state.windows.values()).filter(w => w.pageId === pageId)

    if (windowsToClose.length === 0) {
      console.log(`[DEBUG] closePageWindow: No windows found for pageId: ${pageId}`)
      return
    }

    console.log(`[DEBUG] closePageWindow: Closing ${windowsToClose.length} window(s) for pageId: ${pageId}`)

    windowsToClose.forEach(window => {
      get().closeWindow(window.id)
    })
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

  focusMainContent: () => {
    const state = get()
    const newZIndex = state.zIndexCounter + 1
    set({
      zIndexCounter: newZIndex,
      activeWindowId: 'main-content'
    })
    return newZIndex
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
      isPinned: windowData.isPinned || false,
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

    // Size dəyişikliyi varsa log et
    if (data.size && (data.size.width !== window.size.width || data.size.height !== window.size.height)) {
      console.log('[SIZE_CHANGE] updateWindow - size dəyişikliyi', {
        id,
        oldSize: window.size,
        newSize: data.size,
        allUpdates: Object.keys(data),
        reason: 'updateWindow_call',
        stack: new Error().stack
      })
    }

    const newWindows = new Map(state.windows)
    newWindows.set(id, { ...window, ...data })

    set({ windows: newWindows })
  }
}))
