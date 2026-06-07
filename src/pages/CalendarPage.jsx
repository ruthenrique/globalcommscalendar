import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, SlidersHorizontal, X, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/layout/Toaster'
import CommModal from '@/components/CommModal'
import { dateStr, todayStr, arr, intersects, cn } from '@/lib/utils'
import {
  COUNTRY_META, CHANNEL_META, STATUS_META, FORMAT_ICON,
  INTERNAL_CHANNELS, EXTERNAL_CHANNELS,
} from '@/lib/constants'

// ── i18n ──────────────────────────────────────────────────
const DOW_ES    = ['Do','Lu','Ma','Mi','Ju','Vi','Sá']
const DOW_EN    = ['Su','Mo','Tu','We','Th','Fr','Sa']
const DOW_PT    = ['Do','Se','Te','Qu','Qu','Se','Sá']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function getDowLabels(lang) {
  if (lang.startsWith('en')) return DOW_EN
  if (lang.startsWith('pt')) return DOW_PT
  return DOW_ES
}
function getMonthNames(lang) {
  if (lang.startsWith('en')) return MONTHS_EN
  if (lang.startsWith('pt')) return MONTHS_PT
  return MONTHS_ES
}
function getMonFirstLabels(lang) {
  const l = getDowLabels(lang)
  return [...l.slice(1), l[0]]
}

// ── Date helpers ──────────────────────────────────────────
function getMonday(d = new Date()) {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function weekLabel(monday, lang, short = false) {
  const sunday = addDays(monday, 6)
  const months = getMonthNames(lang)
  const ms = months[monday.getMonth()]
  const ss = months[sunday.getMonth()]
  const y  = sunday.getFullYear()
  if (short) return `${monday.getDate()}–${sunday.getDate()} ${ms.slice(0, 3)}`
  if (ms === ss) return `${monday.getDate()}–${sunday.getDate()} de ${ms} ${y}`
  return `${monday.getDate()} ${ms} – ${sunday.getDate()} ${ss} ${y}`
}
function dayLabel(dayStr, lang, short = false) {
  const d      = new Date(dayStr + 'T00:00:00')
  const months = getMonthNames(lang)
  const dows   = getDowLabels(lang)
  const dow    = dows[d.getDay()]
  if (short) return `${dow} ${d.getDate()} ${months[d.getMonth()].slice(0, 3)}`
  return `${dow} ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`
}

// ── Mobile hook ───────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ── Filter keys ───────────────────────────────────────────
const FILTER_KEYS = [
  { key: 'pais',     label: 'País'     },
  { key: 'canal',    label: 'Canal'    },
  { key: 'topico',   label: 'Tópico'   },
  { key: 'segmento', label: 'Segmento' },
  { key: 'estado',   label: 'Estado'   },
]

// ── Inline chip filter row ────────────────────────────────
function FilterRow({ label, options, value, onChange, renderChip }) {
  if (!options.length) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 w-16 flex-shrink-0 pt-1.5 text-right">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const sel = value.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onChange(sel ? value.filter(v => v !== opt) : [...value, opt])}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-all font-medium',
                sel
                  ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600'
              )}
            >
              {renderChip ? renderChip(opt) : opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Event card (week, full) ───────────────────────────────
function EventCard({ ev, status_t, onClick, onDragStart, compact }) {
  const paises   = arr(ev.pais)
  const canal    = arr(ev.canal)[0]
  const status   = arr(ev.estado)[0]
  const formato  = arr(ev.formato)[0]
  const chanMeta = CHANNEL_META[canal] ?? {}
  const stMeta   = STATUS_META[status] ?? {}

  if (compact) {
    return (
      <div
        onClick={onClick}
        title={ev.titulo}
        className="comm-chip rounded-md px-1.5 py-1 mb-1 cursor-pointer overflow-hidden"
        style={{ background: stMeta.bg ?? '#f5f5f7', borderLeft: `2px solid ${chanMeta.color ?? '#d1d5db'}`, opacity: status === 'Cancelado' ? 0.45 : 1 }}
      >
        <div className="flex items-center gap-0.5 mb-0.5">
          {paises.slice(0, 2).map(p => <span key={p} className="text-[10px] leading-none">{COUNTRY_META[p]?.flag ?? ''}</span>)}
          {ev.destacado && <span className="text-amber-400 text-[8px] ml-auto">★</span>}
        </div>
        <div className="text-[10px] font-semibold leading-snug line-clamp-2" style={{ color: stMeta.color ?? '#1a1a1a' }}>
          {ev.titulo}
        </div>
        {canal && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#ccc' }} />
            <span className="text-[9px] opacity-50 truncate leading-none">{canal}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      title={ev.titulo}
      className="comm-chip rounded-lg p-2 mb-1.5 cursor-pointer overflow-hidden"
      style={{ background: stMeta.bg ?? '#f5f5f7', color: stMeta.color ?? '#1a1a1a', borderLeft: `3px solid ${chanMeta.color ?? '#d1d5db'}`, opacity: status === 'Cancelado' ? 0.45 : 1 }}
    >
      <div className="flex items-center gap-0.5 mb-1">
        <div className="flex items-center">
          {paises.slice(0, 4).map(p => <span key={p} className="text-[11px] leading-none -mr-0.5">{COUNTRY_META[p]?.flag ?? ''}</span>)}
          {paises.length > 4 && <span className="text-[8px] opacity-50 ml-1">+{paises.length - 4}</span>}
        </div>
        {ev.destacado && <span className="text-amber-400 text-[9px] ml-0.5">★</span>}
        <span className="ml-auto text-[8px] font-semibold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
          style={{ background: (stMeta.dot ?? '#888') + '22', color: stMeta.dot ?? '#888' }}>
          {status_t}
        </span>
      </div>
      <div className="text-[11px] font-semibold leading-snug line-clamp-2 mb-1">
        {FORMAT_ICON[formato] ? <span className="mr-0.5">{FORMAT_ICON[formato]}</span> : null}
        {ev.titulo}
      </div>
      {canal && (
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#ccc' }} />
          <span className="text-[9px] opacity-55 truncate">{canal}</span>
        </div>
      )}
    </div>
  )
}

// ── Mini card (month view) ────────────────────────────────
function MiniCard({ ev, onClick, onDragStart }) {
  const country  = arr(ev.pais)[0]
  const canal    = arr(ev.canal)[0]
  const status   = arr(ev.estado)[0]
  const chanMeta = CHANNEL_META[canal] ?? {}
  const stMeta   = STATUS_META[status] ?? {}
  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart?.() }}
      onClick={e => { e.stopPropagation(); onClick() }}
      title={ev.titulo}
      className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 mb-0.5 overflow-hidden"
      style={{ background: stMeta.bg ?? '#f5f5f7', color: stMeta.color ?? '#1a1a1a', borderLeft: `2px solid ${chanMeta.color ?? '#d1d5db'}`, opacity: status === 'Cancelado' ? 0.6 : 1 }}
    >
      <span className="flex-shrink-0 leading-none">{COUNTRY_META[country]?.flag ?? ''}</span>
      <span className="truncate flex-1">{ev.titulo}</span>
      {ev.destacado && <span className="text-amber-400 flex-shrink-0 text-[9px]">★</span>}
    </div>
  )
}

