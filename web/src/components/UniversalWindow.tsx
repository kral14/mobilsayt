import React from 'react'
import { useWindowStore } from '../store/windowStore'
import { useState, useEffect, useRef } from 'react'
import SnapLayoutMenu from './SnapLayoutMenu' // Warning unused, keep it
import WindowContext from '../context/WindowContext'

interface UniversalWindowProps {
    id: string
    title: string
    icon?: string
    children: React.ReactNode
    position: { x: number; y: number }
    size: { width: number; height: number }
    isMaximized: boolean
    isPinned?: boolean
    modalType?: string
    zIndex: number
    isActive: boolean
    pageId?: string
    onClose?: () => void
    onActivate?: () => void
}

export default function UniversalWindow({
    id,
    title,
    icon,
    children,
    position,
    size,
    isMaximized,
    isPinned,
    modalType,
    zIndex,
    isActive,
    pageId,
    onClose,
    onActivate
}: UniversalWindowProps) {
    const closeWindow = useWindowStore(state => state.closeWindow)
    const minimizeWindow = useWindowStore(state => state.minimizeWindow)
    const maximizeWindow = useWindowStore(state => state.maximizeWindow)
    const activateWindow = useWindowStore(state => state.activateWindow)
    const togglePinWindow = useWindowStore(state => state.togglePinWindow)
    const startDrag = useWindowStore(state => state.startDrag)
    const startResize = useWindowStore(state => state.startResize)

    // State, Refs, Effects
    const [showSettings, setShowSettings] = useState(false)
    const [zoom, setZoom] = useState(100)
    const [activeTab, setActiveTab] = useState<'view'>('view')
    const [allowMultipleInstances, setAllowMultipleInstances] = useState(false)

    const [showSnapMenu, setShowSnapMenu] = useState(false)
    const snapMenuTimeoutRef = useRef<number | null>(null)

    const settingsRef = useRef<HTMLDivElement>(null)

    const zoomPresets = [50, 75, 100, 125, 150]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showSettings && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement
                if (target.closest('button[title="Ayarlar"]') || target.closest('button')?.title === 'Ayarlar') {
                    return
                }
                setShowSettings(false)
            }
        }

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showSettings])

    useEffect(() => {
        return () => {
            if (snapMenuTimeoutRef.current) {
                clearTimeout(snapMenuTimeoutRef.current)
                snapMenuTimeoutRef.current = null
            }
        }
    }, [])

    React.useEffect(() => {
        if (pageId) {
            try {
                const stored = localStorage.getItem(`window-pref-${pageId}`)
                if (stored) {
                    const prefs = JSON.parse(stored)
                    if (prefs.zoom) setZoom(prefs.zoom)
                    if (prefs.allowMultipleInstances !== undefined) {
                        setAllowMultipleInstances(prefs.allowMultipleInstances)
                    }
                }
            } catch (e) {
                console.error('Failed to load window preferences:', e)
            }
        }
    }, [pageId])

    const handleSaveDefaults = () => {
        console.log('[UniversalWindow] Varsayılan kimi saxla düyməsinə basıldı', { pageId, zoom, size, isMaximized, allowMultipleInstances })

        if (!pageId) {
            console.warn('[UniversalWindow] pageId yoxdur, saxlana bilməz')
            alert('Xəta: Pəncərə ID-si tapılmadı')
            return
        }

        const prefs = {
            zoom,
            size,
            isMaximized,
            allowMultipleInstances
        }

        try {
            localStorage.setItem(`window-pref-${pageId}`, JSON.stringify(prefs))
            console.log('[UniversalWindow] Ayarlar saxlanıldı:', prefs)
            alert('Pəncərə ayarları yadda saxlanıldı! Növbəti dəfə açıldıqda bu ayarlar tətbiq olunacaq.')
        } catch (e) {
            console.error('[UniversalWindow] Ayarları saxlamaq uğursuz oldu:', e)
            alert('Ayarları yadda saxlamaq mümkün olmadı.')
        }
    }

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            return
        }

        if (isMaximized) return
        startDrag(id, e)
        e.preventDefault()
    }

    const handleHeaderDoubleClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            return
        }

        if (settingsRef.current && settingsRef.current.contains(target)) {
            return
        }

        e.stopPropagation()
        e.preventDefault()
        maximizeWindow(id)
    }

    const contextValue = React.useMemo(() => ({
        windowId: id,
        isActive,
        close: () => closeWindow(id),
        maximize: () => maximizeWindow(id),
        minimize: () => minimizeWindow(id)
    }), [id, isActive, closeWindow, maximizeWindow, minimizeWindow])

    return (
        <div
            className={`window ${isMaximized ? 'maximized' : ''}`}
            onMouseDown={() => {
                activateWindow(id)
                if (onActivate) onActivate()
            }}
            style={{
                left: isMaximized ? 0 : `${position.x}px`,
                top: isMaximized ? 0 : `${position.y}px`,
                width: isMaximized ? '100%' : `${size.width}px`,
                height: isMaximized ? '100%' : `${size.height}px`,
                zIndex,
                display: 'flex',
                flexDirection: 'column'
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                return false
            }}
        >
            {/* Window Header */}
            <div
                className={`window-header ${isActive ? 'active' : ''}`}
                onMouseDown={handleHeaderMouseDown}
                onDoubleClick={handleHeaderDoubleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    height: '25px', // Compact height
                    background: isActive ? '#007bff' : '#f0f0f0',
                    color: isActive ? 'white' : 'black',
                    borderBottom: '1px solid #ccc',
                    userSelect: 'none',
                    cursor: 'default',
                    borderTopLeftRadius: isMaximized ? 0 : '8px',
                    borderTopRightRadius: isMaximized ? 0 : '8px'
                }}
            >
                <div className="window-title" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
                    {title}
                </div>
                <div className="window-controls" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>

                    {/* Settings Button */}
                    {modalType !== 'confirm' && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    togglePinWindow(id)
                                }}
                                title={isPinned ? "Bərkitməni qaldır" : "Bərkit"}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isPinned ? '#f1c40f' : '#555',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: isPinned ? 'rotate(45deg)' : 'none'
                                }}
                            >
                                📌
                            </button>
                        </div>
                    )}

                    {modalType !== 'confirm' && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowSettings(!showSettings)
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isActive ? 'white' : '#555',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Ayarlar"
                            >
                                ⚙️
                            </button>

                            {/* Settings Popover */}
                            {showSettings && (
                                <div
                                    ref={settingsRef}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '5px',
                                        background: 'white',
                                        color: 'black',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                        width: '280px',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Popover Header / Tabs */}
                                    <div style={{
                                        display: 'flex',
                                        borderBottom: '1px solid #eee',
                                        background: '#f8f9fa'
                                    }}>
                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                borderBottom: activeTab === 'view' ? '2px solid #007bff' : 'none',
                                                color: activeTab === 'view' ? '#007bff' : '#666'
                                            }}
                                            onClick={() => setActiveTab('view')}
                                        >
                                            Görünüş
                                        </div>
                                    </div>

                                    {/* Popover Content */}
                                    <div style={{ padding: '16px' }}>
                                        {activeTab === 'view' && (
                                            <div>
                                                <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
                                                    Yaxınlaşdırma (Zoom): {zoom}%
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                                    {zoomPresets.map(preset => (
                                                        <button
                                                            key={preset}
                                                            onClick={() => setZoom(preset)}
                                                            style={{
                                                                fontSize: '13px',
                                                                padding: '6px 12px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                background: zoom === preset ? '#e7f1ff' : 'white',
                                                                color: zoom === preset ? '#007bff' : '#333',
                                                                cursor: 'pointer',
                                                                fontWeight: zoom === preset ? '600' : '400'
                                                            }}
                                                        >
                                                            {preset}%
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={zoom}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value)
                                                            if (!isNaN(val) && val > 10 && val <= 300) {
                                                                setZoom(val)
                                                            }
                                                        }}
                                                        style={{
                                                            width: '70px',
                                                            padding: '6px 8px',
                                                            fontSize: '14px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>%</span>
                                                </div>

                                                {pageId && (
                                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                                        <label style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '14px',
                                                            marginBottom: '12px',
                                                            cursor: 'pointer',
                                                            userSelect: 'none'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={!allowMultipleInstances}
                                                                onChange={(e) => setAllowMultipleInstances(!e.target.checked)}
                                                                style={{
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                            <span>Yalnız 1 dəfə açıla bilər</span>
                                                        </label>

                                                        <button
                                                            onClick={handleSaveDefaults}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px',
                                                                background: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#218838'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}
                                                        >
                                                            💾 Varsayılan kimi saxla
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {modalType !== 'confirm' && (
                        <>
                            <button
                                className="btn-minimize"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    minimizeWindow(id)
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isActive ? 'white' : 'black',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    padding: '0 8px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Minimize"
                            >
                                −
                            </button>
                            <button
                                className="btn-maximize"
                                onClick={(e) => {
                                    console.log('[UniversalWindow] Maximize düyməsinə basıldı', { id, isMaximized })
                                    e.stopPropagation()
                                    maximizeWindow(id)
                                }}
                                onMouseEnter={() => {
                                    snapMenuTimeoutRef.current = window.setTimeout(() => {
                                        setShowSnapMenu(true)
                                    }, 1000)
                                }}
                                onMouseLeave={() => {
                                    if (snapMenuTimeoutRef.current) {
                                        clearTimeout(snapMenuTimeoutRef.current)
                                        snapMenuTimeoutRef.current = null
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isActive ? 'white' : 'black',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '0 8px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={isMaximized ? 'Restore' : 'Maximize'}
                            >
                                □
                            </button>
                        </>
                    )}
                    {/* Snap Layout Menu */}
                    {showSnapMenu && (
                        <div
                            style={{ position: 'absolute', right: '40px', top: '0' }}
                            onMouseLeave={() => setShowSnapMenu(false)}
                        >
                            <SnapLayoutMenu windowId={id} onClose={() => setShowSnapMenu(false)} />
                        </div>
                    )}
                    {/* Close button always visible, even for confirm, but handle it */}
                    {true && (
                        <button
                            className="btn-close"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (onClose) {
                                    onClose()
                                } else {
                                    closeWindow(id)
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isActive ? 'white' : 'black',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                padding: '0 8px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isPinned ? 0.5 : 1
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Window Content */}
            <div
                className="window-content"
                style={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    zoom: `${zoom}%`
                }}
            >
                <WindowContext.Provider value={contextValue}>
                    {children}
                </WindowContext.Provider>
            </div>

            {/* Resize Handles - Hide for confirm modals */}
            {
                !isMaximized && modalType !== 'confirm' && (
                    <>
                        <div className="resize-handle resize-handle-n" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'n'); }} />
                        <div className="resize-handle resize-handle-s" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 's'); }} />
                        <div className="resize-handle resize-handle-e" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'e'); }} />
                        <div className="resize-handle resize-handle-w" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'w'); }} />

                        <div className="resize-handle resize-handle-ne" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'ne'); }} />
                        <div className="resize-handle resize-handle-nw" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'nw'); }} />
                        <div className="resize-handle resize-handle-se" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'se'); }} />
                        <div className="resize-handle resize-handle-sw" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startResize(id, e, 'sw'); }} />
                    </>
                )
            }
        </div >
    )
}
