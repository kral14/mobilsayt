import React, { useState, useEffect, useRef, forwardRef } from 'react'

interface SmartDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string // Expecting ISO string or YYYY-MM-DDTHH:mm
    onDateChange: (isoDate: string) => void
}

const SmartDateInput = forwardRef<HTMLInputElement, SmartDateInputProps>(({ value, onDateChange, onBlur, onClick, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const inputRef = useRef<HTMLInputElement | null>(null)
    const lastFocusTime = useRef(0)

    // 0: Initial/Blurred
    // 1: All Selected (after 1st click/focus)
    // 2: Part Selected (after 2nd click)
    // 3: Normal Cursor (after 3rd click)
    const [clickStage, setClickStage] = useState(0)

    // Sync external value to display value
    useEffect(() => {
        if (!value) {
            setDisplayValue('')
            return
        }
        try {
            const date = new Date(value)
            if (isNaN(date.getTime())) {
                setDisplayValue(value)
                return
            }
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')

            // Display: DD.MM.YYYY HH:MM:SS
            setDisplayValue(`${day}.${month}.${year} ${hours}:${minutes}:${seconds}`)
        } catch {
            setDisplayValue(value)
        }
    }, [value])

    const parseAndSubmit = (text: string) => {
        // Smart Parsing Logic
        const now = new Date()
        let day = now.getDate()
        let month = now.getMonth() + 1
        let year = now.getFullYear()
        let hours = 0  // Default to 00:00 instead of current time
        let minutes = 0
        let seconds = 0

        const cleanText = text.trim()
        if (!cleanText) {
            // Maybe handle empty?
            return
        }

        // Attempt to preserve existing time if user only typed date
        let timePartFound = false

        // Regex Check
        // 1. "15" -> Day 15
        // 2. "15.11" -> Day 15, Month 11
        // 3. "15.11.2025" -> Full Date
        // 4. "15.11.2025 10:30" -> Full Date Time

        // Split by space to separate date and time
        const parts = cleanText.split(/\s+/)
        const datePart = parts[0]
        const timePart = parts[1]

        if (datePart) {
            const dateSegments = datePart.split('.')
            if (dateSegments.length === 1) {
                // "15"
                day = parseInt(dateSegments[0])
            } else if (dateSegments.length === 2) {
                // "15.11"
                day = parseInt(dateSegments[0])
                month = parseInt(dateSegments[1])
            } else if (dateSegments.length >= 3) {
                // "15.11.2025"
                day = parseInt(dateSegments[0])
                month = parseInt(dateSegments[1])
                year = parseInt(dateSegments[2])
                // Handle 2 digit year
                if (year < 100) year += 2000
            }
        }

        if (timePart) {
            const timeSegments = timePart.split(':')
            if (timeSegments.length >= 2) {
                hours = parseInt(timeSegments[0])
                minutes = parseInt(timeSegments[1])
                if (timeSegments.length >= 3) {
                    seconds = parseInt(timeSegments[2])
                }
                timePartFound = true
            }
        } else if (!timePartFound) {
            // If user didn't type time, default to 00:00:00
            hours = 0
            minutes = 0
            seconds = 0
        }

        // Validate
        const newDate = new Date(year, month - 1, day, hours, minutes, seconds)

        // Construct ISO string for datetime-local compatible format (YYYY-MM-DDTHH:mm:ss)
        const yyyy = newDate.getFullYear()
        const MM = String(newDate.getMonth() + 1).padStart(2, '0')
        const dd = String(newDate.getDate()).padStart(2, '0')
        const HH = String(newDate.getHours()).padStart(2, '0')
        const mm = String(newDate.getMinutes()).padStart(2, '0')
        const ss = String(newDate.getSeconds()).padStart(2, '0')

        onDateChange(`${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setClickStage(0)
        parseAndSubmit(displayValue)
        if (onBlur) onBlur(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
        }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // 1st Click / Focus -> Select All
        e.target.select()
        setClickStage(1)
        lastFocusTime.current = Date.now()
        if (onFocus) onFocus(e)
    }

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        const input = e.currentTarget

        // Ignore the click that triggered the focus (debounce)
        if (Date.now() - lastFocusTime.current < 200) {
            return
        }

        if (clickStage === 0) {
            // 1st Click: Select All
            input.select()
            setClickStage(1)
        }
        else if (clickStage === 1) {
            // 2nd Click: Cancel selection
            // Use setTimeout to get accurate cursor position after click
            setTimeout(() => {
                const clickPos = input.selectionStart || 0
                input.setSelectionRange(clickPos, clickPos)
            }, 0)
            setClickStage(2)
        }
        else if (clickStage === 2) {
            // 3rd+ Click: Select part based on click position
            // Use setTimeout to get accurate cursor position after click
            setTimeout(() => {
                const clickPos = input.selectionStart || 0
                const text = input.value

                // Check if clicked on whitespace
                const isWhitespace = clickPos >= text.length || text[clickPos] === ' '

                if (isWhitespace) {
                    // Just place cursor
                    input.setSelectionRange(clickPos, clickPos)
                } else {
                    let start = 0
                    let end = 0

                    // Format: DD.MM.YYYY HH:MM:SS
                    // Positions: 01.34.6789 1112:1415:1718
                    if (clickPos <= 1) { // DD
                        start = 0; end = 2;
                    } else if (clickPos >= 3 && clickPos <= 4) { // MM
                        start = 3; end = 5;
                    } else if (clickPos >= 6 && clickPos <= 9) { // YYYY
                        start = 6; end = 10;
                    } else if (clickPos >= 11 && clickPos <= 12) { // HH
                        start = 11; end = 13;
                    } else if (clickPos >= 14 && clickPos <= 15) { // MM (minutes)
                        start = 14; end = 16;
                    } else if (clickPos >= 17 && clickPos <= 18) { // SS
                        start = 17; end = 19;
                    } else {
                        // Clicked on separator - just place cursor
                        input.setSelectionRange(clickPos, clickPos)
                        return
                    }

                    if (end > 0) {
                        input.setSelectionRange(start, end)
                    }
                }
            }, 0)
            // Stay in stage 2
        }

        if (onClick) onClick(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Just update the display value, allow free typing
        // Formatting and validation happens on blur
        setDisplayValue(e.target.value)
    }

    return (
        <input
            ref={(el) => {
                inputRef.current = el
                if (typeof ref === 'function') ref(el)
                else if (ref) (ref as any).current = el
            }}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            placeholder="GG.AA.İİİİ SS:DD:SS"
            maxLength={19} // DD.MM.YYYY HH:MM:SS = 19 characters
            {...props}
        />
    )
})

export default SmartDateInput
