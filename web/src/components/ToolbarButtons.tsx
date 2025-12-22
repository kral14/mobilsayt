
import React from 'react'

// Shared styles
const buttonStyle = (bgColor: string): React.CSSProperties => ({
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

const dropdownContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block'
}

const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    borderRadius: '4px',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    zIndex: 1000,
    minWidth: '150px'
}

interface ButtonProps {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    title?: string
    visible?: boolean
}

// Helper to render only if visible
const ToolbarButton: React.FC<ButtonProps & { bgColor: string, icon: React.ReactNode, defaultTitle: string }> = ({
    onClick, title, visible = true, bgColor, icon, defaultTitle
}) => {
    if (!visible) return null
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            title={title || defaultTitle}
            style={{
                ...buttonStyle(bgColor),
                opacity: onClick ? 1 : 0.4,
                cursor: onClick ? 'pointer' : 'not-allowed',
                filter: onClick ? 'none' : 'grayscale(100%)'
            }}
        >
            <span style={iconStyle}>{icon}</span>
        </button>
    )
}

export const AddButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#28a745" icon="+" defaultTitle="Əlavə et" />
export const DeleteButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#dc3545" icon="🗑️" defaultTitle="Sil" />
export const EditButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#ffc107" icon="✏️" defaultTitle="Redaktə" />
export const CopyButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#17a2b8" icon="📄" defaultTitle="Kopyala" />
export const PrintButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#6c757d" icon="🖨️" defaultTitle="Çap et" />
export const SelectButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#28a745" icon="✔" defaultTitle="Seç" />
export const ActivateButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#28a745" icon="✅" defaultTitle="Aktiv et" />
export const DeactivateButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#dc3545" icon="🚫" defaultTitle="Deaktiv et" />
export const RefreshButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#007bff" icon="🔄" defaultTitle="Yenilə" />
export const SettingsButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="gray" icon="⚙️" defaultTitle="Ayarlar" />
export const FoldersButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#FF9800" icon="📁" defaultTitle="Papkalar" />
export const FilterButton: React.FC<ButtonProps & { icon?: React.ReactNode }> = (props) => <ToolbarButton {...props} bgColor="#6610f2" icon={props.icon || "🔍"} defaultTitle="Filtr" />
export const SaveFilterButton: React.FC<ButtonProps & { icon?: React.ReactNode }> = (props) => <ToolbarButton {...props} bgColor="#20c997" icon={props.icon || "💾"} defaultTitle="Filtri Yadda Saxla" />
export const SelectFilterButton: React.FC<ButtonProps & { icon?: React.ReactNode }> = (props) => <ToolbarButton {...props} bgColor="#6c757d" icon={props.icon || "📂"} defaultTitle="Filtr Seç" />
export const UpButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#007bff" icon="⬆️" defaultTitle="Yuxarı" />
export const DownButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#007bff" icon="⬇️" defaultTitle="Aşağı" />
export const PeriodButton: React.FC<ButtonProps> = (props) => <ToolbarButton {...props} bgColor="#fd7e14" icon="📅" defaultTitle="Period Seç" />

// Search is a bit different
export const SearchInput: React.FC<{ onSearch?: (term: string) => void, visible?: boolean }> = ({ onSearch, visible = true }) => {
    if (!visible || !onSearch) return null
    return (
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '0 0.5rem' }}>
            <span style={iconStyle}>🔎</span>
            <input
                type="text"
                placeholder="Axtarış..."
                style={{ border: 'none', padding: '0.4rem', outline: 'none' }}
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
    )
}

// Dropdown for Groups
export const ToolbarDropdown: React.FC<{
    icon: React.ReactNode,
    label: string,
    showLabel?: boolean,
    width?: string,
    children: React.ReactNode
}> = ({ icon, label, showLabel = false, children, width = 'auto' }) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={ref} style={{ ...dropdownContainerStyle, width }} title={label}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ ...buttonStyle(isOpen ? '#e6f7ff' : 'transparent'), width: '100%', justifyContent: 'space-between', gap: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={iconStyle}>{icon}</span>
                    {showLabel && <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>}
                </div>
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>▼</span>
            </button>
            {isOpen && (
                <div style={dropdownMenuStyle}>
                    {children}
                </div>
            )}
        </div>
    )
}

export const EditGroupButton: React.FC<any> = () => null // Placeholder
export const FilterGroupButton: React.FC<any> = () => null // Placeholder
