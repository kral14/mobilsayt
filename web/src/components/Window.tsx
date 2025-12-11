import React from 'react'
import { useWindowStore } from '../store/windowStore'

interface WindowProps {
    id: string
    title: string
    content: React.ReactNode
    position: { x: number; y: number }
    size: { width: number; height: number }
    isMaximized: boolean
    zIndex: number
    isActive: boolean
}

export default function Window({
    id,
    title,
    content,
    position,
    size,
    isMaximized,
    zIndex,
    isActive
}: WindowProps) {
    const {
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        activateWindow,
        startDrag,
        startResize
    } = useWindowStore()

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return
        startDrag(id, e)
        e.preventDefault()
    }

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return
        startResize(id, e)
        e.preventDefault()
        e.stopPropagation()
    }

    return (
        <div
            className={`window ${isMaximized ? 'maximized' : ''}`}
            onClick={() => activateWindow(id)}
            style={{
                left: isMaximized ? 0 : `${position.x}px`,
                top: isMaximized ? 0 : `${position.y}px`,
                width: isMaximized ? '100%' : `${size.width}px`,
                height: isMaximized ? '100%' : `${size.height}px`,
                zIndex
            }}
        >
            {/* Window Header */}
            <div
                className={`window-header ${isActive ? 'active' : ''}`}
                onMouseDown={handleHeaderMouseDown}
            >
                <div className="window-title">{title}</div>
                <div className="window-controls">
                    <button
                        className="btn-minimize"
                        onClick={(e) => {
                            e.stopPropagation()
                            minimizeWindow(id)
                        }}
                    >
                        −
                    </button>
                    <button
                        className="btn-maximize"
                        onClick={(e) => {
                            e.stopPropagation()
                            maximizeWindow(id)
                        }}
                    >
                        □
                    </button>
                    <button
                        className="btn-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            closeWindow(id)
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div className="window-content">
                {content}
            </div>

            {/* Resize Handle */}
            {!isMaximized && (
                <div
                    className="resize-handle"
                    onMouseDown={handleResizeMouseDown}
                />
            )}
        </div>
    )
}
