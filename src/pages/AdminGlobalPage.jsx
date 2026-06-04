import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useApp } from '@/contexts/AppContext'
import { COUNTRY_META, CHANNEL_META, STATUS_META } from '@/lib/constants'
import { arr } from '@/lib/utils'

const COLORS = ['#534AB7','#1D9E75','#D85A30','#BA7517','#185FA5','#993556','#639922','#378ADD']

// ── Shared sub-components ─────────────────────────────
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
      <span className="text-xs text-muted-foreground w-32 text-right truncate shrink-0">{flag && `${flag} `}{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────
export default function AdminGlobalPage() {
  const { communications, countries, channels } = useApp()
  const total = communications.length || 1

  const countryList = countries.length > 0
    ? countries
    : Object.entries(COUNTRY_META).map(([code, m]) => ({ code, ...m }))

  const channelList = channels.length > 0
    ? channels
    : Object.keys(CHANNEL_META).map(k => ({ name: k, color: CHANNEL_META[k].color, type: CHANNEL_META[k].type }))

  // KPI stats
  const approved    = communications.filter(c => arr(c.estado).includes('Aprobado')).length
  const published   = communications.filter(c => arr(c.estado).includes('Publicado')).length
  const inReview    = communications.filter(c => arr(c.estado).includes('En revisión')).length
  const highlighted = communications.filter(c => c.destacado).length

  // By month (current year)
  const byMonth = useMemo(() => {
    const year = new Date().getFullYear()
    return Array.from({ length: 12 }, (_, i) => ({
      name: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i],
      count: communications.filter(c => c.date?.startsWith(`${year}-${String(i + 1).padStart(2, '0')}`)).length,
    }))
  }, [communications])

  // By status
  const byStatus = useMemo(() =>
    Object.keys(STATUS_META).map(s => ({
      name: s, color: STATUS_META[s].dot,
      count: communications.filter(c => arr(c.estado).includes(s)).length,
    })).filter(s => s.count > 0),
    [communications]
  )

  // By country
  const byCountry = useMemo(() =>
    countryList.map(c => ({
      ...c,
      count: communications.filter(ev => arr(ev.pais).includes(c.code)).length,
    })).sort((a, b) => b.count - a.count),
    [communications, countryList]
  )
  const maxCountry = Math.max(...byCountry.map(c => c.count), 1)

  // By channel
  const byChannel = useMemo(() =>
    channelList.map(ch => ({
      ...ch,
      count: communications.filter(ev => arr(ev.canal).includes(ch.name)).length,
    })).sort((a, b) => b.count - a.count),
    [communications, channelList]
  )
  const maxChannel = Math.max(...byChannel.map(c => c.count), 1)

  // By topic
  const byTopic = useMemo(() => {
    const topics = {}
    communications.forEach(c => arr(c.topico).forEach(t => { topics[t] = (topics[t] ?? 0) + 1 }))
    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], i) => ({ name, count, color: COLORS[i % COLORS.length] }))
  }, [communications])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total comunicaciones" value={total}       color="#534AB7" />
        <KPI label="Aprobadas"            value={approved}    sub={`${Math.round(approved / total * 100)}%`}   color="#1D9E75" />
        <KPI label="Publicadas"           value={published}   sub={`${Math.round(published / total * 100)}%`}  color="#185FA5" />
        <KPI label="En revisión"          value={inReview}    sub={`${Math.round(inReview / total * 100)}%`}   color="#BA7517" />
      </div>

      {/* ── Tendencia + Estado ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border p-4">
          <SectionTitle>Tendencia mensual {new Date().getFullYear()}</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#534AB7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <SectionTitle>Por estado</SectionTitle>
          <div className="flex flex-col items-center gap-3">
            <PieChart width={120} height={120}>
              <Pie data={byStatus} dataKey="count" cx={55} cy={55} innerRadius={28} outerRadius={52}>
                {byStatus.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-1.5 w-full">
              {byStatus.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground truncate">{s.name}</span>
                  <span className="font-semibold ml-auto">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── País + Canal ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <SectionTitle>Por país / unidad</SectionTitle>
          {byCountry.filter(c => c.count > 0).map(c => (
            <HBar key={c.code} label={c.name} value={c.count} max={maxCountry} color={c.color ?? COUNTRY_META[c.code]?.color} flag={c.flag ?? COUNTRY_META[c.code]?.flag} />
          ))}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <SectionTitle>Por canal</SectionTitle>
          {byChannel.filter(c => c.count > 0).map(c => (
            <HBar key={c.name} label={c.name} value={c.count} max={maxChannel} color={c.color ?? CHANNEL_META[c.name]?.color} />
          ))}
        </div>
      </div>

      {/* ── Tópicos ── */}
      {byTopic.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <SectionTitle>Por tópico (top 8)</SectionTitle>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={byTopic} layout="vertical" margin={{ top: 0, right: 20, left: 70, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {byTopic.map(t => <Cell key={t.name} fill={t.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Country cards ── */}
      <div>
        <SectionTitle>Vista global por unidad</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {byCountry.map(c => {
            const color = c.color ?? COUNTRY_META[c.code]?.color ?? '#888'
            const flag  = c.flag  ?? COUNTRY_META[c.code]?.flag  ?? ''
            const pct   = Math.round(c.count / total * 100)
            return (
              <div key={c.code} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{flag}</span>
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.code}</div>
                  </div>
                  <span className="ml-auto text-2xl font-semibold" style={{ color }}>{c.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{pct}% del total</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── País × Canal matrix ── */}
      <div className="bg-white rounded-xl border p-4">
        <SectionTitle>Matriz país × canal</SectionTitle>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-left text-muted-foreground w-28">País</th>
                {channelList.map(ch => (
                  <th key={ch.name} className="px-2 py-1.5 text-muted-foreground font-normal text-center whitespace-nowrap">{ch.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byCountry.map(c => (
                <tr key={c.code} className="border-t border-border">
                  <td className="px-3 py-1.5 font-medium">
                    {c.flag ?? COUNTRY_META[c.code]?.flag} {c.name}
                  </td>
                  {channelList.map(ch => {
                    const n = communications.filter(ev =>
                      arr(ev.pais).includes(c.code) && arr(ev.canal).includes(ch.name)
                    ).length
                    return (
                      <td key={ch.name} className="px-2 py-1.5 text-center">
                        {n > 0 ? (
                          <span
                            className="inline-block min-w-[24px] px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{
                              background: n > 10 ? '#EAF3DE' : n > 5 ? '#FAEEDA' : '#E6F1FB',
                              color:      n > 10 ? '#27500A' : n > 5 ? '#633806' : '#185FA5',
                            }}
                          >
                            {n}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
