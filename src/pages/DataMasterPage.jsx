import { useState, useMemo } from 'react'
import { Search, Plus, Edit2, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/layout/Toaster'
import CommModal from '@/components/CommModal'
import { arr, formatDate, formatDateTime } from '@/lib/utils'
import { COUNTRY_META, STATUS_META, FORMAT_ICON } from '@/lib/constants'

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? {}
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ background: meta.bg ?? '#f5f5f5', color: meta.color ?? '#666' }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot ?? '#aaa' }} />
      {status}
    </span>
  )
}

function CountryFlags({ pais }) {
  return (
    <span className="flex flex-wrap gap-0.5">
      {arr(pais).map(p => (
        <span key={p} title={COUNTRY_META[p]?.name ?? p} className="text-sm">
          {COUNTRY_META[p]?.flag ?? p}
        </span>
      ))}
    </span>
  )
}

export default function DataMasterPage() {
  const { communications, deleteComm } = useApp()
  const { perms, canEditCountry, role } = useAuth()

  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState({ open: false, initial: null })
  const [selIds, setSelIds]   = useState(new Set())
  const [sortBy, setSortBy]   = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let list = communications.filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.titulo?.toLowerCase().includes(q)
        || arr(c.pais).some(p => p.toLowerCase().includes(q))
        || arr(c.canal).some(ch => ch.toLowerCase().includes(q))
    })
    list = [...list].sort((a, b) => {
      const va = a[sortBy] ?? ''
      const vb = b[sortBy] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [communications, search, sortBy, sortDir])

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function toggleSel(id) {
    setSelIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function deleteSelected() {
    if (!confirm(`¿Eliminar ${selIds.size} comunicaciones?`)) return
    for (const id of selIds) await deleteComm(id)
    setSelIds(new Set())
    toast({ title: `${selIds.size} eliminadas`, variant: 'success' })
  }

  function exportCSV() {
    const rows = filtered.map(c => [
      c.id, c.titulo, c.date,
      arr(c.pais).join('|'), arr(c.canal).join('|'),
      arr(c.segmento).join('|'), arr(c.topico).join('|'),
      arr(c.formato).join('|'), arr(c.idioma).join('|'),
      arr(c.alcance).join('|'), arr(c.estado).join('|'),
      c.destacado ? 'Sí' : 'No',
    ])
    const header = ['ID','Título','Fecha','País','Canal','Segmento','Tópico','Formato','Idioma','Alcance','Estado','Destacado']
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `commos-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const SortIcon = ({ col }) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const COLS = [
    { key: 'id',     label: '#',        w: 40  },
    { key: 'date',   label: 'Fecha',    w: 90  },
    { key: 'pais',   label: 'País',     w: 80  },
    { key: 'canal',  label: 'Canal',    w: 110 },
    { key: 'titulo', label: 'Título',   w: 220 },
    { key: 'topico', label: 'Tópico',   w: 90  },
    { key: 'formato',label: 'Formato',  w: 70  },
    { key: 'alcance',label: 'Alcance',  w: 70  },
    { key: 'estado', label: 'Estado',   w: 100 },
    { key: 'actions',label: '',         w: 70  },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar comunicaciones..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        <span className="text-xs text-muted-foreground">{filtered.length} registros</span>

        {selIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <span>{selIds.size} seleccionadas</span>
            {role === 'super_admin' && (
              <button onClick={deleteSelected} className="text-red-600 hover:text-red-800 font-medium">
                Eliminar
              </button>
            )}
            <button onClick={() => setSelIds(new Set())} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          {perms.canEdit && (
            <Button size="sm" onClick={() => setModal({ open: true, initial: null })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-8 text-center px-2 py-2 bg-slate-50 border-b border-border">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selIds.size === filtered.length && filtered.length > 0}
                  onChange={e => setSelIds(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())}
                />
              </th>
              {COLS.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.w, minWidth: col.w }}
                  className="text-left font-medium text-muted-foreground bg-slate-50 border-b border-border px-2 py-2 cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                  onClick={() => col.key !== 'actions' && toggleSort(col.key)}
                >
                  {col.label}<SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const sel = selIds.has(c.id)
              const editable = canEditCountry(arr(c.pais))
              return (
                <tr
                  key={c.id}
                  className={`border-b border-border transition-colors hover:bg-muted/40 ${sel ? 'bg-primary/5' : ''}`}
                >
                  <td className="text-center px-2 py-1.5">
                    <input type="checkbox" className="rounded" checked={sel} onChange={() => toggleSel(c.id)} />
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">{c.id}</td>
                  <td className="px-2 py-1.5 font-medium">{formatDate(c.date)}</td>
                  <td className="px-2 py-1.5"><CountryFlags pais={c.pais} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-0.5">
                      {arr(c.canal).map(ch => (
                        <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#eef0ff', color: '#534AB7' }}>{ch}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 max-w-[220px] truncate font-medium">
                    {c.destacado && <span className="mr-1">⭐</span>}
                    {c.titulo}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground truncate">{arr(c.topico).join(', ')}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{FORMAT_ICON[arr(c.formato)[0]] ?? ''} {arr(c.formato)[0]}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{arr(c.alcance)[0]}</td>
                  <td className="px-2 py-1.5"><StatusBadge status={arr(c.estado)[0]} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModal({ open: true, initial: c })}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      {editable && role === 'super_admin' && (
                        <button
                          onClick={async () => { if (confirm('¿Eliminar?')) await deleteComm(c.id) }}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">Sin resultados para "{search}"</div>
          </div>
        )}
      </div>

      <CommModal
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />
    </div>
  )
}
