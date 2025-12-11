
import { useWindowStore } from '../store/windowStore'

export default function SnapAssist() {
    const { snapAssist, windows, updateWindow, closeSnapAssist, activateWindow } = useWindowStore()

    if (!snapAssist || !snapAssist.isActive) return null

    // Digər pəncərələri tap (hazırda snap olunan vəya bağlanmış pəncərələr xaric)
    const candidateWindows = Array.from(windows.values()).filter(w =>
        w.id !== snapAssist.triggerWindowId &&
        !w.isMinimized &&
        w.isVisible !== false
    )

    const handleSelectWindow = (windowId: string) => {
        // Seçilən pəncərəni targetRect-ə yerləşdir
        updateWindow(windowId, {
            position: { x: snapAssist.targetRect.x, y: snapAssist.targetRect.y },
            size: { width: snapAssist.targetRect.width, height: snapAssist.targetRect.height },
            isMaximized: false, // Semi-maximized
            normalState: windows.get(windowId)?.normalState || {
                position: windows.get(windowId)?.position || { x: 0, y: 0 },
                size: windows.get(windowId)?.size || { width: 800, height: 600 }
            },
            snapDirection: snapAssist.direction
        })

        activateWindow(windowId)
        closeSnapAssist()
    }

    return (
        <div
            style={{
                position: 'fixed',
                left: snapAssist.targetRect.x,
                top: snapAssist.targetRect.y,
                width: snapAssist.targetRect.width,
                height: snapAssist.targetRect.height,
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                zIndex: 99999,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                padding: '20px',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={closeSnapAssist} // Boşluğa kliklədikdə bağla
        >
            {candidateWindows.length === 0 && (
                <span style={{ color: 'white', fontSize: '1.2rem' }}>Açıq pəncərə yoxdur</span>
            )}

            {candidateWindows.map(window => (
                <div
                    key={window.id}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSelectWindow(window.id)
                    }}
                    style={{
                        width: '200px',
                        height: '150px',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'transform 0.2s',
                        transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {/* Header Preview */}
                    <div style={{
                        background: '#e0e0e0',
                        padding: '8px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid #ccc'
                    }}>
                        {window.icon && <span style={{ marginRight: '5px' }}>{window.icon}</span>}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {window.title}
                        </span>
                    </div>

                    {/* Body Preview (Sadə placeholder) */}
                    <div style={{ flex: 1, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '2rem', opacity: 0.2 }}>📄</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
