import React from 'react'

interface UniversalNavbarProps {
    onAdd?: () => void
    onDelete?: () => void
    onPrint?: () => void
    onEdit?: () => void
    onCopy?: () => void
    onRefresh?: () => void
    onFilter?: () => void
    onSettings?: () => void
    onSearch?: (term: string) => void
    onSaveFilter?: () => void
    onSelectFilter?: () => void

    onActivate?: () => void
    onDeactivate?: () => void
}

const UniversalNavbar: React.FC<UniversalNavbarProps> = ({
    onAdd,
    onDelete,
    onPrint,
    onEdit,
    onCopy,
    onRefresh,
    onFilter,
    onSettings,
    onSearch,
    onSaveFilter,
    onSelectFilter,
    onActivate,
    onDeactivate
}) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.1rem 0.5rem',
            background: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            flexWrap: 'wrap',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            border: '2px solid green' // DEBUG: Navbar
        }}>
            {/* ADD */}
            {onAdd && (
                <button
                    onClick={onAdd}
                    title="Əlavə et"
                    style={buttonStyle('#28a745')}
                >
                    <span style={iconStyle}>+</span>
                </button>
            )}

            {/* DELETE */}
            {onDelete && (
                <button
                    onClick={onDelete}
                    title="Sil"
                    style={buttonStyle('#dc3545')}
                >
                    <span style={iconStyle}>🗑️</span>
                </button>
            )}

            {/* EDIT */}
            {onEdit && (
                <button
                    onClick={onEdit}
                    title="Redaktə"
                    style={buttonStyle('#ffc107', 'black')}
                >
                    <span style={iconStyle}>✏️</span>
                </button>
            )}

            {/* COPY */}
            {onCopy && (
                <button
                    onClick={onCopy}
                    title="Kopyala"
                    style={buttonStyle('#17a2b8')}
                >
                    <span style={iconStyle}>📄</span>
                </button>
            )}

            {/* PRINT */}
            {onPrint && (
                <button
                    onClick={onPrint}
                    title="Çap et"
                    style={buttonStyle('#6c757d')}
                >
                    <span style={iconStyle}>🖨️</span>
                </button>
            )}

            {/* ACTIVATE / DEACTIVATE */}
            {(onActivate || onDeactivate) && (
                <div style={{ width: '1px', height: '24px', background: '#ccc', margin: '0 0.5rem' }} />
            )}

            {onActivate && (
                <button
                    onClick={onActivate}
                    title="Aktiv et"
                    style={buttonStyle('#28a745')}
                >
                    <span style={iconStyle}>✅</span>
                </button>
            )}

            {onDeactivate && (
                <button
                    onClick={onDeactivate}
                    title="Deaktiv et"
                    style={buttonStyle('#dc3545')}
                >
                    <span style={iconStyle}>🚫</span>
                </button>
            )}


            <div style={{ width: '1px', height: '24px', background: '#ccc', margin: '0 0.5rem' }} />

            {/* REFRESH */}
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    title="Yenilə"
                    style={buttonStyle('#007bff')}
                >
                    <span style={iconStyle}>🔄</span>
                </button>
            )}

            {/* SETTINGS */}
            {onSettings && (
                <button
                    onClick={onSettings}
                    title="Ayarlar"
                    style={buttonStyle('gray')}
                >
                    <span style={iconStyle}>⚙️</span>
                </button>
            )}

            <div style={{ width: '1px', height: '24px', background: '#ccc', margin: '0 0.5rem' }} />

            {/* FILTER & SEARCH */}
            {onFilter && (
                <button
                    onClick={onFilter}
                    title="Filtr"
                    style={buttonStyle('#6610f2')}
                >
                    <span style={iconStyle}>🔍</span>
                </button>
            )}

            {onSearch && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '0 0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', color: '#666' }}>🔎</span>
                    <input
                        type="text"
                        placeholder="Axtarış..."
                        style={{ border: 'none', padding: '0.4rem', outline: 'none' }}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            )}

            {onSaveFilter && (
                <button
                    onClick={onSaveFilter}
                    title="Filtri Yadda Saxla"
                    style={buttonStyle('#20c997')}
                >
                    <span style={iconStyle}>💾</span>
                </button>
            )}

            {onSelectFilter && (
                <button onClick={onSelectFilter} title="Filtr Seç" style={buttonStyle('#6c757d')}>
                    <span style={iconStyle}>📂</span>
                </button>
            )}

        </div>
    )
}

// Styles
const buttonStyle = (bgColor: string, color: string = 'white'): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    color: bgColor === 'gray' ? '#666' : bgColor,
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem',
    cursor: 'pointer',
    minWidth: '36px',
    height: '36px',
    transition: 'background-color 0.2s',
    fontSize: '1.5rem'
})

const iconStyle: React.CSSProperties = {
    lineHeight: 1
}

export default UniversalNavbar
