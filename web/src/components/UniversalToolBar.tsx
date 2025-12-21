import React, { useState, useEffect } from 'react'
import {
    AddButton, DeleteButton, EditButton, CopyButton, PrintButton,
    SelectButton, ActivateButton, DeactivateButton, RefreshButton,
    SettingsButton, FoldersButton, FilterButton, SaveFilterButton,
    SelectFilterButton, SearchInput, UpButton, DownButton, ToolbarDropdown
} from './ToolbarButtons'
import ToolbarConfigModal from './ToolbarConfigModal'
import { useWindowStore } from '../store/windowStore'
import filterIcon from '../assets/icons/toolbar/filter.png'
import filterSaveIcon from '../assets/icons/toolbar/filtersave.png'
import filterChangeIcon from '../assets/icons/toolbar/filterchange.png'

interface UniversalToolBarProps {
    toolbarId?: string // Unique ID for saving configuration
    onAdd?: () => void
    onDelete?: () => void
    onEdit?: () => void
    onCopy?: () => void
    onPrint?: () => void
    onRefresh?: () => void
    onSettings?: () => void

    onSaveFilter?: () => void
    onSelectFilter?: () => void
    onSelect?: () => void
    onFolders?: () => void
    onUp?: () => void
    onDown?: () => void

    onActivate?: () => void
    onDeactivate?: () => void

    children?: React.ReactNode // Custom controls

    // For simplicity, we can just pass specific handlers.
    // Ideally, a generic "onAction(type)" would be better, but this is fine.

    // Filter/Search
    onFilter?: () => void
    onSearch?: (term: string) => void
}

const FilterImg = <img src={filterIcon} alt="Filtr" style={{ width: 22, height: 22, objectFit: 'contain' }} />
const SaveFilterImg = <img src={filterSaveIcon} alt="Yadda Saxla" style={{ width: 22, height: 22, objectFit: 'contain' }} />
const SelectFilterImg = <img src={filterChangeIcon} alt="Seç" style={{ width: 22, height: 22, objectFit: 'contain' }} />

const ALL_TOOLS = [
    { key: 'add', label: 'Əlavə et', icon: '+' },
    { key: 'delete', label: 'Sil', icon: '🗑️' },
    { key: 'edit', label: 'Redaktə', icon: '✏️' },
    { key: 'copy', label: 'Kopyala', icon: '📄' },
    { key: 'print', label: 'Çap et', icon: '🖨️' },
    { key: 'select', label: 'Seç', icon: '✔' },
    { key: 'activate', label: 'Aktiv et', icon: '✅' },
    { key: 'deactivate', label: 'Deaktiv et', icon: '🚫' },
    { key: 'refresh', label: 'Yenilə', icon: '🔄' },
    { key: 'settings', label: 'Ayarlar', icon: '⚙️' },
    { key: 'folders', label: 'Papkalar', icon: '📁' },
    { key: 'up', label: 'Yuxarı', icon: '⬆️' },
    { key: 'down', label: 'Aşağı', icon: '⬇️' },
    { key: 'filter', label: 'Filtr', icon: FilterImg },
    { key: 'saveFilter', label: 'Filtri Yadda Saxla', icon: SaveFilterImg },
    { key: 'selectFilter', label: 'Filtr Seç', icon: SelectFilterImg },
    { key: 'search', label: 'Axtarış', icon: '🔎' },
]

const UniversalToolBar: React.FC<UniversalToolBarProps> = ({
    toolbarId,
    onAdd, onDelete, onPrint, onEdit, onCopy, onRefresh,
    onFilter, onSettings, onSearch, onSaveFilter, onSelectFilter,
    onSelect, onFolders, onUp, onDown, onActivate, onDeactivate,
    children
}) => {
    // Default visible tools: all
    const [visibleTools, setVisibleTools] = useState<string[]>(ALL_TOOLS.map(t => t.key))

    useEffect(() => {
        if (toolbarId) {
            try {
                const saved = localStorage.getItem(`toolbar-config-${toolbarId}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Ensure unique and valid
                    const validKeys = new Set(ALL_TOOLS.map(t => t.key))
                    setVisibleTools(parsed.filter((k: string) => validKeys.has(k)))
                }
            } catch (e) {
                console.error('Toolbar config load error', e)
            }
        }
    }, [toolbarId])

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()

        useWindowStore.getState().openPageWindow(
            'toolbar-config',
            'Toolbarı Fərdiləşdir',
            '⚙️',
            <ToolbarConfigModal
                availableTools={ALL_TOOLS}
                visibleTools={visibleTools}
                onSave={(newVisible) => {
                    setVisibleTools(newVisible)
                    if (toolbarId) {
                        localStorage.setItem(`toolbar-config-${toolbarId}`, JSON.stringify(newVisible))
                    }
                }}
            />,
            { width: 400, height: 600 }
        )
    }

    const renderTool = (key: string) => {
        switch (key) {
            case 'add': return <AddButton key={key} onClick={onAdd} />
            case 'delete': return <DeleteButton key={key} onClick={onDelete} />
            case 'edit': return <EditButton key={key} onClick={onEdit} />
            case 'copy': return <CopyButton key={key} onClick={onCopy} />
            case 'print': return <PrintButton key={key} onClick={onPrint} />
            case 'select': return <SelectButton key={key} onClick={onSelect} />
            case 'activate': return <ActivateButton key={key} onClick={onActivate} />
            case 'deactivate': return <DeactivateButton key={key} onClick={onDeactivate} />
            case 'refresh': return <RefreshButton key={key} onClick={onRefresh} />
            case 'settings': return <SettingsButton key={key} onClick={onSettings} />
            case 'folders': return <FoldersButton key={key} onClick={onFolders} />
            case 'up': return <UpButton key={key} onClick={onUp} />
            case 'down': return <DownButton key={key} onClick={onDown} />
            case 'filter': return <FilterButton key={key} onClick={onFilter} icon={FilterImg} />
            case 'saveFilter': return <SaveFilterButton key={key} onClick={onSaveFilter} icon={SaveFilterImg} />
            case 'selectFilter': return <SelectFilterButton key={key} onClick={onSelectFilter} icon={SelectFilterImg} />
            case 'search': return <SearchInput key={key} onSearch={onSearch} />

            default: return null
        }
    }

    return (
        <div
            onContextMenu={handleContextMenu}
            style={{
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
                minHeight: '38px' // Prevent collapse if empty
            }}
        >
            {visibleTools.map(renderTool)}

            {/* Divider for custom children */}
            {(children) && <div style={{ width: '1px', height: '24px', background: '#ccc', margin: '0 0.5rem' }} />}
            {children}
        </div>
    )
}

export default UniversalToolBar
