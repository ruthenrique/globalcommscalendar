import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export const DAYS_SHORT = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']

export function dateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's date in YYYY-MM-DD using local timezone */
export function todayStr() {
  return dateStr(new Date())
}

/** Monday-aligned week bounds for a given date */
export function weekBoundsOf(date = new Date()) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7 // 0=Mon
  const mon = new Date(d)
  mon.setDate(d.getDate() - dow)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: dateStr(mon), end: dateStr(sun) }
}

/** ISO week number (Mon-based) */
export function isoWeek(dateString) {
  const d = new Date(dateString)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const w1 = new Date(d.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  )
}

/**
 * Build a calendar structure:
 * [{month:1..12, year, weeks:[{dates:[Date×7]}]}]
 */
export function buildCalendar(year) {
  const months = []
  for (let m = 1; m <= 12; m++) {
    const firstDay = new Date(year, m - 1, 1)
    const dow = (firstDay.getDay() + 6) % 7 // 0=Mon
    const monday = new Date(firstDay)
    monday.setDate(firstDay.getDate() - dow)
    const weeks = []
    let cur = new Date(monday)
    while (true) {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur))
        cur.setDate(cur.getDate() + 1)
      }
      if (week.some(d => d.getMonth() + 1 === m && d.getFullYear() === year)) {
        weeks.push(week)
      }
      if (week[6].getMonth() + 1 > m || week[6].getFullYear() > year) break
    }
    months.push({ month: m, year, weeks })
  }
  return months
}

export function arr(v) {
  return Array.isArray(v) ? v : v ? [v] : []
}

export function intersects(a, b) {
  return b.length === 0 || arr(a).some(x => b.includes(x))
}

export function formatDate(ds) {
  if (!ds) return ''
  const [y, m, d] = ds.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
