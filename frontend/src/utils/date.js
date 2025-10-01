export function toISODate(date = new Date()) {
  const d = new Date(date)
  // Ensure we're working with local time to avoid timezone issues
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function rangeDays(start, end) {
  const dates = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  while (d <= end) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Get the start of the week (Saturday)
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = d.getDay()
  
  // Calculate days to subtract to get to Saturday
  // Saturday = 6, so we want to go back to the most recent Saturday
  let daysToSubtract
  if (dayOfWeek === 6) {
    // If today is Saturday, start from today
    daysToSubtract = 0
  } else {
    // Otherwise, go back to the previous Saturday
    // Sunday (0) -> go back 1 day, Monday (1) -> go back 2 days, etc.
    daysToSubtract = dayOfWeek + 1
  }
  
  d.setDate(d.getDate() - daysToSubtract)
  return d
}

// Get the end of the week (Friday)
export function getWeekEnd(date = new Date()) {
  const weekStart = getWeekStart(date)
  return addDays(weekStart, 6) // Saturday + 6 days = Friday
}

// Get the current week range (Saturday to Friday)
export function getCurrentWeekRange(date = new Date()) {
  const start = getWeekStart(date)
  const end = getWeekEnd(date)
  return { start, end }
}

// Get week days in Arabic (starting from Saturday)
export function getWeekDayLabels() {
  return ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
}
