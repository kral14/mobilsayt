import React from 'react'
import { useWindowStore } from '../store/windowStore'

interface SnapLayoutMenuProps {
    windowId: string
    onClose: () => void
}

export default function SnapLayoutMenu({ windowId, onClose }: SnapLayoutMenuProps) {
    const { snapWindow } = useWindowStore()

    const handleSnap = (direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
        snapWindow(windowId, direction)
        onClose()
    }

    const boxStyle = {
        background: '#e0e0e0',
        border: '1px solid #999',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }

    const hoverStyle = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.background = '#4a90e2'
        e.currentTarget.style.borderColor = '#2c5282'
    }

    const leaveStyle = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.background = '#e0e0e0'
        e.currentTarget.style.borderColor = '#999'
    }

    return (
        <div style={{
            position: 'absolute',
            top: '30px',
            right: '0',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            gap: '10px',
            width: '240px'
        }}
            onMouseLeave={onClose}
        >
            {/* 50/50 Layout */}
            <div style={{ flex: 1, display: 'flex', gap: '2px', height: '60px' }}>
                <div
                    style={{ ...boxStyle, flex: 1 }}
                    title="Snap Left"
                    onClick={(e) => { e.stopPropagation(); handleSnap('left'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
                <div
                    style={{ ...boxStyle, flex: 1 }}
                    title="Snap Right"
                    onClick={(e) => { e.stopPropagation(); handleSnap('right'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
            </div>

            {/* Quadrant Layout */}
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '2px', height: '60px' }}>
                <div
                    style={{ ...boxStyle, width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' }}
                    title="Top Left"
                    onClick={(e) => { e.stopPropagation(); handleSnap('top-left'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
                <div
                    style={{ ...boxStyle, width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' }}
                    title="Top Right"
                    onClick={(e) => { e.stopPropagation(); handleSnap('top-right'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
                <div
                    style={{ ...boxStyle, width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' }}
                    title="Bottom Left"
                    onClick={(e) => { e.stopPropagation(); handleSnap('bottom-left'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
                <div
                    style={{ ...boxStyle, width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' }}
                    title="Bottom Right"
                    onClick={(e) => { e.stopPropagation(); handleSnap('bottom-right'); }}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                ></div>
            </div>
        </div>
    )
}
