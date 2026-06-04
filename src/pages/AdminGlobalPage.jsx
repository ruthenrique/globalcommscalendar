import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { SlidersHorizontal, X, TrendingUp, TrendingDown, Star, FileText, CheckCircle2, Minus } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { COUNTRY_META, CHANNEL_META, STATUS_META, FORMAT_ICON } from '@/lib/constants'
import { arr, dateStr } from '@/lib/utils'

const PASTEL = ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EC4899','#D85A30','#639922','#378ADD','#06B6D4','#F97316']
const DOW_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ── Filter row (inline chips, no dropdown) ────────────────
function FilterRow({ label, options, value, onChange, renderChip }) {
  if (!options.length) return null
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 w-14 flex-shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const sel = value.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onChange(sel ? value.filter(v => v !== opt) : [...value, opt])}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all font-medium ${
                sel
                  ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {renderChip ? renderChip(opt) : opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────
function KPI({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 opacity-40" style={{ color }} />}
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Insight card ──────────────────────────────────────────
function Insight({ emoji, fact, label, color, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-1 hover:shadow-sm transition-shadow">
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className="text-sm font-bold text-gray-800 leading-tight">{fact}</div>
      <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : 'Sin cambio'} vs mes anterior
        </div>
      )}
    </div>
  )
}

// ── Activity heatmap ──────────────────────────────────────
function ActivityHeatmap({ communications }) {
  const today = new Date()
  const WEEKS = 18
  const counts = {}
  communications.forEach(c => { if (c.date) counts[c.date] = (counts[c.date] ?? 0) + 1 })
  const maxCount = Math.max(...Object.values(counts), 1)

  const start = new Date(today)
  start.setDate(start.getDate() - WEEKS * 7 + 1)
  const dow = start.getDay()
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))

  const weeks = []
  const cur = new Date(start)
  for (let w = 0; w < WEEKS; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const ds = dateStr(cur)
      week.push({ date: ds, count: counts[ds] ?? 0, isFuture: cur > today })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }

  function cellColor(count, isFuture) {
    if (isFuture || count === 0) return '#F1F5F9'
    const t = count / maxCount
    if (t < 0.25) return '#BAE6FD'
    if (t < 0.5)  return '#7DD3FC'
    if (t < 0.75) return '#38BDF8'
    return '#0EA5E9'
  }

  const monthLabels = weeks.map((week, wi) => {
    const d = new Date(week[0].date)
    return d.getDate() <= 7 ? { wi, label: MONTHS[d.getMonth()] } : null
  }).filter(Boolean)

  const DOW_SHORT = ['L','','M','','J','','S']

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ paddingTop: 18 }}>
        <div className="absolute top-0 left-8 flex" style={{ gap: 4 }}>
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.wi === wi)
            return <div key={wi} className="w-3 flex-shrink-0 text-[9px] text-gray-300">{ml?.label ?? ''}</div>
          })}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1">
            {DOW_SHORT.map((d, i) => (
              <div key={i} className="w-4 h-3 flex items-center justify-end pr-1">
                <span className="text-[9px] text-gray-300">{d}</span>
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(({ date, count, isFuture }) => (
                <div
                  key={date}
                  title={count > 0 ? `${date}: ${count} comm${count !== 1 ? 's' : ''}` : date}
                  className="w-3 h-3 rounded-sm cursor-default"
                  style={{ background: cellColor(count, isFuture) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end">
          <span className="text-[9px] text-gray-300 mr-0.5">Menos</span>
          {['#F1F5F9','#BAE6FD','#7DD3FC','#38BDF8','#0EA5E9'].map(c => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[9px] text-gray-300 ml-0.5">Más</span>
        </div>
      </div>
    </div>
  )
}

// ── Topic cloud ───────────────────────────────────────────
function TopicCloud({ communications }) {
  const topics = useMemo(() => {
    const counts = {}
    communications.forEach(c => arr(c.topico).forEach(t => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ name, count, color: PASTEL[i % PASTEL.length] }))
  }, [communications])
  const max = Math.max(...topics.map(t => t.count), 1)
  if (!topics.length) return <p className="text-xs text-gray-400 py-4 text-center">Sin datos</p>
  return (
    <div className="flex flex-wrap gap-2">
      {topics.map(({ name, count, color }) => {
        const size = 0.7 + (count / max) * 0.45
        return (
          <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium"
            style={{ background: color + '15', borderColor: color + '40', color, fontSize: `${Math.round(size * 11)}px` }}>
            {name}
            <span className="text-[9px] font-bold rounded-full px-1 min-w-[16px] text-center" style={{ background: color + '25' }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Format breakdown ──────────────────────────────────────
function FormatBreakdown({ communications }) {
  const data = useMemo(() => {
    const counts = {}
    communications.forEach(c => arr(c.formato).forEach(f => { if (f) counts[f] = (counts[f] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [communications])
  const max = Math.max(...data.map(d => d[1]), 1)
  if (!data.length) return <p className="text-xs text-gray-400 py-4 text-center">Sin datos</p>
  return (
    <div className="space-y-2.5">
      {data.map(([fmt, count]) => (
        <div key={fmt} className="flex items-center gap-2">
          <span className="text-base w-5 flex-shrink-0">{FORMAT_ICON[fmt] ?? '📄'}</span>
          <span className="text-xs text-gray-600 w-20 truncate flex-shrink-0">{fmt}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round(count / max * 100)}%`, background: '#0EA5E9' }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-5 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Status funnel ─────────────────────────────────────────
function StatusFunnel({ communications }) {
  const STAGES = ['Borrador','En revisión','Aprobado','Publicado']
  const data = STAGES.map(s => ({
    name: s, count: communications.filter(c => arr(c.estado).includes(s)).length,
    color: STATUS_META[s]?.dot ?? '#888', bg: STATUS_META[s]?.bg ?? '#f5f5f5',
  }))
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-2 justify-between h-28">
      {data.map(stage => {
        const h = Math.max(16, Math.round((stage.count / max) * 96))
        return (
          <div key={stage.name} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: stage.color }}>{stage.count}</span>
            <div className="w-full rounded-t-lg" style={{ height: h, background: stage.bg, borderTop: `2px solid ${stage.color}50` }} />
            <span className="text-[9px] text-gray-400 font-medium text-center leading-tight">{stage.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Channel tooltip ───────────────────────────────────────
function ChannelTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <span className="font-semibold text-gray-700">{payload[0].name}</span>
      <span className="ml-2 text-gray-400">{payload[0].value}</span>
    </div>
  )
}

// ── Section title ─────────────────────────────────────────
function STitle({ children, sub }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</div>
      {sub && <div className="text-[10px] text-gray-300 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────
export default function AdminGlobalPage() {
  const { communications, countries, channels } = useApp()
  const { role, myCountries } = useAuth()

  // Role-based: country_admin sees only their countries (locked)
  const isRestricted = (role === 'country_admin' || role === 'viewer') && myCountries.length > 0
  const lockedCountries = isRestricted ? myCountries : []

  const [filters, setFilters] = useState({ pais: [], canal: [], topico: [], estado: [], formato: [] })
  const [filtersOpen, setFiltersOpen] = useState(false)
  function setF(key) { return v => setFilters(f => ({ ...f, [key]: v })) }

  // Effective country filter = locked countries (if restricted) OR user's chosen filter
  const effectivePais = isRestricted ? lockedCountries : filters.pais
  const activeUserFilters = (isRestricted ? 0 : filters.pais.length) +
    filters.canal.length + filters.topico.length + filters.estado.length + filters.formato.length

  // Filter options
  const countryList = countries.length > 0 ? countries : Object.entries(COUNTRY_META).map(([code, m]) => ({ code, ...m }))
  const channelList = channels.length > 0 ? channels : Object.keys(CHANNEL_META).map(k => ({ name: k, color: CHANNEL_META[k].color }))
  const paiOptions    = useMemo(() => [...new Set(communications.flatMap(c => arr(c.pais)))].sort(),    [communications])
  const canalOptions  = useMemo(() => [...new Set(communications.flatMap(c => arr(c.canal)))].sort(),   [communications])
  const topicoOptions = useMemo(() => [...new Set(communications.flatMap(c => arr(c.topico)))].sort(),  [communications])
  const estadoOptions = ['Aprobado','En revisión','Borrador','Publicado','Cancelado']
  const formatoOptions= useMemo(() => [...new Set(communications.flatMap(c => arr(c.formato)).filter(Boolean))].sort(), [communications])

  // Filtered data
  const filtered = useMemo(() =>
    communications.filter(c =>
      (effectivePais.length   === 0 || arr(c.pais).some(p  => effectivePais.includes(p)))   &&
      (filters.canal.length   === 0 || arr(c.canal).some(ch => filters.canal.includes(ch)))  &&
      (filters.topico.length  === 0 || arr(c.topico).some(t  => filters.topico.includes(t))) &&
      (filters.estado.length  === 0 || arr(c.estado).some(e  => filters.estado.includes(e))) &&
      (filters.formato.length === 0 || arr(c.formato).some(f => filters.formato.includes(f)))
    ),
    [communications, effectivePais, filters]
  )

  const total     = filtered.length
  const allTotal  = communications.length
  const approved  = filtered.filter(c => arr(c.estado).includes('Aprobado')).length
  const published = filtered.filter(c => arr(c.estado).includes('Publicado')).length
  const drafts    = filtered.filter(c => arr(c.estado).includes('Borrador')).length
  const featured  = filtered.filter(c => c.destacado).length

  // ── Qualitative insights ─────────────────────────────
  const insights = useMemo(() => {
    const thisMonthStr = new Date().toISOString().slice(0, 7)
    const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonthStr = prevDate.toISOString().slice(0, 7)

    const thisMonthComms = filtered.filter(c => c.date?.startsWith(thisMonthStr))
    const prevMonthComms = filtered.filter(c => c.date?.startsWith(prevMonthStr))
    const trendPct = prevMonthComms.length > 0
      ? Math.round((thisMonthComms.length - prevMonthComms.length) / prevMonthComms.length * 100)
      : null

    // Best day of week
    const dowCounts = [0,0,0,0,0,0,0]
    filtered.forEach(c => { const d = new Date(c.date); if (!isNaN(d)) dowCounts[d.getDay()]++ })
    const bestDow = dowCounts.indexOf(Math.max(...dowCounts))

    // Top topic this month
    const topicCounts = {}
    thisMonthComms.forEach(c => arr(c.topico).forEach(t => { topicCounts[t] = (topicCounts[t] ?? 0) + 1 }))
    const topTopic = Object.entries(topicCounts).sort((a,b) => b[1]-a[1])[0]

    // Top channel
    const chCounts = {}
    filtered.forEach(c => arr(c.canal).forEach(ch => { chCounts[ch] = (chCounts[ch] ?? 0) + 1 }))
    const topCh = Object.entries(chCounts).sort((a,b) => b[1]-a[1])[0]
    const topChPct = topCh && total > 0 ? Math.round(topCh[1] / total * 100) : 0

    // Global vs local
    const globalN = filtered.filter(c => arr(c.alcance).includes('Global')).length
    const globalPct = total > 0 ? Math.round(globalN / total * 100) : 0

    // Approval rate (approved + published out of all non-cancelled)
    const nonCancelled = filtered.filter(c => !arr(c.estado).includes('Cancelado')).length
    const approvedRate = nonCancelled > 0 ? Math.round((approved + published) / nonCancelled * 100) : 0

    // Countries without content
    const activePaises = new Set(filtered.flatMap(c => arr(c.pais)))
    const visible = isRestricted ? lockedCountries : paiOptions
    const inactiveCount = visible.filter(p => !activePaises.has(p)).length

    // Top segment
    const segCounts = {}
    filtered.forEach(c => arr(c.segmento).forEach(s => { if (s) segCounts[s] = (segCounts[s] ?? 0) + 1 }))
    const topSeg = Object.entries(segCounts).sort((a,b) => b[1]-a[1])[0]

    return { bestDow, topTopic, topCh, topChPct, globalPct, approvedRate, inactiveCount, topSeg, trendPct, thisMonthCount: thisMonthComms.length }
  }, [filtered, isRestricted, lockedCountries, paiOptions, total, approved, published])

  // Monthly trend (area chart)
  const byMonth = useMemo(() => {
    const year = new Date().getFullYear()
    return Array.from({ length: 12 }, (_, i) => ({
      name: MONTHS[i],
      total: filtered.filter(c => c.date?.startsWith(`${year}-${String(i + 1).padStart(2, '0')}`)).length,
    }))
  }, [filtered])

  // Channel donut
  const channelData = useMemo(() =>
    channelList
      .map(ch => ({ name: ch.name, value: filtered.filter(ev => arr(ev.canal).includes(ch.name)).length, color: ch.color ?? CHANNEL_META[ch.name]?.color ?? '#ccc' }))
      .filter(c => c.value > 0).sort((a, b) => b.value - a.value),
    [filtered, channelList]
  )

  // Country bars
  const countryData = useMemo(() =>
    countryList
      .map(c => ({ ...c, count: filtered.filter(ev => arr(ev.pais).includes(c.code)).length }))
      .filter(c => c.count > 0).sort((a, b) => b.count - a.count),
    [filtered, countryList]
  )
  const maxCountry = Math.max(...countryData.map(c => c.count), 1)

  // ── Render ────────────────────────────────────────────

  // Active filter chips (non-locked)
  const activeChips = [
    ...(!isRestricted ? filters.pais.map(v => ({ key: 'pais', v, label: `${COUNTRY_META[v]?.flag ?? ''} ${COUNTRY_META[v]?.name ?? v}` })) : []),
    ...filters.canal.map(v  => ({ key: 'canal', v, label: v })),
    ...filters.topico.map(v => ({ key: 'topico', v, label: v })),
    ...filters.estado.map(v => ({ key: 'estado', v, label: v })),
    ...filters.formato.map(v=> ({ key: 'formato', v, label: `${FORMAT_ICON[v] ?? ''} ${v}` })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/30">

      {/* ── Filter header ── */}
      <div className="border-b border-gray-100 bg-white flex-shrink-0">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 flex-wrap">

          {/* Restricted badge or filter toggle */}
          {isRestricted ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">Vista</span>
              {lockedCountries.map(code => (
                <span key={code} className="flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {COUNTRY_META[code]?.flag} {COUNTRY_META[code]?.name ?? code}
                </span>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filtersOpen || activeUserFilters > 0
                  ? 'bg-sky-50 border-sky-200 text-sky-700 font-semibold'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filtrar
              {activeUserFilters > 0 && (
                <span className="bg-sky-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeUserFilters}</span>
              )}
              <span className="text-[9px] opacity-40">{filtersOpen ? '▴' : '▾'}</span>
            </button>
          )}

          {/* Active filter chips */}
          {activeChips.map(chip => (
            <span key={`${chip.key}-${chip.v}`} className="flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium px-2 py-1 rounded-full">
              {chip.label}
              <button onClick={() => setF(chip.key)(filters[chip.key].filter(x => x !== chip.v))} className="hover:text-sky-900 ml-0.5">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {activeUserFilters > 0 && (
            <button
              onClick={() => setFilters({ pais:[], canal:[], topico:[], estado:[], formato:[] })}
              className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5"
            >
              <X className="h-2.5 w-2.5" /> Limpiar
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {activeUserFilters > 0 || isRestricted
              ? <><span className="font-semibold text-gray-700">{total}</span> / {allTotal}</>
              : <span className="font-semibold text-gray-700">{allTotal}</span>
            } {' '}comunicaciones
          </span>
        </div>

        {/* Expanded filter panel */}
        {filtersOpen && !isRestricted && (
          <div className="px-5 pb-3 pt-1 border-t border-gray-50 space-y-0.5">
            <FilterRow label="País"    options={paiOptions}     value={filters.pais}    onChange={setF('pais')}    renderChip={p => `${COUNTRY_META[p]?.flag ?? ''} ${COUNTRY_META[p]?.name ?? p}`} />
            <FilterRow label="Canal"   options={canalOptions}   value={filters.canal}   onChange={setF('canal')}   />
            <FilterRow label="Estado"  options={estadoOptions}  value={filters.estado}  onChange={setF('estado')}  />
            <FilterRow label="Formato" options={formatoOptions} value={filters.formato} onChange={setF('formato')} renderChip={f => `${FORMAT_ICON[f] ?? '📄'} ${f}`} />
            <FilterRow label="Tópico"  options={topicoOptions}  value={filters.topico}  onChange={setF('topico')}  />
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <KPI label="Total"      value={total}    color="#0EA5E9" icon={FileText}     sub={activeUserFilters > 0 || isRestricted ? `de ${allTotal}` : 'comunicaciones'} />
          <KPI label="Aprobadas"  value={approved}  color="#10B981" icon={CheckCircle2} sub={total ? `${Math.round(approved / total * 100)}% del total` : '—'} />
          <KPI label="Publicadas" value={published} color="#185FA5" icon={TrendingUp}   sub={total ? `${Math.round(published / total * 100)}% del total` : '—'} />
          <KPI label="Destacadas" value={featured}  color="#F59E0B" icon={Star}         sub="contenido destacado" />
          <KPI label="Borradores" value={drafts}    color="#94A3B8" icon={FileText}     sub={total ? `${Math.round(drafts / total * 100)}% del total` : '—'} />
        </div>

        {/* Insights cualitativos */}
        <div className="grid grid-cols-4 gap-3">
          <Insight
            emoji="📅"
            fact={DOW_NAMES[insights.bestDow] ?? '—'}
            label="día más activo de la semana"
          />
          <Insight
            emoji="🏆"
            fact={insights.topTopic ? `${insights.topTopic[0]} (${insights.topTopic[1]})` : '—'}
            label={`tópico líder en ${MONTHS[new Date().getMonth()]}`}
            trend={insights.trendPct}
          />
          <Insight
            emoji="📡"
            fact={insights.topCh ? `${insights.topCh[0]}` : '—'}
            label={insights.topCh ? `concentra el ${insights.topChPct}% del contenido` : 'canal más usado'}
          />
          <Insight
            emoji="✅"
            fact={`${insights.approvedRate}%`}
            label="tasa de aprobación (aprobado + publicado)"
          />
          <Insight
            emoji="🌍"
            fact={`${insights.globalPct}% Global`}
            label={`${100 - insights.globalPct}% contenido local`}
          />
          {insights.topSeg && (
            <Insight
              emoji="👥"
              fact={insights.topSeg[0]}
              label={`segmento más alcanzado (${insights.topSeg[1]} comms)`}
            />
          )}
          {insights.inactiveCount > 0 && (
            <Insight
              emoji="⚠️"
              fact={`${insights.inactiveCount} ${insights.inactiveCount === 1 ? 'país' : 'países'}`}
              label="sin comunicaciones en el período"
            />
          )}
          <Insight
            emoji="📝"
            fact={`${insights.thisMonthCount}`}
            label={`comms este mes (${MONTHS[new Date().getMonth()]})`}
            trend={insights.trendPct}
          />
        </div>

        {/* Tendencia + Canal donut */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-4">
            <STitle sub={`Año ${new Date().getFullYear()}`}>Tendencia mensual</STitle>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={byMonth} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="total" stroke="#0EA5E9" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#0EA5E9' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <STitle>Mix de canales</STitle>
            <div className="flex flex-col items-center gap-2">
              <PieChart width={110} height={110}>
                <Pie data={channelData} dataKey="value" cx={50} cy={50} innerRadius={24} outerRadius={48} strokeWidth={0}>
                  {channelData.map(c => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip content={<ChannelTooltip />} />
              </PieChart>
              <div className="space-y-1.5 w-full">
                {channelData.map(c => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-gray-500 truncate flex-1">{c.name}</span>
                    <span className="font-semibold text-gray-700">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <STitle sub="Frecuencia de publicación — últimas 18 semanas">Actividad</STitle>
          <ActivityHeatmap communications={filtered} />
        </div>

        {/* Tópicos + Formatos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-4">
            <STitle sub="Distribución por tema">Tópicos</STitle>
            <TopicCloud communications={filtered} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <STitle sub="Tipo de piezas">Formatos</STitle>
            <FormatBreakdown communications={filtered} />
          </div>
        </div>

        {/* Estado funnel + Por país */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <STitle sub="Pipeline de aprobación">Estado</STitle>
            <StatusFunnel communications={filtered} />
          </div>
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-4">
            <STitle sub="Volumen por unidad">Por país</STitle>
            <div className="space-y-2.5">
              {countryData.map(c => {
                const color = c.color ?? COUNTRY_META[c.code]?.color ?? '#888'
                const flag  = c.flag  ?? COUNTRY_META[c.code]?.flag  ?? ''
                return (
                  <div key={c.code} className="flex items-center gap-3">
                    <span className="text-sm w-5 flex-shrink-0 text-center">{flag}</span>
                    <span className="text-xs text-gray-600 w-20 truncate flex-shrink-0">{c.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(c.count / maxCountry * 100)}%`, background: color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{c.count}</span>
                  </div>
                )
              })}
              {!countryData.length && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
            </div>
          </div>
        </div>

        {/* Matriz país × canal */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <STitle sub="Combinación de alcance y canal">Matriz país × canal</STitle>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr>
                  <th className="px-3 py-1.5 text-left text-gray-400 font-normal w-28" />
                  {channelList.map(ch => (
                    <th key={ch.name} className="px-2 py-1.5 text-gray-400 font-normal text-center whitespace-nowrap">{ch.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countryList.map(c => {
                  const row = channelList.map(ch =>
                    filtered.filter(ev => arr(ev.pais).includes(c.code) && arr(ev.canal).includes(ch.name)).length
                  )
                  if (row.every(n => n === 0)) return null
                  return (
                    <tr key={c.code} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 font-medium text-gray-700">
                        {c.flag ?? COUNTRY_META[c.code]?.flag} {c.name}
                      </td>
                      {row.map((n, i) => (
                        <td key={i} className="px-2 py-1.5 text-center">
                          {n > 0 ? (
                            <span className="inline-block min-w-[24px] px-1.5 py-0.5 rounded-lg text-xs font-semibold"
                              style={{ background: n > 10 ? '#DCFCE7' : n > 5 ? '#FEF3C7' : '#E0F2FE', color: n > 10 ? '#166534' : n > 5 ? '#92400E' : '#0369A1' }}>
                              {n}
                            </span>
                          ) : <span className="text-gray-200">—</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
