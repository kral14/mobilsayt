// Tarix fərqini dəqiq hesabla (il, ay, gün)
export const calculateDateDifference = (startDate: Date, endDate: Date): { years: number; months: number; days: number } => {
  let years = endDate.getFullYear() - startDate.getFullYear()
  let months = endDate.getMonth() - startDate.getMonth()
  let days = endDate.getDate() - startDate.getDate()

  // Günlər mənfi olarsa, əvvəlki ayın son günlərindən götür
  if (days < 0) {
    const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate()
    days += lastDayOfPrevMonth
    months--
  }

  // Aylar mənfi olarsa, əvvəlki ildən götür
  if (months < 0) {
    months += 12
    years--
  }

  return { years, months, days }
}

// Tarix fərqini formatla (il, ay, gün)
export const formatDateDifference = (startDate: Date, endDate: Date): string => {
  const { years, months, days } = calculateDateDifference(startDate, endDate)
  const parts = []
  if (years > 0) parts.push(`${years} il`)
  if (months > 0) parts.push(`${months} ay`)
  if (days > 0) parts.push(`${days} gün`)

  if (parts.length === 0) {
    return '0 gün'
  }

  return parts.join(' ')
}

// Günlər arasındakı fərqi hesabla
export const calculateDaysDifference = (startDate: Date, endDate: Date): number => {
  const diffTime = endDate.getTime() - startDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Tarix formatlaşdırma funksiyası (input üçün)
export const formatDateInput = (input: string): string => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  // Təmizlə: yalnız rəqəmlər və nöqtələr
  const cleaned = input.replace(/[^\d.]/g, '')

  // Formatlar: "15", "15.11", "15.11.2025"
  const parts = cleaned.split('.')

  if (parts.length === 1 && parts[0]) {
    // Sadəcə gün: "15" -> "15.11.2025"
    const day = parseInt(parts[0])
    if (day >= 1 && day <= 31) {
      const month = currentMonth
      return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  } else if (parts.length === 2 && parts[0] && parts[1]) {
    // Gün və ay: "15.11" -> "15.11.2025"
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  } else if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    // Tam tarix: "15.11.2025" -> "2025-11-15"
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  return input // Əgər format düzgün deyilsə, olduğu kimi qaytar
}

export const formatDateToDisplay = (dateString: string | undefined | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return dateString || ''
  }
}

export const convertDisplayToRaw = (displayDate: string): string => {
  if (!displayDate) return ''
  const parts = displayDate.split('.')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return displayDate
}

export const parseSmartDate = (input: string): string => {
  return formatDateInput(input)
}

