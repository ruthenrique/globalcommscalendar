import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApp } from '@/contexts/AppContext'
import { COUNTRY_META, CHANNEL_META, STATUS_META } from '@/lib/constants'
import { arr } from '@/lib/utils'

const COLORS = ['#534AB7','#1D9E75','#D85A30','#BA7517','#185FA5','#993556','#639922','#378ADD']

function KPI({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function HBar({ label, value, max, color, flag }) {
  const pct = max ? Math.round(value / max * 100) : 0
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-muted-foreground w-28 text-right truncate shrink-0">{flag && `${flag} `}{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { communications } = useApp()
  const total = communications.length || 1

  const byCountry = useMemo(() =>
    Object.entries(COUNTRY_META).map(([code, m]) => ({
      code, name: m.name, flag: m.flag, color: m.color,
      count: communications.filter(c => arr(c.pais).includes(code)).length,
    })).sort((a, b) => b.count - a.count)
  , [communications])

  const byChannel = useMemo(() =>
    Object.keys(CHANNEL_META).map(ch => ({
      name: ch, color: CHANNEL_META[ch].color,
      count: communications.filter(c => arr(c.canal).includes(ch)).length,
    })).sort((a, b) => b.count - a.count)
  , [communications])

  const byStatus = useMemo(() =>
    Object.keys(STATUS_META).map(s => ({
      name: s, color: STATUS_META[s].dot,
      count: communications.filter(c => arr(c.estado).includes(s)).length,
    })).filter(s => s.count > 0)
  , [communications])

  const byMonth = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i],
      count: communications.filter(c => c.date?.startsWith(`2026-${String(i+1).padStart(2,'0')}`)).length,
    }))
    return months
  }, [communications])

  const byTopic = useMemo(() => {
    const topics = {}
    communications.forEach(c => arr(c.topico).forEach(t => { topics[t] = (topics[t] ?? 0) + 1 }))
    return Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count], i) => ({ name, count, color: COLORS[i % COLORS.length] }))
  }, [communications])

  const global = communications.filter(c => arr(c.alcance).includes('Global')).length
  const approved = communications.filter(c => arr(c.estado).includes('Aprobado')).length
  const highlighted = communications.filter(c => c.destacado).length

  const maxCountry = Math.max(...byCountry.map(c => c.count), 1)
  const maxChannel = Math.max(...byChannel.map(c => c.count), 1)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total comunicaciones" value={communications.length} color="#534AB7" />
        <KPI label="Aprobadas" value={approved} sub={`${Math.round(approved/total*100)}%`} color="#1D9E75" />
        <KPI label="Globales" value={global} sub={`${Math.round(global/total*100)}%`} color="#185FA5" />
        <KPI label="Destacadas" value={highlighted} sub={`${Math.round(highlighted/total*100)}%`} color="#BA7517" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By Month */}
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por mes</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#534AB7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por estado</div>
          <div className="flex items-center justify-center gap-4">
            <PieChart width={140} height={140}>
              <Pie data={byStatus} dataKey="count" cx={65} cy={65} innerRadius={35} outerRadius={60}>
                {byStatus.map((s, i) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-1.5">
              {byStatus.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold ml-auto pl-3">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By Country */}
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por país</div>
          {byCountry.filter(c => c.count > 0).map(c => (
            <HBar key={c.code} label={c.name} value={c.count} max={maxCountry} color={c.color} flag={c.flag} />
          ))}
        </div>

        {/* By Channel */}
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por canal</div>
          {byChannel.filter(c => c.count > 0).map(c => (
            <HBar key={c.name} label={c.name} value={c.count} max={maxChannel} color={c.color} />
          ))}
        </div>
      </div>

      {/* By Topic */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por tópico (top 8)</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={byTopic} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {byTopic.map((t, i) => <Cell key={t.name} fill={t.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
