import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useWindowStore } from '../store/windowStore'
import UniversalWindow from './UniversalWindow'
import SnapAssist from './SnapAssist'
import { useLogSync } from '../hooks/useLogSync'
import PartnerManager from './PartnerManager'
import { useNotificationStore } from '../store/notificationStore'
import { NotificationToast } from './NotificationToast'

// Səhifə komponentləri
import Hesablar from '../pages/Hesablar'
import Mehsullar from '../pages/Mehsullar'
import { AlisQaimeleriContent } from '../pages/Qaimeler/Alis'
import { SatisQaimeleriContent } from '../pages/Qaimeler/Satis'
import KassaMedaxil from '../pages/Kassa/Medaxil'
import KassaMexaric from '../pages/Kassa/Mexaric'
import Admin from '../pages/Admin'
import { SupplierDiscountDocuments, ProductDiscountDocuments, CustomerDiscountDocuments } from '../pages/Discounts/DiscountDocuments'
import ActiveDiscountsModal from './ActiveDiscountsModal'

import GlobalFooter from './GlobalFooter'
import { useFooterStore } from '../store/footerStore'

// Layout sabitləri
export const TASKBAR_HEIGHT = 25 // Taskbar hündürlüyü (px)
export const NAVBAR_HEIGHT = 40 // Navbar hündürlüyü (px)
export const FOOTER_HEIGHT = 25 // Global Footer hündürlüyü (px)

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, customer, logout } = useAuthStore()
  const navigate = useNavigate()

  // Dropdown state-ləri
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null)
  const [activeSubSubDropdown, setActiveSubSubDropdown] = useState<string | null>(null) // 3rd level menu

  const navRef = useRef<HTMLDivElement>(null)
  const [mainContentZIndex, setMainContentZIndex] = useState(0)
  const { windows, activeWindowId, openPageWindow, restoreWindow, focusMainContent, togglePinWindow } = useWindowStore()
  const { isVisible: isFooterVisible } = useFooterStore()

  // Toast notifications (global)
  const { activeToasts, removeToast } = useNotificationStore()

  // Hide footer when no window is active
  // useEffect(() => {
  //   if (!activeWindowId) {
  //     hideFooter()
  //   }
  // }, [activeWindowId, hideFooter])

  // Activate log sync
  useLogSync()

  // FontAwesome CDN yükləmək üçün (İkonlar görünsün deyə)
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); }
  }, []);

  // Dropdown-ları bağla əgər nav-dan kənara kliklənərsə
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setActiveSubDropdown(null)
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
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    let lastResizeTime = 0
    const THROTTLE_MS = 250

    const handleResize = () => {
      const now = Date.now()
      const timeSinceLastResize = now - lastResizeTime

      if (resizeTimeout) clearTimeout(resizeTimeout)

      if (timeSinceLastResize >= THROTTLE_MS) {
        lastResizeTime = now
        useWindowStore.getState().handleScreenResize()
      } else {
        resizeTimeout = setTimeout(() => {
          lastResizeTime = Date.now()
          useWindowStore.getState().handleScreenResize()
          resizeTimeout = null
        }, THROTTLE_MS - timeSinceLastResize)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
          return
        }
        const { windows, activeWindowId, closeWindow } = useWindowStore.getState()
        let targetId = activeWindowId
        if (!targetId && windows.size > 0) {
          const sorted = Array.from(windows.values())
            .filter(w => !w.isMinimized && w.isVisible !== false)
            .sort((a, b) => b.zIndex - a.zIndex)
          if (sorted.length > 0) targetId = sorted[0].id
        }
        if (targetId) closeWindow(targetId)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  const handleLogout = () => {
    const { windows, closeWindow } = useWindowStore.getState()
    Array.from(windows.keys()).forEach(windowId => closeWindow(windowId))
    logout()
    navigate('/login')
  }

  const displayName = customer?.name || user?.email || 'İstifadəçi'

  const handleOpenPage = (pageId: string, title: string, icon: string, Component: React.ComponentType) => {
    openPageWindow(pageId, title, icon, <Component />)
    setActiveDropdown(null)
    setActiveSubDropdown(null)
  }

  const handleMainContentClick = () => {
    const newZ = focusMainContent()
    setMainContentZIndex(newZ)
  }

  // Calculate dynamic workspace bottom padding/height
  const workspaceHeightCalc = isFooterVisible
    ? `calc(100vh - ${NAVBAR_HEIGHT + TASKBAR_HEIGHT + FOOTER_HEIGHT}px)`
    : `calc(100vh - ${NAVBAR_HEIGHT + TASKBAR_HEIGHT}px)`

  return (
    <div>
      {/* SUPER NAVBAR CSS STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

        /* Navbar Container */
        .navbar {
            background: #1a1a1a;
            height: ${NAVBAR_HEIGHT}px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            position: fixed;
            top: 0;
            z-index: 9999; /* Windows-dan yuxarıda olmalıdır */
            font-family: 'Poppins', sans-serif;
        }

        /* Logo */
        .navbar .logo {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 5px;
            position: relative;
            padding: 0 10px;
        }
        .navbar .logo span { color: #ffcc00; }
        
        /* Logo Hover Line */
        .navbar .logo::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10px;
            width: 0%;
            height: 3px;
            background: #ffcc00;
            transition: width 0.3s ease;
        }
        .navbar .logo:hover::after {
            width: calc(100% - 20px);
        }
        .navbar .logo:hover {
            color: #ffcc00;
        }

        /* Links Container */
        .nav-links {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
            align-items: center;
            height: 100%;
        }

        /* Nav Items */
        .nav-item {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            margin: 0 10px;
        }

        /* Nav Links Styles */
        .nav-link {
            color: #fff;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            padding: 0 10px;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            background: transparent;
            border: none;
            height: 100%;
            transition: color 0.3s;
        }

        /* Hover Line Effect */
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10px;
            width: 0%;
            height: 3px;
            background: #ffcc00;
            transition: width 0.3s ease;
        }
        .nav-item:hover .nav-link::after,
        .nav-link:hover::after {
            width: calc(100% - 20px);
        }
        .nav-link:hover, .nav-item:hover .nav-link {
            color: #ffcc00;
        }

        /* Dropdown Chevron Rotation */
        .fa-chevron-down {
            font-size: 10px;
            transition: transform 0.3s;
        }
        .nav-item:hover .fa-chevron-down {
            transform: rotate(180deg);
        }

        /* Dropdown Menu */
        .dropdown-menu {
            position: absolute;
            top: ${NAVBAR_HEIGHT}px; /* Navbar height */
            left: 0;
            width: 240px;
            background: #242424;
            list-style: none;
            padding: 10px 0;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            border-top: 3px solid #ffcc00;
            
            /* Animation */
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 10000;
        }

        /* Show Dropdown */
        .nav-item.active .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        /* Dropdown Items */
        .dropdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            font-size: 14px;
            color: #ddd;
            text-decoration: none;
            transition: 0.3s;
            cursor: pointer;
            width: 100%;
            background: transparent;
            border: none;
            text-align: left;
        }
        .dropdown-item:hover {
            background: #333;
            color: #ffcc00;
            padding-left: 25px;
        }

        /* Submenu Container */
        .has-submenu {
            position: relative;
        }
        .submenu {
            position: absolute;
            left: 100%;
            top: 0;
            width: 240px;
            background: #242424;
            list-style: none;
            padding: 10px 0;
            border-radius: 0 8px 8px 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            border-left: 3px solid #ffcc00;
            
            opacity: 0;
            visibility: hidden;
            transform: translateX(-10px);
            transition: all 0.3s ease;
        }
        .has-submenu:hover .submenu {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
        }

        /* User Profile Area */
        .user-actions {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logout-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: 0.3s;
        }
        .logout-btn:hover {
            background: #cc0000;
        }

        /* Taskbar Fixes */
        #taskbar {
            z-index: 10001; /* Taskbar ən üstdə */
        }
        
        
        /* General Workspace Adjustment */
        #workspace {
            padding-top: ${NAVBAR_HEIGHT}px;
            height: ${workspaceHeightCalc};
            box-sizing: border-box;
        }
        
        /* DEBUG: Navbar border - Removed */
      `}</style>

      {/* SUPER NAVBAR HTML STRUCTURE */}
      <nav ref={navRef} className="navbar">
        <Link to="/" className="logo">
          <i className="fas fa-boxes"></i> Anbar<span>Smarte</span>
        </Link>

        {isAuthenticated ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <ul className="nav-links">

              {/* QAİMƏLƏR */}
              <li
                className={`nav-item ${activeDropdown === 'qaimeler' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('qaimeler')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="nav-link">
                  Qaimələr <i className="fas fa-chevron-down"></i>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <button className="dropdown-item" onClick={() => handleOpenPage('qaimeler-alis', 'Alış Qaimələri', '📄', AlisQaimeleriContent)}>
                      <span><i className="fas fa-file-invoice"></i> Alış Qaimələri</span> <i className="fas fa-arrow-right"></i>
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => handleOpenPage('qaimeler-satis', 'Satış Qaimələri', '📄', SatisQaimeleriContent)}>
                      <span><i className="fas fa-file-invoice-dollar"></i> Satış Qaimələri</span> <i className="fas fa-arrow-right"></i>
                    </button>
                  </li>
                </ul>
              </li>

              {/* HESABLAR */}
              <li className="nav-item">
                <button className="nav-link" onClick={() => handleOpenPage('hesablar', 'Hesablar', '💰', Hesablar)}>
                  Hesablar
                </button>
              </li>

              {/* MƏHSULLAR (was ANBAR) */}
              <li className="nav-item">
                <button className="nav-link" onClick={() => handleOpenPage('mehsullar', 'Məhsullar', '📦', Mehsullar)}>
                  Məhsullar
                </button>
              </li>

              {/* KASSA */}
              <li
                className={`nav-item ${activeDropdown === 'kassa' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('kassa')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="nav-link">
                  Kassa <i className="fas fa-chevron-down"></i>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <button className="dropdown-item" onClick={() => handleOpenPage('kassa-medaxil', 'Kassa Medaxil', '💵', KassaMedaxil)}>
                      <span><i className="fas fa-arrow-down"></i> Mədaxil</span> <i className="fas fa-arrow-right"></i>
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => handleOpenPage('kassa-mexaric', 'Kassa Mexaric', '💸', KassaMexaric)}>
                      <span><i className="fas fa-arrow-up"></i> Məxaric</span> <i className="fas fa-arrow-right"></i>
                    </button>
                  </li>
                </ul>
              </li>

              {/* MÜŞTƏRİLƏR */}
              <li
                className={`nav-item dropdown ${activeDropdown === 'kataloq' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('kataloq')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="nav-link">
                  Kataloq <i className="fas fa-chevron-down"></i>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <button className="dropdown-item" onClick={() => {
                      const { openPageWindow } = useWindowStore.getState()
                      openPageWindow(
                        'partners',
                        'Tərəfdaşlar',
                        '👥',
                        <PartnerManager filterType="ALL" />,
                        { width: 1200, height: 800 }
                      )
                    }}>
                      <span><i className="fas fa-users"></i> Tərəfdaşlar</span> <i className="fas fa-arrow-right"></i>
                    </button>
                  </li>
                </ul>
              </li>

              {/* SƏNƏDLƏR (Faizlər) */}
              <li
                className={`nav-item ${activeDropdown === 'senedler' ? 'active' : ''}`}
                onMouseEnter={() => setActiveDropdown('senedler')}
                onMouseLeave={() => { setActiveDropdown(null); setActiveSubDropdown(null); }}
              >
                <button className="nav-link">
                  Sənədlər <i className="fas fa-chevron-down"></i>
                </button>
                <ul className="dropdown-menu">
                  {/* Faiz Parent with Nested Submenus */}
                  <li
                    className="has-submenu"
                    onMouseEnter={() => setActiveSubDropdown('faiz')}
                    onMouseLeave={() => setActiveSubDropdown(null)}
                  >
                    <button className="dropdown-item">
                      <span><i className="fas fa-percentage"></i> Faiz</span> <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                    </button>

                    {/* Faiz Submenu */}
                    {activeSubDropdown === 'faiz' && (
                      <ul className="submenu">
                        {/* Təchizatçı Faizləri with its own submenu */}
                        <li
                          className="has-submenu"
                          onMouseEnter={() => setActiveSubSubDropdown('supplier-discounts')}
                          onMouseLeave={() => setActiveSubSubDropdown(null)}
                        >
                          <button className="dropdown-item" onClick={() => handleOpenPage('discount-supplier', 'Təchizatçı Faizləri', '📉', SupplierDiscountDocuments)}>
                            <span><i className="fas fa-truck"></i> Təchizatçılar üzrə</span> <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                          </button>

                          {/* Təchizatçı Aktiv Siyahı Submenu */}
                          {activeSubSubDropdown === 'supplier-discounts' && (
                            <ul className="submenu" style={{ left: '100%', top: 0 }}>
                              <li>
                                <button className="dropdown-item" onClick={() => {
                                  setActiveDropdown(null);
                                  setActiveSubDropdown(null);
                                  setActiveSubSubDropdown(null);
                                  handleOpenPage('active-discounts-summary-supplier', 'Aktiv Təchizatçı Endirimləri', '📋', () => <ActiveDiscountsModal type="SUPPLIER" />)
                                }}>
                                  <span><i className="fas fa-list"></i> Aktiv Siyahı</span>
                                </button>
                              </li>
                            </ul>
                          )}
                        </li>

                        {/* Müştəri Faizləri with its own submenu */}
                        <li
                          className="has-submenu"
                          onMouseEnter={() => setActiveSubSubDropdown('customer-discounts')}
                          onMouseLeave={() => setActiveSubSubDropdown(null)}
                        >
                          <button className="dropdown-item" onClick={() => handleOpenPage('discount-customer', 'Müştəri Faizləri', '👥', CustomerDiscountDocuments)}>
                            <span><i className="fas fa-user-tag"></i> Müştərilər üzrə</span> <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                          </button>

                          {/* Müştəri Aktiv Siyahı Submenu */}
                          {activeSubSubDropdown === 'customer-discounts' && (
                            <ul className="submenu" style={{ left: '100%', top: 0 }}>
                              <li>
                                <button className="dropdown-item" onClick={() => {
                                  setActiveDropdown(null);
                                  setActiveSubDropdown(null);
                                  setActiveSubSubDropdown(null);
                                  handleOpenPage('active-discounts-summary-customer', 'Aktiv Müştəri Endirimləri', '📋', () => <ActiveDiscountsModal type="CUSTOMER" />)
                                }}>
                                  <span><i className="fas fa-list"></i> Aktiv Siyahı</span>
                                </button>
                              </li>
                            </ul>
                          )}
                        </li>

                        {/* Məhsul Faizləri with its own submenu */}
                        <li
                          className="has-submenu"
                          onMouseEnter={() => setActiveSubSubDropdown('product-discounts')}
                          onMouseLeave={() => setActiveSubSubDropdown(null)}
                        >
                          <button className="dropdown-item" onClick={() => handleOpenPage('discount-product', 'Məhsul Faizləri', '🏷️', ProductDiscountDocuments)}>
                            <span><i className="fas fa-tags"></i> Məhsullar üzrə</span> <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                          </button>

                          {/* Məhsul Aktiv Siyahı Submenu */}
                          {activeSubSubDropdown === 'product-discounts' && (
                            <ul className="submenu" style={{ left: '100%', top: 0 }}>
                              <li>
                                <button className="dropdown-item" onClick={() => {
                                  setActiveDropdown(null);
                                  setActiveSubDropdown(null);
                                  setActiveSubSubDropdown(null);
                                  handleOpenPage('active-discounts-summary-product', 'Aktiv Məhsul Endirimləri', '📋', () => <ActiveDiscountsModal type="PRODUCT" />)
                                }}>
                                  <span><i className="fas fa-list"></i> Aktiv Siyahı</span>
                                </button>
                              </li>
                            </ul>
                          )}
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              </li>

              {/* ADMIN */}
              {user?.is_admin && (
                <li className="nav-item">
                  <button className="nav-link" onClick={() => handleOpenPage('admin', 'Admin Panel', '⚙️', Admin)}>
                    <i className="fas fa-cog"></i> Admin
                  </button>
                </li>
              )}
            </ul>

            {/* USER ACTIONS */}
            <div className="user-actions">
              <span style={{ color: '#ddd', fontSize: '14px' }}>
                <i className="fas fa-user-circle"></i> {displayName}
              </span>
              <Link to="/profile" className="nav-link" style={{ fontSize: '14px', padding: '0' }}>
                Profil
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <i className="fas fa-sign-out-alt"></i> Çıxış
              </button>
            </div>
          </div>
        ) : (
          <div className="nav-links">
            <Link to="/login" className="nav-link">
              <i className="fas fa-sign-in-alt"></i> Giriş
            </Link>
          </div>
        )
        }
      </nav >

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
            backgroundColor: '#f5f5f5'
          }}
        >
          {children}
        </div>

        {/* Pəncərələr */}
        {
          Array.from(windows.values())
            .filter(window => !window.isMinimized && window.isVisible !== false)
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
            )
            )
        }
      </div>

      {/* Snap Assist Overlay */}
      <SnapAssist />

      {/* GLOBAL FOOTER */}
      {isAuthenticated && <GlobalFooter taskbarHeight={TASKBAR_HEIGHT} />}

      {/* TASKBAR */}
      {
        isAuthenticated && (
          <div id="taskbar" style={{
            position: 'fixed', bottom: 0, left: 0, width: '100%', height: `${TASKBAR_HEIGHT}px`,
            background: '#2c3e50', display: 'flex', alignItems: 'center', padding: '0 10px',
            color: 'white', borderTop: '1px solid #444'
          }}>
            <div style={{ marginRight: 'auto', fontWeight: 'bold', fontSize: '0.75rem' }}>📋 Açıq Pəncərələr:</div>
            {Array.from(windows.values()).map(window => (
              <div
                key={window.id}
                className={`taskbar-item ${activeWindowId === window.id && !window.isMinimized ? 'active' : ''}`}
                style={{
                  backgroundColor: window.isPinned ? '#34495e' : (activeWindowId === window.id ? '#3498db' : '#ecf0f1'),
                  color: activeWindowId === window.id ? 'white' : '#333',
                  borderLeft: window.isPinned ? '3px solid #f1c40f' : 'none',
                  padding: '5px 10px',
                  marginRight: '5px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  minWidth: '120px'
                }}
                onClick={() => restoreWindow(window.id)}
              >
                {window.icon && <span style={{ marginRight: '6px' }}>{window.icon}</span>}
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.title}</span>

                {/* Pin Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePinWindow(window.id); }}
                  title={window.isPinned ? "Bərkitməni qaldır" : "Bərkit"}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '5px', fontSize: '12px' }}
                >
                  {window.isPinned ? '📌' : '📍'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.isPinned) {
                      alert('Bu pəncərə bərkidilib.')
                      return
                    }
                    useWindowStore.getState().closeWindow(window.id)
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )
      }

      {/* Notification Toasts (Global) */}
      {activeToasts.map(toast => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}


    </div>
  )
}