import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWindowStore } from '../store/windowStore'
import UniversalWindow from './UniversalWindow'
import SnapAssist from './SnapAssist'
import { useLogSync } from '../hooks/useLogSync'

// Səhifə komponentləri
import Hesablar from '../pages/Hesablar'
import Anbar from '../pages/Anbar'

import SatisQaimeleri from '../pages/Qaimeler/Satis'
import KassaMedaxil from '../pages/Kassa/Medaxil'
import KassaMexaric from '../pages/Kassa/Mexaric'
import Alicilar from '../pages/Musteriler/Alici'
import Saticilar from '../pages/Musteriler/Satici'
import Admin from '../pages/Admin'
import DiscountDocuments, { SupplierDiscountDocuments, ProductDiscountDocuments } from '../pages/Discounts/DiscountDocuments'



export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, customer, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const [mainContentZIndex, setMainContentZIndex] = useState(0)
  const { windows, activeWindowId, openPageWindow, restoreWindow, focusMainContent, togglePinWindow } = useWindowStore()

  // Activate log sync
  useLogSync()

  // Dropdown-ları bağla əgər nav-dan kənara kliklənərsə
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  // Screen Resize Listener with throttling
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    let lastResizeTime = 0
    const THROTTLE_MS = 250 // Throttle resize events to max once per 250ms

    const handleResize = () => {
      const now = Date.now()
      const timeSinceLastResize = now - lastResizeTime

      console.log('[RESIZE_EVENT] Window resize event triggered', {
        timeSinceLastResize,
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        stack: new Error().stack?.split('\n').slice(0, 5).join('\n')
      })

      // Clear any pending resize timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }

      // Throttle: only execute if enough time has passed
      if (timeSinceLastResize >= THROTTLE_MS) {
        lastResizeTime = now
        console.log('[RESIZE_EVENT] Executing handleScreenResize (immediate)')
        useWindowStore.getState().handleScreenResize()
      } else {
        // Schedule for later
        resizeTimeout = setTimeout(() => {
          lastResizeTime = Date.now()
          console.log('[RESIZE_EVENT] Executing handleScreenResize (throttled)')
          useWindowStore.getState().handleScreenResize()
          resizeTimeout = null
        }, THROTTLE_MS - timeSinceLastResize)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  }, [])

  // ESC düyməsi ilə bütün açıq pəncərələri bağla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC düyməsi basıldıqda
      if (e.key === 'Escape') {
        // Əgər input, textarea və ya contentEditable element aktivdirsə, ignore et
        const activeElement = document.activeElement as HTMLElement
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable ||
            activeElement.closest('input') ||
            activeElement.closest('textarea'))
        ) {
          return
        }

        // Aktiv və ya ən üstteki pəncərəni bağla
        const { windows, activeWindowId, closeWindow } = useWindowStore.getState()

        let targetId = activeWindowId

        // Əgər aktiv pəncərə yoxdursa, zIndex-i ən yüksək olanı tap
        if (!targetId && windows.size > 0) {
          const sorted = Array.from(windows.values())
            .filter(w => !w.isMinimized && w.isVisible !== false)
            .sort((a, b) => b.zIndex - a.zIndex)

          if (sorted.length > 0) {
            targetId = sorted[0].id
          }
        }

        if (targetId) {
          closeWindow(targetId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    // Bütün açıq pəncərələri bağla
    const { windows, closeWindow } = useWindowStore.getState()
    Array.from(windows.keys()).forEach(windowId => {
      closeWindow(windowId)
    })

    // Logout və login səhifəsinə yönləndir
    logout()
    navigate('/login')
  }

  const displayName = customer?.name || user?.email || 'İstifadəçi'

  // Səhifə pəncərəsi aç
  const handleOpenPage = (pageId: string, title: string, icon: string, Component: React.ComponentType) => {
    openPageWindow(pageId, title, icon, <Component />)
    setActiveDropdown(null)
  }

  const handleMainContentClick = () => {
    const newZ = focusMainContent()
    setMainContentZIndex(newZ)
  }

  return (
    <div>
      {/* NAVBAR */}
      <nav ref={navRef}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          📦 AnbarSmarte
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
          {isAuthenticated ? (
            <>
              {/* Qaimələr Dropdown */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveDropdown('qaimeler')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button>
                  Qaimələr <span style={{ fontSize: '0.7em', marginLeft: '5px' }}>▼</span>
                </button>

                {activeDropdown === 'qaimeler' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#242424',
                    minWidth: '220px',
                    marginTop: '0',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    borderTop: '3px solid #ffcc00',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => {
                        navigate('/qaimeler/alis')
                        setActiveDropdown(null)
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>📋 Alış Qaimələri</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => handleOpenPage('qaimeler-satis', 'Satış Qaimələri', '📄', SatisQaimeleri)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>📄 Satış Qaimələri</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hesablar */}
              <button
                onClick={() => handleOpenPage('hesablar', 'Hesablar', '💰', Hesablar)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
              >
                💰 Hesablar
              </button>

              {/* Anbar */}
              <button
                onClick={() => handleOpenPage('anbar', 'Anbar', '📦', Anbar)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
              >
                📦 Anbar
              </button>

              {/* Kassa Dropdown */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveDropdown('kassa')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button>
                  Kassa <span style={{ fontSize: '0.7em', marginLeft: '5px' }}>▼</span>
                </button>
                {activeDropdown === 'kassa' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#242424',
                    minWidth: '220px',
                    marginTop: '0',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    borderTop: '3px solid #ffcc00',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('kassa-medaxil', 'Kassa Medaxil', '💵', KassaMedaxil)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>💵 Medaxil</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => handleOpenPage('kassa-mexaric', 'Kassa Mexaric', '💸', KassaMexaric)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>💸 Mexaric</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Müştərilər Dropdown */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveDropdown('musteriler')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button>
                  Müştərilər <span style={{ fontSize: '0.7em', marginLeft: '5px' }}>▼</span>
                </button>
                {activeDropdown === 'musteriler' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#242424',
                    minWidth: '220px',
                    marginTop: '0',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    borderTop: '3px solid #ffcc00',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('musteriler-alici', 'Alıcılar', '👥', Alicilar)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>👥 Alıcılar</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => handleOpenPage('musteriler-satici', 'Satıcılar', '🏢', Saticilar)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>🏢 Satıcılar</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sənədlər Dropdown (Faiz Əməliyyatları) */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveDropdown('senedler')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button>
                  Sənədlər <span style={{ fontSize: '0.7em', marginLeft: '5px' }}>▼</span>
                </button>
                {activeDropdown === 'senedler' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#242424',
                    minWidth: '240px',
                    marginTop: '0',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    borderTop: '3px solid #ffcc00',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('discount-supplier', 'Təchizatçı Faizləri', '📉', SupplierDiscountDocuments)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>📉 Təchizatçılar üzrə</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => handleOpenPage('discount-product', 'Məhsul Faizləri', '🏷️', ProductDiscountDocuments)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: '#ddd',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <span>🏷️ Məhsullar üzrə</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Panel - Yalnız adminlər üçün */}
              {user?.is_admin && (
                <button
                  onClick={() => handleOpenPage('admin', 'Admin Panel', '⚙️', Admin)}
                  style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ⚙️ Admin
                </button>
              )}

              <span>{displayName}</span>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                Profil
              </Link>
              <button onClick={handleLogout} style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Çıxış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                Giriş
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* WORKSPACE - Pəncərələr burada render olunur */}
      <div id="workspace">
        {/* Səhifə məzmunu */}
        <div
          onClickCapture={handleMainContentClick}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            position: 'relative',
            zIndex: mainContentZIndex,
            backgroundColor: '#f5f5f5' // Background color to ensure clicks are captured and it looks like a solid page
          }}
        >
          {children}
        </div>

        {/* Pəncərələr */}
        {Array.from(windows.values())
          .filter(window => {
            const shouldShow = !window.isMinimized && window.isVisible !== false
            return shouldShow
          })
          .map(window => {

            return (
              <UniversalWindow
                key={window.id}
                id={window.id}
                title={window.title}
                icon={window.icon}
                position={window.position}
                size={window.size}
                isMaximized={window.isMaximized}
                zIndex={window.zIndex}
                isActive={activeWindowId === window.id}
                pageId={window.pageId}
                onClose={window.onClose}
                onActivate={window.onActivate}
              >
                {window.content}
              </UniversalWindow>
            )
          })}
      </div>

      {/* Snap Assist Overlay */}
      <SnapAssist />

      {/* TASKBAR */}
      {isAuthenticated && (
        <div id="taskbar">
          <div style={{ marginRight: 'auto', fontWeight: 'bold' }}>📋 Açıq Pəncərələr:</div>
          {Array.from(windows.values()).map(window => (
            <div
              key={window.id}
              className={`taskbar-item ${activeWindowId === window.id && !window.isMinimized ? 'active' : ''}`}
              style={{
                backgroundColor: window.isPinned ? '#2c3e50' : undefined, // Pinned windows darker
                borderLeft: window.isPinned ? '3px solid #f1c40f' : undefined
              }}
              onClick={() => restoreWindow(window.id)}
            >
              {window.icon && <span style={{ marginRight: '6px' }}>{window.icon}</span>}
              <span>{window.title}</span>

              {/* Pin Button */}
              <button
                className="pin-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePinWindow(window.id)
                }}
                title={window.isPinned ? "Bərkitməni qaldır" : "Bərkit"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: window.isPinned ? '#f1c40f' : '#888',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  marginRight: '5px'
                }}
              >
                📌
              </button>

              <button
                className="close-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.isPinned) {
                    alert('Bu pəncərə bərkidilib, bağlamaq üçün əvvəlcə bərkitməni qaldırın.')
                    return
                  }
                  useWindowStore.getState().closeWindow(window.id)
                }}
                style={{
                  opacity: window.isPinned ? 0.5 : 1,
                  cursor: window.isPinned ? 'not-allowed' : 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
