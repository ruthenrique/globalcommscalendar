import { useState, useEffect, Fragment } from 'react'
import { Plus, Edit2, Trash2, Save, X, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/layout/Toaster'
import { ROLE_META, COUNTRY_META } from '@/lib/constants'

const ADMIN_TABS = [
  { id: 'users',      label: '👥 Usuarios'    },
  { id: 'countries',  label: '🌍 Países'      },
  { id: 'categories', label: '🏷️ Categorías'  },
  { id: 'channels',   label: '📡 Canales'     },
  { id: 'segments',   label: '👤 Segmentos'   },
  { id: 'audit',      label: '📋 Auditoría'   },
]

// ── Users Panel ─────────────────────────────────────
function UsersPanel() {
  const { myCountries, role } = useAuth()
  const { countries } = useApp()
  const [users, setUsers]     = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState({})
  const [resetPw, setResetPw] = useState({ email: null, value: '' })

  async function handleResetPw() {
    if (resetPw.value.length < 6) return toast({ title: 'Mínimo 6 caracteres', variant: 'destructive' })
    const { error } = await supabase.rpc('admin_reset_password', {
      p_email: resetPw.email,
      p_new_password: resetPw.value,
    })
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Contraseña reseteada ✓', variant: 'success' })
      setResetPw({ email: null, value: '' })
    }
  }

  useEffect(() => {
    supabase.from('profiles').select('*').order('name').then(({ data }) => data && setUsers(data))
  }, [])

  async function saveUser(u) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: u.name, role: u.role, countries: u.countries, color: u.color })
      .eq('id', u.id)
      .select()
      .single()
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' })
    else {
      setUsers(prev => prev.map(x => x.id === u.id ? data : x))
      setEditing(null)
      toast({ title: 'Usuario actualizado ✓', variant: 'success' })
    }
  }

  const countryList = countries.map(c => c.code)

  return (
    <div className="space-y-3">
      {users.map(u => {
        const isEditing = editing === u.id
        const perms = ROLE_META[u.role] ?? ROLE_META.viewer
        return (
          <div key={u.id} className="bg-white border rounded-xl p-4">
            {!isEditing ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: u.color }}>
                  {u.initials}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${perms.badge}`}>
                      {perms.label}
                    </span>
                    {u.countries?.map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {COUNTRY_META[c]?.flag} {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  {role === 'super_admin' && (
                    <button onClick={() => setResetPw(r => r.email === u.email ? { email: null, value: '' } : { email: u.email, value: '' })} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Reset contraseña">
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setEditing(u.id); setForm({ ...u }) }} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Rol</Label>
                    <select
                      value={form.role ?? 'viewer'}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="mt-1 w-full text-xs border rounded-md px-2 py-1.5 h-8"
                    >
                      {Object.entries(ROLE_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Países asignados</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {countryList.map(code => {
                      const sel = (form.countries ?? []).includes(code)
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            const curr = form.countries ?? []
                            setForm(f => ({
                              ...f,
                              countries: sel ? curr.filter(c => c !== code) : [...curr, code]
                            }))
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${sel ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-muted-foreground'}`}
                        >
                          {COUNTRY_META[code]?.flag} {code}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Vacío = acceso a todos los países</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5 mr-1" />Cancelar</Button>
                  <Button size="sm" onClick={() => saveUser(form)}><Save className="h-3.5 w-3.5 mr-1" />Guardar</Button>
                </div>
              </div>
            )}
            {!isEditing && resetPw.email === u.email && (
              <div className="mt-3 pt-3 border-t flex gap-2 items-center">
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={resetPw.value}
                  onChange={e => setResetPw(r => ({ ...r, value: e.target.value }))}
                  className="flex-1 text-xs border rounded px-2 py-1 h-7"
                />
                <Button size="sm" onClick={handleResetPw} className="h-7 text-xs">Guardar</Button>
                <Button size="sm" variant="outline" onClick={() => setResetPw({ email: null, value: '' })} className="h-7 text-xs">Cancelar</Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Generic list panel (countries, categories, channels) ─
function ListPanel({ table, fields, label }) {
  const { reload } = useApp()
  const [items, setItems]     = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({})

  useEffect(() => {
    supabase.from(table).select('*').order('sort_order').then(({ data }) => data && setItems(data))
  }, [table])

  async function save() {
    if (editing === 'new') {
      const { data, error } = await supabase.from(table).insert(form).select().single()
      if (!error) { setItems(p => [...p, data]); setEditing(null); setAdding(false); setForm({}); reload() }
      else { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    } else {
      const { data, error } = await supabase.from(table).update(form).eq('id', editing).select().single()
      if (!error) { setItems(p => p.map(x => x.id === editing ? data : x)); setEditing(null); reload() }
      else { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    }
    toast({ title: 'Guardado ✓', variant: 'success' })
  }

  async function remove(id) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) { setItems(p => p.filter(x => x.id !== id)); reload() }
    else toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing('new'); setAdding(true); setForm({}) }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar {label}
        </Button>
      </div>

      {adding && (
        <div className="bg-white border rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === 'color' ? (
                  <div className="flex gap-2 mt-1 items-center">
                    <input type="color" value={form[f.key] ?? '#888'} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="h-8 w-12 border rounded" />
                    <Input value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="h-8 text-xs flex-1" />
                  </div>
                ) : (
                  <Input value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="mt-1 h-8 text-xs" placeholder={f.label} />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setAdding(false) }}>Cancelar</Button>
            <Button size="sm" onClick={save}>Guardar</Button>
          </div>
        </div>
      )}

      {items.map(item => (
        <div key={item.id} className="bg-white border rounded-xl p-3">
          {editing === item.id ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    {f.type === 'color' ? (
                      <div className="flex gap-2 mt-1 items-center">
                        <input type="color" value={form[f.key] ?? item[f.key] ?? '#888'} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="h-8 w-12 border rounded" />
                        <Input value={form[f.key] ?? item[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="h-8 text-xs flex-1" />
                      </div>
                    ) : (
                      <Input value={form[f.key] ?? item[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="mt-1 h-8 text-xs" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button size="sm" onClick={save}>Guardar</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {item.color && (
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: item.color }} />
              )}
              {item.flag && <span className="text-xl">{item.flag}</span>}
              <div className="flex-1">
                <span className="text-sm font-medium">{item.name}</span>
                {item.code && <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>}
              </div>
              <button onClick={() => { setEditing(item.id); setForm({ ...item }) }} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(item.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Audit Log Panel ─────────────────────────────────
function AuditPanel() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => data && setLogs(data))
  }, [])

  const ACTION_COLOR = { INSERT: 'bg-green-50 text-green-700', UPDATE: 'bg-blue-50 text-blue-700', DELETE: 'bg-red-50 text-red-700' }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="bg-white border rounded-xl px-4 py-3 flex items-start gap-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${ACTION_COLOR[log.action] ?? 'bg-gray-50'}`}>
            {log.action}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">{log.table_name} #{log.record_id}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {log.user_name} · {new Date(log.created_at).toLocaleString('es-AR')}
            </div>
          </div>
          {log.new_data?.titulo && (
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{log.new_data.titulo}</div>
          )}
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Sin registros de auditoría</div>
      )}
    </div>
  )
}

// ── Main Admin Page ─────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('users')
  const { role } = useAuth()

  if (!ROLE_META[role]?.canManage) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <div className="text-sm">No tenés permisos para esta sección</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex gap-0.5 px-4 py-3 border-b bg-white flex-shrink-0 overflow-x-auto">
        {ADMIN_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors font-medium ${tab === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'users' && <UsersPanel />}
        {tab === 'countries' && (
          <ListPanel
            table="countries"
            label="País"
            fields={[
              { key: 'code',     label: 'Código',    type: 'text'  },
              { key: 'name',     label: 'Nombre',    type: 'text'  },
              { key: 'flag',     label: 'Emoji',     type: 'text'  },
              { key: 'color',    label: 'Color',     type: 'color' },
              { key: 'timezone', label: 'Timezone',  type: 'text'  },
            ]}
          />
        )}
        {tab === 'categories' && (
          <ListPanel
            table="categories"
            label="Categoría"
            fields={[
              { key: 'name',     label: 'Nombre',    type: 'text'  },
              { key: 'color',    label: 'Color',     type: 'color' },
              { key: 'bg_color', label: 'Fondo',     type: 'color' },
            ]}
          />
        )}
        {tab === 'channels' && (
          <ListPanel
            table="channels"
            label="Canal"
            fields={[
              { key: 'name',  label: 'Nombre', type: 'text'  },
              { key: 'color', label: 'Color',  type: 'color' },
              { key: 'type',  label: 'Tipo',   type: 'text'  },
            ]}
          />
        )}
        {tab === 'segments' && (
          <ListPanel
            table="segments"
            label="Segmento"
            fields={[
              { key: 'name',       label: 'Nombre',    type: 'text'   },
              { key: 'sort_order', label: 'Orden',     type: 'text'   },
            ]}
          />
        )}
        {tab === 'audit' && <AuditPanel />}
      </div>
    </div>
  )
}
