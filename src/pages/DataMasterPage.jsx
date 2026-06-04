import { useState, useMemo, useRef } from 'react'
import { Search, Plus, Edit2, Trash2, Download, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/layout/Toaster'
import CommModal from '@/components/CommModal'
import { arr, formatDate } from '@/lib/utils'
import { COUNTRY_META, STATUS_META, FORMAT_ICON, CHANNEL_META } from '@/lib/constants'

// ── Status badge ──────────────────────────────────────────
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

// ── CSV parser ────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Detect if first line is header (contains 'Título' or 'titulo' or 'title')
  const firstLower = lines[0].toLowerCase()
  const hasHeader = firstLower.includes('título') || firstLower.includes('titulo') || firstLower.includes('title') || firstLower.includes('fecha')
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map(line => {
    // Simple CSV parse: handle quoted fields
    const cols = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())

    const get = (i, fallback = '') => (cols[i] ?? '').replace(/^"|"$/g, '').trim() || fallback
    const arrField = i => get(i) ? get(i).split('|').map(s => s.trim()).filter(Boolean) : []
    const boolField = i => ['sí','si','yes','true','1'].includes(get(i).toLowerCase())

    // Format: ID, Título, Fecha, País, Canal, Segmento, Tópico, Formato, Idioma, Alcance, Estado, Destacado
    // Also accept simpler format without ID in position 0
    // Try to detect: if col[0] is a number, it's ID-first format
    const hasId = /^\d+$/.test(get(0))
    const off   = hasId ? 1 : 0

    const titulo = get(off)
    const date   = get(off + 1)
    if (!titulo || !date) return null

    return {
      titulo,
      date,
      pais:      arrField(off + 2),
      canal:     arrField(off + 3),
      segmento:  arrField(off + 4),
      topico:    arrField(off + 5),
      formato:   arrField(off + 6),
      idioma:    arrField(off + 7),
      alcance:   arrField(off + 8) || ['Local'],
      estado:    arrField(off + 9) || ['Borrador'],
      destacado: boolField(off + 10),
      body: '',
    }
  }).filter(Boolean)
}