// ── Country overload alert ────────────────────────────────
const INT_SET = new Set(INTERNAL_CHANNELS)
const EXT_SET = new Set(EXTERNAL_CHANNELS)

function CountryAlert({ comms, dateStrs }) {
  const { t } = useTranslation()
  const intCounts = {}, extCounts = {}
  comms.filter(ev => dateStrs.includes(ev.date)).forEach(ev => {
    const channels = arr(ev.canal)
    const hasInt = channels.some(c => INT_SET.has(c))
    const hasExt = channels.some(c => EXT_SET.has(c))
    arr(ev.pais).forEach(p => {
      const key = `${p}||${ev.date}`
      if (hasInt) intCounts[key] = (intCounts[key] ?? 0) + 1
      if (hasExt) extCounts[key] = (extCounts[key] ?? 0) + 1
    })
  })
  const alerts = []
  const allKeys = new Set([...Object.keys(intCounts), ...Object.keys(extCounts)])
  allKeys.forEach(key => {
    const [p, date] = key.split('||')
    const [, m, d] = date.split('-')
    const label = `${COUNTRY_META[p]?.flag ?? ''} ${COUNTRY_META[p]?.name ?? p}`
    const day = `${d}/${m}`
    if ((intCounts[key] ?? 0) > 3) alerts.push({ key: `${key}|int`, label, day, n: intCounts[key], type: 'int' })
    if ((extCounts[key] ?? 0) > 3) alerts.push({ key: `${key}|ext`, label, day, n: extCounts[key], type: 'ext' })
  })
  if (!alerts.length) return null
  return (
    <div className="flex items-center gap-2 px-4 py-1 flex-shrink-0 flex-wrap border-b border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
      <span className="text-[10px] text-gray-400">{t('calendar.saturation')}</span>
      {alerts.map(({ key, label, day, n, type }) => (
        <span key={key} className="text-[10px] text-gray-500">
          {label} <span className="text-gray-400">{day}</span>
          <span className={cn('ml-1 font-semibold', type === 'int' ? 'text-amber-500' : 'text-sky-500')}>·{n}</span>
        </span>
      ))}
    </div>
  )
}

