import React, { useState, useEffect } from 'react'

export interface DatePeriod {
    startDate: string // YYYY-MM-DD
    endDate: string   // YYYY-MM-DD
}

interface DatePeriodPickerProps {
    value?: DatePeriod
    onChange: (period: DatePeriod) => void
    onClose?: () => void
}

const MONTHS_AZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']

const DatePeriodPicker: React.FC<DatePeriodPickerProps> = ({
    value,
    onChange,
    onClose,
}) => {
    // Current center year for the 3-year view
    const [viewYear, setViewYear] = useState(new Date().getFullYear())

    // Internal state for inputs
    const [startDate, setStartDate] = useState(value?.startDate || '')
    const [endDate, setEndDate] = useState(value?.endDate || '')
    const [remember, setRemember] = useState(() => {
        // Load remember preference from localStorage
        const saved = localStorage.getItem('date-period-remember')
        return saved === 'true'
    })
    const [showStandard, setShowStandard] = useState(false)
    const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null) // Track which calendar is open
    const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear())
    const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth())

    useEffect(() => {
        if (value) {
            setStartDate(value.startDate)
            setEndDate(value.endDate)
            // Auto adjust view year if date is set
            if (value.startDate) {
                const y = parseInt(value.startDate.split('-')[0])
                if (!isNaN(y)) setViewYear(y)
            }
        }
    }, [value])

    // Save remember preference to localStorage
    useEffect(() => {
        localStorage.setItem('date-period-remember', remember.toString())
    }, [remember])

    // Load saved dates from localStorage on mount if remember is enabled
    useEffect(() => {
        const rememberPref = localStorage.getItem('date-period-remember')
        if (rememberPref === 'true') {
            const saved = localStorage.getItem('date-period-saved')
            if (saved) {
                try {
                    const { startDate: savedStart, endDate: savedEnd } = JSON.parse(saved)
                    if (savedStart) setStartDate(savedStart)
                    if (savedEnd) setEndDate(savedEnd)
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }, []) // Run only on mount

    // Detect click outside listener is handled by parent usually, but we have close button

    const handleApply = () => {
        // Save to localStorage if remember is checked
        if (remember) {
            localStorage.setItem('date-period-saved', JSON.stringify({ startDate, endDate }))
        }
        onChange({ startDate, endDate })
        if (onClose) onClose()
    }

    const handleClear = () => {
        setStartDate('')
        setEndDate('')
        // Clear from localStorage as well
        localStorage.removeItem('date-period-saved')
        onChange({ startDate: '', endDate: '' })
    }

    // Clear saved dates if remember is unchecked
    useEffect(() => {
        if (!remember) {
            localStorage.removeItem('date-period-saved')
        }
    }, [remember])

    // Smart date parser - auto-completes partial dates
    const parseSmartDate = (input: string): string => {
        if (!input || input.includes('-')) return input // Already in YYYY-MM-DD format or empty

        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')

        // Remove any non-numeric characters except dots
        const cleaned = input.replace(/[^\d.]/g, '')
        const parts = cleaned.split('.')

        if (parts.length === 1 && parts[0].length > 0) {
            // Just day: "15" → "15.MM.YYYY"
            const day = parts[0].padStart(2, '0')
            return `${currentYear}-${currentMonth}-${day}`
        } else if (parts.length === 2) {
            // Day and month: "15.12" → "15.12.YYYY"
            const day = parts[0].padStart(2, '0')
            const month = parts[1].padStart(2, '0')
            return `${currentYear}-${month}-${day}`
        } else if (parts.length === 3) {
            // Full date: "15.12.2024" → "2024-12-15"
            const day = parts[0].padStart(2, '0')
            const month = parts[1].padStart(2, '0')
            let year = parts[2]
            // Handle 2-digit year
            if (year.length === 2) {
                year = '20' + year
            }
            return `${year}-${month}-${day}`
        }

        return input
    }

    // Format date for display (YYYY-MM-DD → dd.MM.yyyy)
    const formatDateForDisplay = (isoDate: string): string => {
        if (!isoDate || !isoDate.includes('-')) return isoDate
        const [year, month, day] = isoDate.split('-')
        return `${day}.${month}.${year}`
    }

    // Parse display format back to ISO (dd.MM.yyyy → YYYY-MM-DD)
    const parseDisplayToISO = (displayDate: string): string => {
        if (!displayDate || displayDate.includes('-')) return displayDate
        const parts = displayDate.split('.')
        if (parts.length === 3) {
            const [day, month, year] = parts
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return displayDate
    }

    // Render mini calendar for date selection
    const renderMiniCalendar = (type: 'start' | 'end') => {
        const currentValue = type === 'start' ? startDate : endDate

        // Use component-level state instead of local useState
        const viewYear = calendarViewYear
        const viewMonth = calendarViewMonth

        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const firstDay = new Date(viewYear, viewMonth, 1).getDay()

        const days = []
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '4px' }}></div>)
        }
        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
            const isSelected = currentValue === dateStr
            days.push(
                <div
                    key={day}
                    onClick={() => {
                        if (type === 'start') {
                            setStartDate(dateStr)
                        } else {
                            setEndDate(dateStr)
                        }
                        setShowCalendar(null)
                    }}
                    style={{
                        padding: '4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isSelected ? '#3d8bfd' : 'transparent',
                        color: isSelected ? 'white' : '#333',
                        borderRadius: '3px',
                        fontSize: '12px'
                    }}
                >
                    {day}
                </div>
            )
        }

        return (
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 1000,
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                marginTop: '2px',
                width: '200px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <button onClick={() => {
                        if (viewMonth === 0) {
                            setCalendarViewMonth(11)
                            setCalendarViewYear(viewYear - 1)
                        } else {
                            setCalendarViewMonth(viewMonth - 1)
                        }
                    }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>◀</button>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        {MONTHS_AZ[viewMonth]} {viewYear}
                    </span>
                    <button onClick={() => {
                        if (viewMonth === 11) {
                            setCalendarViewMonth(0)
                            setCalendarViewYear(viewYear + 1)
                        } else {
                            setCalendarViewMonth(viewMonth + 1)
                        }
                    }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>▶</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {['B', 'B', 'Ç', 'C', 'C', 'Ş', 'B'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>{d}</div>
                    ))}
                    {days}
                </div>
            </div>
        )
    }

    // --- Grid Logic ---
    const isMonthSelected = (year: number, monthIdx: number) => {
        if (!startDate && !endDate) return false

        // Converting to simple comparable numbers: YYYYMM
        const mVal = year * 100 + (monthIdx + 1)

        let sVal = 999999
        let eVal = 0

        if (startDate) {
            const [sy, sm] = startDate.split('-').map(Number)
            sVal = sy * 100 + sm
        }
        if (endDate) {
            const [ey, em] = endDate.split('-').map(Number)
            eVal = ey * 100 + em
        }

        // If only start date is set
        if (startDate && !endDate) {
            return sVal === mVal
        }

        return mVal >= sVal && mVal <= eVal
    }

    const handleMonthClick = (year: number, monthIdx: number, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Format helper
        const fmt = (y: number, m: number, d: number) => {
            const mm = (m + 1).toString().padStart(2, '0')
            const dd = d.toString().padStart(2, '0')
            return `${y}-${mm}-${dd}`
        }

        // Get first and last day of clicked month
        const firstDay = fmt(year, monthIdx, 1)
        const lastDay = fmt(year, monthIdx, new Date(year, monthIdx + 1, 0).getDate())

        // Two-click logic:
        // - If no dates selected OR both dates already selected -> First click: set start
        // - If only start is set -> Second click: set end

        if (!startDate || (startDate && endDate)) {
            // First click: Set start date to first day of month, clear end
            setStartDate(firstDay)
            setEndDate('')
        } else if (startDate && !endDate) {
            // Second click: Set end date to last day of month
            // If clicked month is BEFORE start month, swap them
            if (firstDay < startDate) {
                setEndDate(startDate) // Old start becomes end
                setStartDate(firstDay) // New month becomes start
            } else {
                setEndDate(lastDay)
            }
        }
    }

    const renderYearGrid = (year: number) => {
        return (
            <div key={year} style={{ flex: 1, minWidth: '140px', border: '1px solid #eee', padding: '5px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>
                    {year}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                    {MONTHS_AZ.map((m, idx) => {
                        const selected = isMonthSelected(year, idx)
                        return (
                            <button
                                key={m}
                                onClick={(e) => handleMonthClick(year, idx, e)}
                                style={{
                                    border: '1px solid #ddd',
                                    background: selected ? '#3d8bfd' : '#fff',
                                    color: selected ? '#fff' : '#333',
                                    padding: '8px 2px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    borderRadius: '2px',
                                    outline: 'none'
                                }}
                            >
                                {m}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div style={{
            background: '#fffdf5', // Light yellowish bg like screenshot
            border: '1px solid #aaa',
            padding: '10px',
            width: '500px', // Reduced from 600px for more compact display
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontFamily: 'Segoe UI, sans-serif',
            userSelect: 'none'
        }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            {/* Header: Title and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#ccc', padding: '5px 10px', color: '#333', fontWeight: 'bold' }}>
                <span>Period seçin</span>
                <span style={{ cursor: 'pointer', fontSize: '18px', lineHeight: 0.8 }} onClick={onClose}>✕</span>
            </div>

            {/* Date Inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                        type="text"
                        value={formatDateForDisplay(startDate)}
                        onChange={(e) => {
                            const val = e.target.value
                            setStartDate(parseDisplayToISO(val))
                        }}
                        onBlur={(e) => {
                            const parsed = parseSmartDate(e.target.value)
                            if (parsed !== e.target.value) {
                                setStartDate(parsed)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const parsed = parseSmartDate(e.currentTarget.value)
                                setStartDate(parsed)
                            }
                        }}
                        placeholder="gg.aa.yyyy"
                        style={{
                            padding: '4px 50px 4px 8px',
                            border: '1px solid #ccc',
                            width: '110px',
                            borderRadius: '3px',
                            fontSize: '13px'
                        }}
                    />
                    <button
                        onClick={() => setShowCalendar(showCalendar === 'start' ? null : 'start')}
                        style={{
                            position: 'absolute',
                            right: '26px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '2px',
                            fontSize: '14px',
                            lineHeight: 1
                        }}
                        title="Təqvim seç"
                    >
                        📅
                    </button>
                    {showCalendar === 'start' && renderMiniCalendar('start')}
                    {startDate && (
                        <button
                            onClick={() => setStartDate('')}
                            style={{
                                position: 'absolute',
                                right: '6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'transparent',
                                color: 'red',
                                cursor: 'pointer',
                                fontSize: '14px',
                                lineHeight: 1,
                                padding: '2px'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <span>—</span>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                        type="text"
                        value={formatDateForDisplay(endDate)}
                        onChange={(e) => {
                            const val = e.target.value
                            setEndDate(parseDisplayToISO(val))
                        }}
                        onBlur={(e) => {
                            const parsed = parseSmartDate(e.target.value)
                            if (parsed !== e.target.value) {
                                setEndDate(parsed)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const parsed = parseSmartDate(e.currentTarget.value)
                                setEndDate(parsed)
                            }
                        }}
                        placeholder="gg.aa.yyyy"
                        style={{
                            padding: '4px 50px 4px 8px',
                            border: '1px solid #ccc',
                            width: '110px',
                            borderRadius: '3px',
                            fontSize: '13px'
                        }}
                    />
                    <button
                        onClick={() => setShowCalendar(showCalendar === 'end' ? null : 'end')}
                        style={{
                            position: 'absolute',
                            right: '26px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '2px',
                            fontSize: '14px',
                            lineHeight: 1
                        }}
                        title="Təqvim seç"
                    >
                        📅
                    </button>
                    {showCalendar === 'end' && renderMiniCalendar('end')}
                    {endDate && (
                        <button
                            onClick={() => setEndDate('')}
                            style={{
                                position: 'absolute',
                                right: '6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'transparent',
                                color: 'red',
                                cursor: 'pointer',
                                fontSize: '14px',
                                lineHeight: 1,
                                padding: '2px'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <a href="#" onClick={(e) => { e.preventDefault(); handleClear() }} style={{ color: '#0066cc', textDecoration: 'underline', marginLeft: 'auto' }}>
                    Periodu təmizlə
                </a>
            </div>

            {/* Years Grid Container */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                <button
                    onClick={() => setViewYear(y => y - 1)}
                    style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#aaa' }}
                >
                    ◀
                </button>

                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    {renderYearGrid(viewYear - 1)}
                    {renderYearGrid(viewYear)}
                    {renderYearGrid(viewYear + 1)}
                </div>

                <button
                    onClick={() => setViewYear(y => y + 1)}
                    style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#aaa' }}
                >
                    ▶
                </button>
            </div>

            {/* Footer Options */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                        Seçilmiş periodu yadda saxla
                    </label>
                </div>

                {/* Toggle Standard Periods */}
                <a href="#"
                    onClick={(e) => { e.preventDefault(); setShowStandard(!showStandard) }}
                    style={{ color: '#0066cc', textDecoration: 'underline', display: 'block', marginBottom: '5px' }}>
                    {showStandard ? 'Standart periodları gizlət' : 'Standart periodları göstər'}
                </a>

                {showStandard && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginTop: '5px', padding: '10px', background: '#f0f0f0' }}>
                        <button onClick={() => {
                            const d = new Date().toISOString().split('T')[0]; setStartDate(d); setEndDate(d);
                        }}>Bu gün</button>
                        <button onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() - 1); const s = d.toISOString().split('T')[0]; setStartDate(s); setEndDate(s);
                        }}>Dünən</button>
                        <button onClick={() => {
                            // This month
                            const now = new Date();
                            const s = new Date(now.getFullYear(), now.getMonth(), 1);
                            const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            setStartDate(s.toISOString().split('T')[0]);
                            setEndDate(e.toISOString().split('T')[0]);
                        }}>Bu ay</button>
                        <button onClick={() => {
                            // This Week
                            const now = new Date();
                            const day = now.getDay() || 7;
                            const s = new Date(now); s.setDate(s.getDate() - day + 1);
                            setStartDate(s.toISOString().split('T')[0]);
                            setEndDate(now.toISOString().split('T')[0]);
                        }}>Bu həftə</button>
                        <button onClick={() => {
                            // Last month
                            const now = new Date();
                            const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            const e = new Date(now.getFullYear(), now.getMonth(), 0);
                            setStartDate(s.toISOString().split('T')[0]);
                            setEndDate(e.toISOString().split('T')[0]);
                        }}>Keçən ay</button>
                        <button onClick={() => {
                            // This year
                            const now = new Date();
                            const s = new Date(now.getFullYear(), 0, 1);
                            const e = new Date(now.getFullYear(), 11, 31);
                            setStartDate(s.toISOString().split('T')[0]);
                            setEndDate(e.toISOString().split('T')[0]);
                        }}>Bu il</button>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={handleApply}
                    style={{
                        padding: '6px 20px',
                        background: 'linear-gradient(to bottom, #fffbad, #fff566)', // Matches screenshot yellowish button
                        border: '1px solid #aaa',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: '#333'
                    }}
                >
                    Seç
                </button>
                <button
                    onClick={onClose}
                    style={{
                        padding: '6px 20px',
                        background: 'linear-gradient(to bottom, #f0f0f0, #dcdcdc)',
                        border: '1px solid #aaa',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: '#333'
                    }}
                >
                    Ləğv et
                </button>
            </div>
        </div>
    )
}

export default DatePeriodPicker
