import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWindowStore } from '../store/windowStore'
import UniversalWindow from './UniversalWindow'
import SnapAssist from './SnapAssist'

// Səhifə komponentləri
import Hesablar from '../pages/Hesablar'
import Anbar from '../pages/Anbar'
import AlisQaimeleri from '../pages/Qaimeler/Alis'
import SatisQaimeleri from '../pages/Qaimeler/Satis'
import KassaMedaxil from '../pages/Kassa/Medaxil'
import KassaMexaric from '../pages/Kassa/Mexaric'
import Alicilar from '../pages/Musteriler/Alici'
import Saticilar from '../pages/Musteriler/Satici'



export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, customer, logout } = useAuthStore()
  const { windows, activeWindowId, openPageWindow, restoreWindow } = useWindowStore()
  const navigate = useNavigate()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

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

  // Screen Resize Listener
  useEffect(() => {
    const handleResize = () => {
      useWindowStore.getState().handleScreenResize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

        // Bütün açıq pəncərələri bağla
        const { windows, closeWindow } = useWindowStore.getState()
        if (windows.size > 0) {
          // Bütün pəncərələri bağla
          Array.from(windows.keys()).forEach(windowId => {
            closeWindow(windowId)
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = customer?.name || user?.email || 'İstifadəçi'

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  // Səhifə pəncərəsi aç
  const handleOpenPage = (pageId: string, title: string, icon: string, Component: React.ComponentType) => {
    openPageWindow(pageId, title, icon, <Component />)
    setActiveDropdown(null)
  }

  // Test pəncərələri yaratmaq üçün
  const handleCreateTestWindow = () => {
    openPageWindow('test', 'Test Pəncərəsi', '📝', (
      <div>
        <h3>Test Məzmunu</h3>
        <p>Bu test pəncərəsidir.</p>
        <p>Pəncərəni sürükləyə, ölçüsünü dəyişə və idarə edə bilərsiniz.</p>
      </div>
    ))
  }

  return (
    <div>
      {/* NAVBAR */}
      <nav ref={navRef}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          🖥️ MobilSayt
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', position: 'relative' }}>
          {isAuthenticated ? (
            <>
              {/* Test Pəncərəsi */}
              <button onClick={handleCreateTestWindow}>
                ➕ Yeni Pəncərə
              </button>

              {/* Qaimələr Dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleDropdown('qaimeler')}>
                  Qaimələr ▼
                </button>
                {activeDropdown === 'qaimeler' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#444',
                    minWidth: '150px',
                    marginTop: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('qaimeler-alis', 'Alış Qaimələri', '📋', AlisQaimeleri)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #555',
                        cursor: 'pointer'
                      }}
                    >
                      📋 Alış Qaimələri
                    </button>
                    <button
                      onClick={() => handleOpenPage('qaimeler-satis', 'Satış Qaimələri', '📄', SatisQaimeleri)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer'
                      }}
                    >
                      📄 Satış Qaimələri
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
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleDropdown('kassa')}>
                  Kassa ▼
                </button>
                {activeDropdown === 'kassa' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#444',
                    minWidth: '150px',
                    marginTop: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('kassa-medaxil', 'Kassa Medaxil', '💵', KassaMedaxil)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #555',
                        cursor: 'pointer'
                      }}
                    >
                      💵 Medaxil
                    </button>
                    <button
                      onClick={() => handleOpenPage('kassa-mexaric', 'Kassa Mexaric', '💸', KassaMexaric)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer'
                      }}
                    >
                      💸 Mexaric
                    </button>
                  </div>
                )}
              </div>

              {/* Müştərilər Dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => toggleDropdown('musteriler')}>
                  Müştərilər ▼
                </button>
                {activeDropdown === 'musteriler' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#444',
                    minWidth: '150px',
                    marginTop: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    zIndex: 1000
                  }}>
                    <button
                      onClick={() => handleOpenPage('musteriler-alici', 'Alıcılar', '👥', Alicilar)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #555',
                        cursor: 'pointer'
                      }}
                    >
                      👥 Alıcılar
                    </button>
                    <button
                      onClick={() => handleOpenPage('musteriler-satici', 'Satıcılar', '🏢', Saticilar)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer'
                      }}
                    >
                      🏢 Satıcılar
                    </button>
                  </div>
                )}
              </div>

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
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                Qeydiyyat
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* WORKSPACE - Pəncərələr burada render olunur */}
      <div id="workspace">
        {/* Səhifə məzmunu */}
        <div style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          position: 'relative'
        }}>
          {children}
        </div>

        {/* Pəncərələr */}
        {Array.from(windows.values())
          .filter(window => !window.isMinimized)
          .map(window => (
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
          ))}
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
              onClick={() => restoreWindow(window.id)}
            >
              {window.icon && <span style={{ marginRight: '6px' }}>{window.icon}</span>}
              <span>{window.title}</span>
              <button
                className="close-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  useWindowStore.getState().closeWindow(window.id)
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
