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
            // const seconds = String(date.getSeconds()).padStart(2, '0')

            // Display: DD.MM.YYYY HH:MM
            setDisplayValue(`${day}.${month}.${year} ${hours}:${minutes}`)
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
        let hours = now.getHours()
        let minutes = now.getMinutes()
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
                timePartFound = true
            }
        } else if (!timePartFound) {
            // If user didn't type time, keep the time from the ORIGINAL value passed in props
            // to avoid resetting time to "now" every time we edit date
            if (value) {
                const originalDate = new Date(value)
                if (!isNaN(originalDate.getTime())) {
                    hours = originalDate.getHours()
                    minutes = originalDate.getMinutes()
                }
            }
        }

        // Validate
        const newDate = new Date(year, month - 1, day, hours, minutes, seconds)

        // Construct ISO string for datetime-local compatible format (YYYY-MM-DDTHH:mm)
        // Adjust for timezone offset if needed, or use local ISO
        const yyyy = newDate.getFullYear()
        const MM = String(newDate.getMonth() + 1).padStart(2, '0')
        const dd = String(newDate.getDate()).padStart(2, '0')
        const HH = String(newDate.getHours()).padStart(2, '0')
        const mm = String(newDate.getMinutes()).padStart(2, '0')

        onDateChange(`${yyyy}-${MM}-${dd}T${HH}:${mm}`)
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

        const cursor = input.selectionStart || 0
        const text = input.value

        // Check if clicked on whitespace (Space or End of string)
        const isWhitespace = cursor >= text.length || text[cursor] === ' '

        if (clickStage === 0) {
            // User clicked from normal state -> Start Cycle (Select All)
            input.select()
            setClickStage(1)
        }
        else if (clickStage === 1) {
            // 2nd Click (was All Selected)
            if (isWhitespace) {
                // Clicked on empty space -> Cancel selection
                setClickStage(0)
            } else {
                // Clicked on text -> Select Part
                let start = 0
                let end = 0

                if (cursor <= 2) { // DD
                    start = 0; end = 2;
                } else if (cursor >= 3 && cursor <= 5) { // MM
                    start = 3; end = 5;
                } else if (cursor >= 6 && cursor <= 10) { // YYYY
                    start = 6; end = 10;
                } else if (cursor >= 11 && cursor <= 13) { // HH
                    start = 11; end = 13;
                } else if (cursor >= 14) { // MM
                    start = 14; end = 16;
                }

                if (end > 0) {
                    input.setSelectionRange(start, end)
                    setClickStage(2)
                } else {
                    // Fallback
                    setClickStage(0)
                }
            }
        }
        else if (clickStage === 2) {
            // 3rd Click -> Cancel / Reset based on click
            setClickStage(0)
        }

        if (onClick) onClick(e)
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
            onChange={(e) => setDisplayValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            placeholder="GG.AA.İİİİ SS:DD"
            {...props}
        />
    )
})

export default SmartDateInput