// ── Month view ────────────────────────────────────────────
function MonthView({ year, month, communications, filters, today, lang, canEdit, onClickCard, onAdd, onDragStart, onDrop }) {
  const [dragOver, setDragOver] = useState(null)
  const dowLabels = getMonFirstLabels(lang)

  const weeks = useMemo(() => {
    const firstDay  = new Date(year, month, 1)
    const dayOfWeek = (firstDay.getDay() + 6) % 7
    const lastDay   = new Date(year, month + 1, 0)
    const result    = []
    let cur = new Date(year, month, 1 - dayOfWeek)
    while (cur <= lastDay && result.length < 6) {
      const week = []
      for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
      result.push(week)
    }
    return result
  }, [year, month])

  const allDateSet = useMemo(() => {
    const s = new Set(); weeks.forEach(w => w.forEach(d => s.add(dateStr(d)))); return s
  }, [weeks])

  const filtered = useMemo(() =>
    communications.filter(ev => allDateSet.has(ev.date) && FILTER_KEYS.every(fd => intersects(ev[fd.key], filters[fd.key]))),
    [communications, allDateSet, filters]
  )

  const byDate = useMemo(() => {
    const map = {}; filtered.forEach(ev => { if (!map[ev.date]) map[ev.date] = []; map[ev.date].push(ev) }); return map
  }, [filtered])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-100 flex-shrink-0">
        {dowLabels.map((d, i) => (
          <div key={i} className="text-center py-2 text-[10px] uppercase tracking-widest text-gray-400 font-medium border-r border-gray-100 last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="flex-1" style={{ display: 'grid', gridTemplateRows: `repeat(${weeks.length}, minmax(80px, 1fr))` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ minHeight: 80 }}>
            {week.map(d => {
              const ds = dateStr(d)
              const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year
              const dow = d.getDay()
              const isWE = dow === 0 || dow === 6
              const isTod = ds === today
              const isDO = dragOver === ds
              const evs = byDate[ds] ?? []
              return (
                <div
                  key={ds}
                  className={cn('border-r border-b border-gray-100 p-1 last:border-r-0 overflow-hidden', !isCurrentMonth ? 'bg-gray-50/50' : isWE ? 'bg-gray-50/30' : 'bg-white', isTod ? '!bg-sky-50/50' : '', isDO ? '!bg-sky-50 ring-1 ring-inset ring-sky-200' : '', canEdit && isCurrentMonth ? 'cursor-pointer' : '')}
                  onClick={() => canEdit && isCurrentMonth && onAdd(ds)}
                  onDragOver={e => { e.preventDefault(); setDragOver(ds) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); setDragOver(null); onDrop(ds) }}
                >
                  <div className={cn('text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5', isTod ? 'bg-sky-500 text-white' : !isCurrentMonth ? 'text-gray-300' : isWE ? 'text-gray-400' : 'text-gray-700')}>
                    {d.getDate()}
                  </div>
                  {evs.slice(0, 3).map(ev => (
                    <MiniCard key={ev.id} ev={ev} onClick={() => onClickCard(ev)} onDragStart={() => onDragStart(ev.id)} />
                  ))}
                  {evs.length > 3 && <div className="text-[9px] text-gray-400 font-medium pl-1 mt-0.5">{t('calendar.moreShort', { n: evs.length - 3 })}</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Week channel row ──────────────────────────────────────
function WeekChannelRow({ channel, days, today, byDate, canEdit, canEditCountry, onClickCard, onAdd, onDragStart, onDrop, statusT, compact }) {
  const chanMeta = CHANNEL_META[channel] ?? {}
  const [dragOver, setDragOver] = useState(null)
  return (
    <tr className="group">
      <td className={cn('sticky left-0 z-[5] bg-white border-r border-b border-gray-100 py-2', compact ? 'px-1.5' : 'px-2')} style={{ width: compact ? 50 : 80, minWidth: compact ? 50 : 80 }}>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#d1d5db' }} />
          {!compact && <span className="text-[10px] font-medium text-gray-600 truncate leading-tight">{channel}</span>}
        </div>
      </td>
      {days.map(d => {
        const ds   = dateStr(d)
        const dow  = d.getDay()
        const isWE = dow === 0 || dow === 6
        const isTod = ds === today
        const evs  = (byDate[ds] ?? []).filter(ev => arr(ev.canal).includes(channel))
        const isDO = dragOver === ds
        return (
          <td
            key={ds}
            className={cn('border-r border-b border-gray-100 align-top', compact ? 'p-1' : 'p-1.5', isWE ? 'bg-gray-50/50' : 'bg-white', isTod ? '!bg-sky-50/30' : '', isDO ? 'drag-over' : '')}
            style={{ verticalAlign: 'top', height: compact ? 72 : 88 }}
            onDragOver={e => { if (!isWE && canEdit) { e.preventDefault(); setDragOver(ds) } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => { e.preventDefault(); setDragOver(null); onDrop(ds, channel) }}
          >
            {!isWE && (
              <>
                {evs.map(ev => (
                  <EventCard key={ev.id} ev={ev} compact={compact} status_t={statusT(arr(ev.estado)[0])} onClick={() => onClickCard(ev)} onDragStart={() => onDragStart(ev.id)} />
                ))}
                {canEdit && (
                  <button onClick={() => onAdd(channel, ds)} className={cn('w-full flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-300 hover:border-sky-300 hover:text-sky-400 transition-colors mt-0.5 opacity-0 group-hover:opacity-100', compact ? 'h-4' : 'h-5')}>
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                )}
              </>
            )}
          </td>
        )
      })}
    </tr>
  )
}

// ── Search results overlay ────────────────────────────────
function SearchResults({ results, onSelect, onClose, isMobile }) {
  const { t } = useTranslation()
  if (!results.length) return (
    <div className={cn('absolute z-50 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden', isMobile ? 'left-0 right-0 top-full mt-1' : 'left-0 right-0 top-full mt-1')}>
      <div className="px-4 py-3 text-xs text-gray-400 text-center">{t('calendar.noResults')}</div>
    </div>
  )
  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {results.slice(0, 20).map(ev => {
          const canal   = arr(ev.canal)[0]
          const status  = arr(ev.estado)[0]
          const stMeta  = STATUS_META[status] ?? {}
          const chMeta  = CHANNEL_META[canal] ?? {}
          return (
            <button
              key={ev.id}
              onClick={() => { onSelect(ev); onClose() }}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 mt-0.5">
                {arr(ev.pais).slice(0, 2).map(p => <span key={p} className="text-sm">{COUNTRY_META[p]?.flag ?? ''}</span>)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {ev.destacado && <span className="text-amber-400 mr-1">★</span>}
                  {ev.titulo}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{ev.date}</span>
                  {canal && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: chMeta.color ?? '#ccc' }} />
                      {canal}
                    </span>
                  )}
                  {arr(ev.topico).slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: (stMeta.dot ?? '#888') + '22', color: stMeta.dot ?? '#888' }}>
                {status}
              </span>
            </button>
          )
        })}
      </div>
      {results.length > 20 && (
        <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-50 text-center">
          {t('calendar.moreResults', { n: results.length - 20 })}
        </div>
      )}
    </div>
  )
}

// ── Main CalendarPage ─────────────────────────────────────
// ── Day view ──────────────────────────────────────────────
function DayView({ comms, dayStr, today, onEventClick, canEdit, onAdd, statusT }) {
  const dayComms = comms.filter(c => c.date === dayStr)
  const groups   = {}
  dayComms.forEach(ev => {
    const ch = arr(ev.canal)[0] ?? '—'
    if (!groups[ch]) groups[ch] = []
    groups[ch].push(ev)
  })
  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-4">
      {dayComms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">{t('calendar.noComms')}</p>
          {canEdit && (
            <button onClick={() => onAdd(dayStr)} className="mt-3 text-xs text-sky-600 hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> {t('calendar.newComm')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl mx-auto">
          {Object.entries(groups).map(([canal, evs]) => {
            const chanMeta = CHANNEL_META[canal] ?? {}
            return (
              <div key={canal}>
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chanMeta.color ?? '#ccc' }} />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{canal}</span>
                  <span className="text-[10px] text-gray-300 ml-auto">{evs.length} {evs.length === 1 ? 'comm' : 'comms'}</span>
                </div>
                <div className="space-y-2">
                  {evs.map(ev => (
                    <EventCard key={ev.id} ev={ev} onClick={() => onEventClick(ev)} onDragStart={() => {}} statusT={statusT} compact={false} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Mini month picker ─────────────────────────────────────
function MiniMonthPicker({ initYear, initMonth, today, commsPerDay, lang, onSelectDay, onClose }) {
  const [y, setY] = useState(initYear)
  const [m, setM] = useState(initMonth)
  const monthNames = getMonthNames(lang)
  const firstDow   = (new Date(y, m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  function prev() { m === 0  ? (setM(11), setY(y => y - 1)) : setM(m => m - 1) }
  function next() { m === 11 ? (setM(0),  setY(y => y + 1)) : setM(m => m + 1) }
  return (
    <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-4 w-4 text-gray-500" /></button>
        <span className="text-sm font-semibold text-gray-800">{monthNames[m]} {y}</span>
        <button onClick={next} className="p-1 rounded-lg hover:bg-gray-100"><ChevronRight className="h-4 w-4 text-gray-500" /></button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="text-[9px] text-gray-400 py-1 font-medium">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const ds      = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const count   = commsPerDay[ds] ?? 0
          const isToday = ds === today
          return (
            <button key={i} onClick={() => { onSelectDay(ds); onClose() }}
              className={cn('flex flex-col items-center justify-center text-xs py-1 rounded-lg transition-colors',
                isToday ? 'bg-gray-900 text-white font-bold' : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              <span>{d}</span>
              {count > 0 && <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: isToday ? 'rgba(255,255,255,0.6)' : '#0EA5E9' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const { communications, channels, updateComm } = useApp()
  const { perms, canEditCountry, role, myCountries } = useAuth()
  const { t, i18n }                             = useTranslation()
  const isMobile                                 = useIsMobile()

  const [viewMode,     setViewMode]     = useState('week')
  const [weekStart,    setWeekStart]    = useState(() => getMonday())
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const defaultPais = (role !== 'super_admin' && myCountries.length > 0)
    ? [...new Set([...myCountries, 'GL'])]
    : []
  const [filters,      setFilters]      = useState({ pais: defaultPais, canal:[], topico:[], segmento:[], estado:[] })
  const [filtersOpen,  setFiltersOpen]  = useState(false)
  const [search,       setSearch]       = useState('')
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [modal,        setModal]        = useState({ open: false, initial: null })
  const [dragId,       setDragId]       = useState(null)
  const [selectedDay,  setSelectedDay]  = useState(() => todayStr())
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const searchRef  = useRef(null)
  const pickerRef  = useRef(null)

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function handle(e) { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false) }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('touchstart', handle) }
  }, [pickerOpen])

  const today      = todayStr()
  const lang       = i18n.language
  const monthNames = getMonthNames(lang)
  const dowLabels  = getDowLabels(lang)

  // ── Search filter ─────────────────────────────────────
  const searchedComms = useMemo(() => {
    if (!search.trim()) return communications
    const q = search.toLowerCase()
    return communications.filter(c =>
      c.titulo?.toLowerCase().includes(q) ||
      c.body?.toLowerCase().includes(q) ||
      arr(c.topico).some(t => t.toLowerCase().includes(q)) ||
      arr(c.canal).some(ch => ch.toLowerCase().includes(q)) ||
      arr(c.pais).some(p => (COUNTRY_META[p]?.name ?? p).toLowerCase().includes(q)) ||
      arr(c.segmento).some(s => s.toLowerCase().includes(q))
    )
  }, [communications, search])

  // All 7 days
  const weekDays    = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekDayStrs = useMemo(() => weekDays.map(d => dateStr(d)), [weekDays])

  // Mobile: Mon–Fri only
  const visWeekDays = useMemo(() =>
    isMobile ? weekDays.filter(d => d.getDay() !== 0 && d.getDay() !== 6) : weekDays,
    [weekDays, isMobile]
  )

  const isThisWeek = weekDayStrs.includes(today)

  // Filter options (from full dataset, not searched — so chips don't disappear mid-type)
  const paiOptions    = useMemo(() => [...new Set(communications.flatMap(c => arr(c.pais)))].sort(),    [communications])
  const canalOptions  = useMemo(() => [...new Set(communications.flatMap(c => arr(c.canal)))].sort(),   [communications])
  const topicoOptions = useMemo(() => [...new Set(communications.flatMap(c => arr(c.topico)))].sort(),  [communications])
  const segOptions    = useMemo(() => [...new Set(communications.flatMap(c => arr(c.segmento)))].sort(),[communications])
  const estadoOptions = ['Aprobado','En revisión','Borrador','Publicado','Cancelado']
  const filterOptions = { pais: paiOptions, canal: canalOptions, topico: topicoOptions, segmento: segOptions, estado: estadoOptions }

  const activeFilters = Object.values(filters).reduce((n, v) => n + v.length, 0)

  // Day view filtered comms
  const dayFiltered = useMemo(() =>
    searchedComms.filter(ev =>
      ev.date === selectedDay &&
      FILTER_KEYS.every(fd => intersects(ev[fd.key], filters[fd.key]))
    ),
    [searchedComms, selectedDay, filters]
  )

  // Dots map for mini picker
  const commsPerDay = useMemo(() => {
    const map = {}
    searchedComms.forEach(c => { if (c.date) map[c.date] = (map[c.date] ?? 0) + 1 })
    return map
  }, [searchedComms])

  // Comms after both search + chip filters (for the calendar grid)
  const weekFiltered = useMemo(() =>
    searchedComms.filter(ev =>
      weekDayStrs.includes(ev.date) &&
      FILTER_KEYS.every(fd => intersects(ev[fd.key], filters[fd.key]))
    ),
    [searchedComms, weekDayStrs, filters]
  )

  const byDate = useMemo(() => {
    const map = {}
    weekFiltered.forEach(ev => { if (!map[ev.date]) map[ev.date] = []; map[ev.date].push(ev) })
    return map
  }, [weekFiltered])

  // Saturation map: date → [{flag, name, n}] — declared AFTER weekFiltered ✓
  const satByDate = useMemo(() => {
    const intC = {}, extC = {}
    weekFiltered.forEach(ev => {
      const chs    = arr(ev.canal)
      const hasInt = chs.some(c => INT_SET.has(c))
      const hasExt = chs.some(c => EXT_SET.has(c))
      arr(ev.pais).forEach(p => {
        const k = `${p}||${ev.date}`
        if (hasInt) intC[k] = (intC[k] ?? 0) + 1
        if (hasExt) extC[k] = (extC[k] ?? 0) + 1
      })
    })
    const map = {}
    new Set([...Object.keys(intC), ...Object.keys(extC)]).forEach(k => {
      const [p, date] = k.split('||')
      const n = Math.max(intC[k] ?? 0, extC[k] ?? 0)
      if (n > 3) {
        if (!map[date]) map[date] = []
        map[date].push({ flag: COUNTRY_META[p]?.flag ?? '', name: COUNTRY_META[p]?.name ?? p, n })
      }
    })
    return map
  }, [weekFiltered])

  const internalCh  = channels.length > 0 ? channels.filter(c => c.type === 'internal').map(c => c.name) : INTERNAL_CHANNELS
  const externalCh  = channels.length > 0 ? channels.filter(c => c.type === 'external').map(c => c.name) : EXTERNAL_CHANNELS
  const allChannels = [...internalCh, ...externalCh]
  const visChannels = allChannels.filter(ch => filters.canal.length === 0 || filters.canal.includes(ch))

  function prevMonth() { setCurrentMonth(({ year, month }) => month === 0 ? { year: year-1, month: 11 } : { year, month: month-1 }) }
  function nextMonth() { setCurrentMonth(({ year, month }) => month === 11 ? { year: year+1, month: 0 } : { year, month: month+1 }) }

  function openNew(canal = '', date = '') {
    setModal({ open: true, initial: { titulo:'', body:'', date, pais:[], canal: canal ? [canal] : [], segmento:[], ubicacion:[], topico:[], formato:[], idioma:[], alcance:['Local'], estado:['Borrador'], destacado:false } })
  }
  function openEdit(ev) { setModal({ open: true, initial: ev }) }

  async function handleWeekDrop(ds, ch) {
    if (!dragId || !perms.canEdit) return
    const ev = communications.find(c => c.id === dragId)
    if (!ev || !canEditCountry(arr(ev.pais))) return
    const newCanal = arr(ev.canal).includes(ch) ? ev.canal : [ch]
    await updateComm(ev.id, { ...ev, date: ds, canal: newCanal })
    toast({ title: t('toast.moved'), variant: 'success' })
    setDragId(null)
  }
  async function handleMonthDrop(ds) {
    if (!dragId || !perms.canEdit) return
    const ev = communications.find(c => c.id === dragId)
    if (!ev || !canEditCountry(arr(ev.pais))) return
    await updateComm(ev.id, { ...ev, date: ds })
    toast({ title: t('toast.moved'), variant: 'success' })
    setDragId(null)
  }

  // Day navigation helpers
  function prevDay() { const d = new Date(selectedDay + 'T00:00:00'); d.setDate(d.getDate() - 1); setSelectedDay(dateStr(d)) }
  function nextDay() { const d = new Date(selectedDay + 'T00:00:00'); d.setDate(d.getDate() + 1); setSelectedDay(dateStr(d)) }

  // Swipe
  const touchStartX = useRef(null)
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 40) return
    if (viewMode === 'day') {
      if (dx > 0) prevDay(); else nextDay()
    } else {
      if (dx > 0) setWeekStart(w => addDays(w, -7))
      else        setWeekStart(w => addDays(w, 7))
    }
    touchStartX.current = null
  }

  // Picker month init
  const pickerDate = viewMode === 'day'
    ? new Date(selectedDay + 'T00:00:00')
    : viewMode === 'week'
    ? weekStart
    : new Date(currentMonth.year, currentMonth.month, 1)

  function handlePickerSelect(ds) {
    if (viewMode === 'day') {
      setSelectedDay(ds)
    } else if (viewMode === 'week') {
      setWeekStart(getMonday(new Date(ds + 'T00:00:00')))
    } else {
      const d = new Date(ds + 'T00:00:00')
      setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  function clearAll() {
    setFilters({ pais:[], canal:[], topico:[], segmento:[], estado:[] })
    setSearch('')
    setSearchOpen(false)
  }

  const chColW = isMobile ? 50 : 80
  const hasAnyFilter = activeFilters > 0 || search.trim().length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Toolbar ── */}
      <div className="border-b border-gray-100 bg-white flex-shrink-0">

        {/* Row 1: navigation + view toggle + actions */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Nav */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => { if (viewMode === 'week') setWeekStart(w => addDays(w, -7)); else if (viewMode === 'day') prevDay(); else prevMonth() }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setPickerOpen(o => !o)}
                className={cn('font-semibold text-gray-800 px-1.5 text-center hover:bg-gray-50 rounded-lg transition-colors', isMobile ? 'text-xs min-w-[100px]' : 'text-sm min-w-[200px]')}
              >
                {viewMode === 'week'  ? weekLabel(weekStart, lang, isMobile)
                 : viewMode === 'day' ? dayLabel(selectedDay, lang, isMobile)
                 : `${monthNames[currentMonth.month]} ${currentMonth.year}`}
              </button>
              {pickerOpen && (
                <MiniMonthPicker
                  initYear={pickerDate.getFullYear()} initMonth={pickerDate.getMonth()}
                  today={today} commsPerDay={commsPerDay} lang={lang}
                  onSelectDay={handlePickerSelect} onClose={() => setPickerOpen(false)}
                />
              )}
            </div>
            <button onClick={() => { if (viewMode === 'week') setWeekStart(w => addDays(w, 7)); else if (viewMode === 'day') nextDay(); else nextMonth() }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {((viewMode === 'week' && !isThisWeek) || (viewMode === 'day' && selectedDay !== today)) && (
            <button onClick={() => { if (viewMode === 'week') setWeekStart(getMonday()); else setSelectedDay(today) }} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
              <CalendarDays className="h-3 w-3" />
              {!isMobile && t('calendar.today')}
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Toggle día/semana/mes */}
            <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
              <button onClick={() => setViewMode('day')} className={cn('px-2.5 py-1.5 transition-colors', viewMode === 'day' ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                {isMobile ? '1d' : 'Día'}
              </button>
              <button onClick={() => { setViewMode('week'); if (viewMode === 'day') setWeekStart(getMonday(new Date(selectedDay + 'T00:00:00'))) }} className={cn('px-2.5 py-1.5 transition-colors border-l border-gray-200', viewMode === 'week' ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                {isMobile ? '7d' : 'Semana'}
              </button>
              <button onClick={() => setViewMode('month')} className={cn('px-2.5 py-1.5 transition-colors border-l border-gray-200', viewMode === 'month' ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                Mes
              </button>
            </div>

            {!isMobile && perms.canEdit && (
              <Button size="sm" onClick={() => openNew()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> {t('calendar.new')}
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Search + filter toggle */}
        <div className="flex items-center gap-2 px-3 pb-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSearchOpen(e.target.value.length > 0) }}
              onFocus={() => search.length > 0 && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder={t('calendar.searchPlaceholder')}
              className="w-full pl-8 pr-7 h-8 text-xs border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:border-sky-300 focus:ring-1 focus:ring-sky-200 outline-none transition-all"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSearchOpen(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="h-3 w-3" />
              </button>
            )}
            {/* Search results dropdown */}
            {searchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50">
                <SearchResults
                  results={searchedComms}
                  onSelect={ev => {
                    // Navigate to the week containing this event and open it
                    const evDate = new Date(ev.date + 'T00:00:00')
                    setWeekStart(getMonday(evDate))
                    setViewMode('week')
                    setTimeout(() => openEdit(ev), 50)
                  }}
                  onClose={() => setSearchOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors flex-shrink-0',
              filtersOpen || activeFilters > 0
                ? 'bg-sky-50 border-sky-200 text-sky-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {!isMobile && <span>{t('calendar.filterBtn')}</span>}
            {activeFilters > 0 && (
              <span className="bg-sky-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>
            )}
            <span className="text-[9px] opacity-40">{filtersOpen ? '▴' : '▾'}</span>
          </button>

          {/* Active filter chips summary */}
          {activeFilters > 0 && !isMobile && (
            <div className="flex items-center gap-1 flex-wrap">
              {FILTER_KEYS.flatMap(fd =>
                filters[fd.key].map(v => (
                  <span key={`${fd.key}-${v}`} className="flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {COUNTRY_META[v]?.flag ? `${COUNTRY_META[v].flag} ` : ''}{v}
                    <button onClick={() => setFilters(f => ({ ...f, [fd.key]: f[fd.key].filter(x => x !== v) }))} className="hover:text-sky-900">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {hasAnyFilter && (
            <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5 flex-shrink-0 ml-auto">
              <X className="h-2.5 w-2.5" /> {t('filter.clear')}
            </button>
          )}
        </div>

        {/* Expandable chip filter panel */}
        {filtersOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-2">
            <FilterRow
              label="País" options={paiOptions} value={filters.pais}
              onChange={v => setFilters(f => ({ ...f, pais: v }))}
              renderChip={p => `${COUNTRY_META[p]?.flag ?? ''} ${COUNTRY_META[p]?.name ?? p}`}
            />
            <FilterRow label="Canal"    options={canalOptions}   value={filters.canal}    onChange={v => setFilters(f => ({ ...f, canal: v }))} />
            <FilterRow label="Estado"   options={estadoOptions}  value={filters.estado}   onChange={v => setFilters(f => ({ ...f, estado: v }))} />
            <FilterRow label="Tópico"   options={topicoOptions}  value={filters.topico}   onChange={v => setFilters(f => ({ ...f, topico: v }))} />
            <FilterRow label="Segmento" options={segOptions}     value={filters.segmento} onChange={v => setFilters(f => ({ ...f, segmento: v }))} />
          </div>
        )}
      </div>


      {/* ── Calendar content ── */}
      <div className="flex-1 overflow-hidden" onTouchStart={viewMode !== 'month' ? onTouchStart : undefined} onTouchEnd={viewMode !== 'month' ? onTouchEnd : undefined}>
        {viewMode === 'day' ? (
          <DayView
            comms={dayFiltered} dayStr={selectedDay} today={today}
            onEventClick={openEdit} canEdit={perms.canEdit}
            onAdd={ds => openNew('', ds)} statusT={s => t(`status.${s}`, s)}
          />
        ) : viewMode === 'week' ? (
          <div className="h-full overflow-auto">
            <table className="border-collapse" style={{ minWidth: isMobile ? '100%' : 480, width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: chColW, minWidth: chColW }} />
                {visWeekDays.map((_, i) => <col key={i} />)}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="border-b border-r border-gray-100 bg-gray-50/40 px-1 py-2" />
                  {visWeekDays.map(d => {
                    const ds   = dateStr(d)
                    const dow  = d.getDay()
                    const isWE = dow === 0 || dow === 6
                    const isTod = ds === today
                    return (
                      <th key={ds} className={cn('border-b border-r border-gray-100 px-1 py-2 text-center font-normal', isWE ? 'bg-gray-50/60' : 'bg-white', isTod ? '!bg-sky-50 !border-b-2 !border-b-sky-400' : '')}>
                        <div className={cn('text-[10px] uppercase tracking-widest mb-0.5', isTod ? 'text-sky-500 font-bold' : 'text-gray-400')}>{dowLabels[dow]}</div>
                        <div className={cn('font-bold mx-auto rounded-full flex items-center justify-center', isMobile ? 'text-xs w-6 h-6' : 'text-sm w-7 h-7', isTod ? 'bg-sky-500 text-white' : isWE ? 'text-gray-300' : 'text-gray-800')}>
                          {d.getDate()}
                        </div>
                        {satByDate[ds] && (
                          <div
                            className="flex items-center justify-center gap-px mt-0.5"
                            title={satByDate[ds].map(c => `${c.flag} ${c.name}: ${c.n} comms`).join(' · ')}
                          >
                            <span className="text-[11px] leading-none">🚩</span>
                            {!isMobile && (
                              <span className="text-[9px] text-red-400 leading-none">
                                {satByDate[ds].map(c => c.flag).join('')}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={visWeekDays.length + 1} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/70 border-y border-gray-100">{t('calendar.internalChannels')}</td></tr>
                {internalCh.filter(ch => visChannels.includes(ch)).map(ch => (
                  <WeekChannelRow key={ch} channel={ch} days={visWeekDays} today={today} byDate={byDate} canEdit={perms.canEdit} canEditCountry={canEditCountry} onClickCard={openEdit} onAdd={(ch, ds) => openNew(ch, ds)} onDragStart={id => setDragId(id)} onDrop={handleWeekDrop} statusT={s => t(`status.${s}`, s)} compact={isMobile} />
                ))}
                <tr><td colSpan={visWeekDays.length + 1} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/70 border-y border-gray-100">{t('calendar.externalChannels')}</td></tr>
                {externalCh.filter(ch => visChannels.includes(ch)).map(ch => (
                  <WeekChannelRow key={ch} channel={ch} days={visWeekDays} today={today} byDate={byDate} canEdit={perms.canEdit} canEditCountry={canEditCountry} onClickCard={openEdit} onAdd={(ch, ds) => openNew(ch, ds)} onDragStart={id => setDragId(id)} onDrop={handleWeekDrop} statusT={s => t(`status.${s}`, s)} compact={isMobile} />
                ))}
              </tbody>
            </table>

            {/* Search highlight banner */}
            {search.trim() && (
              <div className="px-4 py-2 text-xs text-sky-600 bg-sky-50 border-t border-sky-100">
                {t('calendar.showingResults', { count: weekFiltered.length, search })}
              </div>
            )}

            {!isMobile && (
              <div className="flex flex-wrap gap-3 px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
                {allChannels.map(ch => (
                  <span key={ch} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_META[ch]?.color ?? '#ccc' }} />
                    <span className="text-gray-500">{ch}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MonthView
            year={currentMonth.year} month={currentMonth.month}
            communications={searchedComms} filters={filters} today={today} lang={lang}
            canEdit={perms.canEdit} onClickCard={openEdit} onAdd={ds => openNew('', ds)}
            onDragStart={id => setDragId(id)} onDrop={handleMonthDrop}
          />
        )}
      </div>

      {/* FAB mobile */}
      {isMobile && perms.canEdit && (
        <button
          onClick={() => openNew()}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      <CommModal open={modal.open} initial={modal.initial} onClose={() => setModal({ open: false, initial: null })} />
    </div>
  )
}