// ── Import modal ──────────────────────────────────────────
function ImportModal({ open, onClose, onImport }) {
  const fileRef   = useRef(null)
  const [rows,     setRows]     = useState([])
  const [fileName, setFileName] = useState('')
  const [status,   setStatus]   = useState('idle') // idle | preview | importing | done
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: [] })

  function reset() {
    setRows([]); setFileName(''); setStatus('idle')
    setProgress({ done: 0, total: 0, errors: [] })
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const parsed = parseCSV(ev.target.result)
      setRows(parsed)
      setStatus('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    setStatus('importing')
    setProgress({ done: 0, total: rows.length, errors: [] })
    const errors = []
    for (let i = 0; i < rows.length; i++) {
      const { error } = await onImport(rows[i])
      if (error) errors.push({ row: i + 1, msg: error.message })
      setProgress({ done: i + 1, total: rows.length, errors })
    }
    setStatus('done')
  }

  function handleClose() {
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-sm text-gray-800">Importar comunicaciones</h2>
            <p className="text-xs text-gray-400 mt-0.5">CSV con columnas: Título, Fecha, País, Canal, Segmento, Tópico, Formato, Idioma, Alcance, Estado, Destacado</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Upload area */}
          {status === 'idle' && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-10 cursor-pointer hover:border-sky-300 hover:bg-sky-50/30 transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">Seleccioná un archivo CSV</p>
              <p className="text-xs text-gray-400 mt-1">O arrastrá y soltá aquí</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
          )}

          {/* Preview */}
          {status === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-gray-700">{rows.length} registros encontrados</span>
                <span className="text-gray-400 text-xs">en {fileName}</span>
                <button onClick={reset} className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                  <X className="h-3 w-3" /> Cambiar archivo
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="text-xs w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        {['#','Título','Fecha','País','Canal','Estado'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium text-gray-700 max-w-[180px] truncate">{row.titulo}</td>
                          <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{row.date}</td>
                          <td className="px-3 py-1.5 text-gray-500">{row.pais.join(', ')}</td>
                          <td className="px-3 py-1.5 text-gray-500">{row.canal.join(', ')}</td>
                          <td className="px-3 py-1.5"><StatusBadge status={row.estado[0]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 20 && (
                  <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                    ... y {rows.length - 20} registros más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing */}
          {status === 'importing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Importando...</span>
                <span className="text-gray-400 text-xs">{progress.done} / {progress.total}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress.done / progress.total * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Done */}
          {status === 'done' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-gray-800">
                  {progress.done - progress.errors.length} de {progress.total} registros importados
                </span>
              </div>
              {progress.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5" /> {progress.errors.length} error{progress.errors.length > 1 ? 'es' : ''}
                  </div>
                  {progress.errors.slice(0, 5).map(e => (
                    <div key={e.row} className="text-xs text-amber-600">Fila {e.row}: {e.msg}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <a
            href="data:text/csv;charset=utf-8,Título,Fecha,País,Canal,Segmento,Tópico,Formato,Idioma,Alcance,Estado,Destacado%0AComunicación ejemplo,2026-06-01,AR,Emarsys,Staff,Cultura,Email,Español,Local,Borrador,No"
            download="commos-template.csv"
            className="text-xs text-sky-600 hover:text-sky-800 underline underline-offset-2"
          >
            Descargar plantilla CSV
          </a>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleClose}>Cancelar</Button>
            {status === 'preview' && (
              <Button size="sm" onClick={handleImport}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Importar {rows.length} registros
              </Button>
            )}
            {status === 'done' && (
              <Button size="sm" onClick={handleClose}>Cerrar</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function DataMasterPage() {
  const { communications, deleteComm, createComm } = useApp()
  const { perms, canEditCountry, role, myCountries } = useAuth()

  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState({ open: false, initial: null })
  const [importOpen, setImportOpen] = useState(false)
  const [selIds,    setSelIds]    = useState(new Set())
  const [sortBy,    setSortBy]    = useState('date')
  const [sortDir,   setSortDir]   = useState('desc')

  const isSuperAdmin = role === 'super_admin'

  // ── Role-based visibility ───────────────────────────────
  // super_admin + editor: all comms
  // country_admin + viewer with countries: their countries + GL
  const visibleComms = useMemo(() => {
    if (isSuperAdmin || role === 'editor') return communications
    const allowed = myCountries.length > 0 ? myCountries : []
    return communications.filter(c =>
      arr(c.pais).some(p => p === 'GL' || allowed.includes(p))
    )
  }, [communications, role, myCountries, isSuperAdmin])

  // ── Search + sort ───────────────────────────────────────
  const filtered = useMemo(() => {
    let list = visibleComms.filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.titulo?.toLowerCase().includes(q)
        || arr(c.pais).some(p => p.toLowerCase().includes(q))
        || arr(c.canal).some(ch => ch.toLowerCase().includes(q))
        || arr(c.topico).some(t => t.toLowerCase().includes(q))
    })
    return [...list].sort((a, b) => {
      const va = a[sortBy] ?? '', vb = b[sortBy] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [visibleComms, search, sortBy, sortDir])

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
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `commos-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const SortIcon = ({ col }) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const COLS = [
    { key: 'id',      label: '#',       w: 40  },
    { key: 'date',    label: 'Fecha',   w: 90  },
    { key: 'pais',    label: 'País',    w: 80  },
    { key: 'canal',   label: 'Canal',   w: 120 },
    { key: 'titulo',  label: 'Título',  w: 220 },
    { key: 'topico',  label: 'Tópico',  w: 90  },
    { key: 'formato', label: 'Formato', w: 70  },
    { key: 'alcance', label: 'Alcance', w: 70  },
    { key: 'estado',  label: 'Estado',  w: 110 },
    { key: 'actions', label: '',        w: 70  },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, país, canal..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length !== visibleComms.length ? `de ${visibleComms.length}` : ''} registros
          {!isSuperAdmin && myCountries.length > 0 && (
            <span className="ml-1 text-sky-600 font-medium">
              · {myCountries.map(c => COUNTRY_META[c]?.flag ?? c).join(' ')} + 🌍 GL
            </span>
          )}
        </span>

        {selIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <span>{selIds.size} seleccionadas</span>
            {isSuperAdmin && (
              <button onClick={deleteSelected} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
            )}
            <button onClick={() => setSelIds(new Set())} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          {/* Export: solo super_admin */}
          {isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={exportCSV} title="Exportar CSV">
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </Button>
          )}
          {/* Import: solo super_admin */}
          {isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} title="Importar CSV">
              <Upload className="h-3.5 w-3.5 mr-1" /> Importar
            </Button>
          )}
          {perms.canEdit && (
            <Button size="sm" onClick={() => setModal({ open: true, initial: null })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              {isSuperAdmin && (
                <th className="w-8 text-center px-2 py-2 bg-slate-50 border-b border-border">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selIds.size === filtered.length && filtered.length > 0}
                    onChange={e => setSelIds(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())}
                  />
                </th>
              )}
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
              const sel      = selIds.has(c.id)
              const editable = canEditCountry(arr(c.pais))
              const canales  = arr(c.canal)
              return (
                <tr
                  key={c.id}
                  className={`border-b border-border transition-colors hover:bg-muted/40 ${sel ? 'bg-primary/5' : ''}`}
                >
                  {isSuperAdmin && (
                    <td className="text-center px-2 py-1.5">
                      <input type="checkbox" className="rounded" checked={sel} onChange={() => toggleSel(c.id)} />
                    </td>
                  )}
                  <td className="px-2 py-1.5 text-muted-foreground">{c.id}</td>
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{formatDate(c.date)}</td>
                  <td className="px-2 py-1.5"><CountryFlags pais={c.pais} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-0.5">
                      {canales.map(ch => {
                        const color = CHANNEL_META[ch]?.color ?? '#94A3B8'
                        return (
                          <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: color + '18', color }}>
                            {ch}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 max-w-[220px] truncate font-medium">
                    {c.destacado && <span className="mr-1 text-amber-400">★</span>}
                    {c.titulo}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground truncate">{arr(c.topico).join(', ')}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{FORMAT_ICON[arr(c.formato)[0]] ?? ''} {arr(c.formato)[0]}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{arr(c.alcance)[0]}</td>
                  <td className="px-2 py-1.5"><StatusBadge status={arr(c.estado)[0]} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      {editable && (
                        <button
                          onClick={() => setModal({ open: true, initial: c })}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                      {editable && isSuperAdmin && (
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
            <div className="text-4xl mb-3">{search ? '🔍' : '📭'}</div>
            <div className="text-sm">{search ? `Sin resultados para "${search}"` : 'Sin comunicaciones disponibles'}</div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CommModal
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={createComm}
      />
    </div>
  )
}
