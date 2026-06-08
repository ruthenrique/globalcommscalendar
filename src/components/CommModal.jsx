import { useEffect, useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { FORMAT_ICON, PAIS_IDIOMA } from '@/lib/constants'
import { arr, formatDateTime } from '@/lib/utils'
import { toast } from '@/components/layout/Toaster'
import { supabase } from '@/lib/supabase'

function MultiSelect({ label, options, value, onChange, getLabel, getKey, colorFn }) {
  const vals = arr(value)
  return (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="mt-1 flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30 min-h-[36px]">
        {options.map(opt => {
          const key = getKey ? getKey(opt) : opt
          const lbl = getLabel ? getLabel(opt) : opt
          const sel = vals.includes(key)
          const col = colorFn ? colorFn(key) : undefined
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(sel ? vals.filter(v => v !== key) : [...vals, key])}
              className="text-xs px-2 py-0.5 rounded-full border transition-all font-medium"
              style={sel
                ? col
                  ? { background: col + '22', borderColor: col, color: col }
                  : { background: '#EFF6FF', borderColor: '#BAE6FD', color: '#0369A1' }
                : { background: 'white', borderColor: '#e2e8f0', color: '#64748b' }
              }
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const ESTADO_META = {
  'Borrador':    { dot: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
  'En revisión': { dot: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  'Aprobado':    { dot: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', text: '#065f46' },
  'Publicado':   { dot: '#0ea5e9', bg: '#f0f9ff', border: '#7dd3fc', text: '#0c4a6e' },
  'Cancelado':   { dot: '#ef4444', bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
}

function StatusSelect({ label, value, onChange, disabled }) {
  const estados = ['Borrador', 'En revisión', 'Aprobado', 'Publicado', 'Cancelado']
  const cur = arr(value)[0] ?? 'Borrador'
  return (
    <div className="col-span-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {estados.map(e => {
          const m = ESTADO_META[e] ?? { dot: '#94a3b8', bg: '#f8fafc', border: '#cbd5e1', text: '#475569' }
          const sel = cur === e
          return (
            <button
              key={e}
              type="button"
              disabled={disabled}
              onClick={() => onChange([e])}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium disabled:opacity-50"
              style={sel
                ? { background: m.bg, borderColor: m.border, color: m.text, boxShadow: `0 0 0 1px ${m.border}` }
                : { background: 'white', borderColor: '#e2e8f0', color: '#94a3b8' }
              }
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                style={{ background: sel ? m.dot : '#e2e8f0' }} />
              {e}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CommModal({ open, onClose, initial = null }) {
  const { countries, channels, categories, segments, settings, appLists, countryMeta, createComm, updateComm, deleteComm } = useApp()
  const { canEditCountry, role, loading: authLoading } = useAuth()
  const { t } = useTranslation()

  const isNew = !initial?.id

  const empty = {
    titulo: '', body: '', date: '',
    pais: [], canal: [], segmento: [], ubicacion: [],
    topico: [], formato: [], idioma: [], alcance: ['Local'],
    estado: ['Borrador'], destacado: false,
  }

  const [form, setForm]         = useState(empty)
  const [saving, setSaving]     = useState(false)
  const [langAlert, setLangAlert] = useState('')
  const [auditUsers, setAuditUsers] = useState({ createdBy: null, updatedBy: null })

  useEffect(() => {
    if (open) {
      setForm({ ...empty, ...initial })
      setLangAlert('')
      setAuditUsers({ createdBy: null, updatedBy: null })
      if (initial?.id) {
        supabase
          .from('audit_log')
          .select('action, user_name, created_at')
          .eq('table_name', 'communications')
          .eq('record_id', String(initial.id))
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            if (!data?.length) return
            const created = data.find(r => r.action === 'INSERT')
            const updated = [...data].reverse().find(r => r.action === 'UPDATE')
            setAuditUsers({
              createdBy: created?.user_name ?? null,
              updatedBy: updated?.user_name ?? null,
            })
          })
      }
    }
  }, [open, initial])

  useEffect(() => {
    const p = arr(form.pais)[0]
    const i = arr(form.idioma)[0]
    const expected = PAIS_IDIOMA[p]
    if (p && i && expected && i !== expected) {
      setLangAlert(`⚠️ ${p} normalmente usa ${expected}, seleccionaste ${i}`)
    } else {
      setLangAlert('')
    }
  }, [form.pais, form.idioma])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!form.titulo.trim()) return toast({ title: t('toast.titleRequired'), variant: 'destructive' })
    if (!form.date)          return toast({ title: t('toast.dateRequired'),  variant: 'destructive' })
    setSaving(true)
    const payload = { ...form }
    const { error } = isNew ? await createComm(payload) : await updateComm(initial.id, payload)
    setSaving(false)
    if (error) {
      toast({ title: t('toast.saveError'), description: error.message, variant: 'destructive' })
    } else {
      toast({ title: isNew ? t('toast.created') : t('toast.saved'), variant: 'success' })
      onClose()
    }
  }

  async function handleDelete() {
    if (!confirm(t('modal.deleteConfirm'))) return
    const { error } = await deleteComm(initial.id)
    if (error) toast({ title: t('toast.deleteError'), variant: 'destructive' })
    else { toast({ title: t('toast.deleted'), variant: 'success' }); onClose() }
  }

  const canDelete   = role === 'super_admin'
  const countryList  = countries
  const channelList  = channels
  const categoryList = categories
  const segmentList  = segments
  const idiomas      = appLists.idiomas    ?? []
  const alcances     = appLists.alcances   ?? []
  const ubicaciones  = appLists.ubicaciones ?? []
  const formatos     = appLists.formatos   ?? []
  // estados definidos en ESTADO_META arriba

  const editable = authLoading || isNew || canEditCountry(arr(form.pais))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        {/* Drag handle — solo mobile */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-gray-200 mx-auto -mt-1 mb-3" />

        <DialogHeader>
          <DialogTitle className="text-base">
            {isNew ? t('modal.newTitle') : `${t('modal.editTitle')} · #${initial?.id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Título */}
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t('modal.titulo')}</Label>
            <Input
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder={t('modal.titulo')}
              className="mt-1"
              disabled={!editable}
            />
          </div>

          {/* Brief / Body */}
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t('modal.body')}</Label>
            <textarea
              value={form.body ?? ''}
              onChange={e => set('body', e.target.value)}
              placeholder={t('modal.bodyPlaceholder')}
              rows={4}
              disabled={!editable}
              className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/40 disabled:opacity-60"
            />
          </div>

          {/* Fecha */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t('modal.date')}</Label>
            <Input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="mt-1"
              disabled={!editable}
            />
          </div>

          {/* Estado */}
          <StatusSelect
            label={t('modal.estado')}
            value={form.estado}
            onChange={v => set('estado', v)}
            disabled={!editable}
          />

          {/* País */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.pais')}
              options={countryList}
              value={form.pais}
              onChange={v => set('pais', v)}
              getKey={c => c.code ?? c}
              getLabel={c => `${c.flag ?? countryMeta[c.code ?? c]?.flag ?? ''} ${c.name ?? c.code ?? c}`}
              colorFn={k => countryMeta[k]?.color}
            />
          </div>

          {/* Canal */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.canal')}
              options={channelList.map(c => c.name)}
              value={form.canal}
              onChange={v => set('canal', v)}
            />
          </div>

          {/* Segmento */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.segmento')}
              options={segmentList.map(s => s.name)}
              value={form.segmento}
              onChange={v => set('segmento', v)}
            />
          </div>

          {/* Tópico */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.topico')}
              options={categoryList.map(c => c.name)}
              value={form.topico}
              onChange={v => set('topico', v)}
              colorFn={k => categoryList.find(c => c.name === k)?.color ?? '#888'}
            />
          </div>

          {/* Formato */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.formato')}
              options={formatos}
              value={form.formato}
              onChange={v => set('formato', v)}
            />
          </div>

          {/* Alcance */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.alcance')}
              options={alcances}
              value={form.alcance}
              onChange={v => set('alcance', v)}
              colorFn={k => k === 'Global' ? '#7c3aed' : k === 'Local' ? '#0891b2' : undefined}
            />
          </div>

          {/* Idioma */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.idioma')}
              options={idiomas}
              value={form.idioma}
              onChange={v => set('idioma', v)}
            />
          </div>

          {/* Ubicación */}
          <div className="col-span-2">
            <MultiSelect
              label={t('modal.ubicacion')}
              options={ubicaciones}
              value={form.ubicacion}
              onChange={v => set('ubicacion', v)}
            />
          </div>

          {/* Destacado */}
          <div className="col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => editable && set('destacado', !form.destacado)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.destacado ? 'bg-primary' : 'bg-gray-200'}`}
              disabled={!editable}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${form.destacado ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-muted-foreground">
              {form.destacado ? t('modal.destacado') : t('modal.notFeatured')}
            </span>
          </div>
        </div>

        {/* Language alert */}
        {langAlert && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 text-sm text-amber-800">
            {langAlert}
          </div>
        )}

        {/* Audit info */}
        {initial?.created_at && (
          <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <span>{t('modal.created')}:</span>
              <span>{formatDateTime(initial.created_at)}</span>
              {auditUsers.createdBy && (
                <span className="font-medium text-foreground">· {auditUsers.createdBy}</span>
              )}
            </div>
            {initial.updated_at !== initial.created_at && (
              <div className="flex items-center gap-1.5">
                <span>{t('modal.modified')}:</span>
                <span>{formatDateTime(initial.updated_at)}</span>
                {auditUsers.updatedBy && (
                  <span className="font-medium text-foreground">· {auditUsers.updatedBy}</span>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {!isNew && canDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                {t('modal.delete')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>{t('modal.cancel')}</Button>
            {editable && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? t('modal.saving') : t('modal.save')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
