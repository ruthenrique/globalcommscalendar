import { Calendar, BarChart2, Table2, ClipboardList, Bell, Globe, Settings, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { COUNTRY_META } from '@/lib/constants'

// Qué puede hacer cada rol -----------------------------------------------
const ROLE_INFO = {
  super_admin: {
    badge:   'bg-purple-100 text-purple-700 border-purple-200',
    label:   'Super Admin',
    tagline: 'Acceso total a la plataforma.',
    desc:    'Podés ver y editar todas las comunicaciones de todos los países. Gestionás usuarios, canales, segmentos y configuración global del sistema.',
    actions: [
      '✦ Crear, editar y eliminar cualquier comunicación',
      '✦ Gestionar usuarios y resetear contraseñas',
      '✦ Configurar canales, segmentos y tópicos',
      '✦ Ver el Dashboard y Data Master completos',
      '✦ Importar y exportar comunicaciones en CSV',
    ],
  },
  country_admin: {
    badge:   'bg-blue-100 text-blue-700 border-blue-200',
    label:   'Country Admin',
    tagline: 'Gestión completa de tu país.',
    desc:    'Podés ver y editar las comunicaciones de tu país más las globales (GL). Tenés capacidad de aprobar y publicar comunicaciones locales.',
    actions: [
      '✦ Crear, editar y aprobar comms de tu país',
      '✦ Ver todas las comunicaciones globales (GL)',
      '✦ Usar el Briefing para planificar el día',
      '✦ Acceder a Data Master (sin eliminación masiva)',
      '✦ Ver métricas en el Dashboard',
    ],
  },
  editor: {
    badge:   'bg-green-100 text-green-700 border-green-200',
    label:   'Editor',
    tagline: 'Creación y edición de contenido.',
    desc:    'Podés crear y editar comunicaciones en todos los países, pero no eliminarlas. Tenés visibilidad completa del calendario y el dashboard.',
    actions: [
      '✦ Crear y editar comms (todos los países)',
      '✦ Ver el calendario completo',
      '✦ Usar el Briefing y el Dashboard',
      '✦ Acceder a Data Master (sin eliminación)',
      '· No podés eliminar ni gestionar usuarios',
    ],
  },
  viewer: {
    badge:   'bg-gray-100 text-gray-600 border-gray-200',
    label:   'Viewer',
    tagline: 'Consulta y seguimiento.',
    desc:    'Tenés acceso de solo lectura a las comunicaciones de tu país y las globales (GL). Podés consultar el calendario, el Briefing y ver el Dashboard.',
    actions: [
      '✦ Ver el calendario de tu país + GL',
      '✦ Consultar el Briefing (próximos 14 días)',
      '✦ Ver métricas en el Dashboard',
      '· No podés crear ni editar comunicaciones',
      '· No tenés acceso a Data Master ni Admin',
    ],
  },
}

// Features con restricciones por rol -------------------------------------
const FEATURES = [
  {
    id: 'cal',
    icon: Calendar,
    color: '#0EA5E9',
    bg: '#E0F2FE',
    title: 'Calendario',
    subtitle: 'Vista Semana · Día · Mes',
    desc: 'Planificá y visualizá todas las comunicaciones internas y externas por canal y país. Drag & drop para mover fechas, filtros por país, canal y estado.',
    tips: ['Vista semana y día para el día a día', 'Vista mes para planificación estratégica', 'Click en la fecha para navegar rápido', 'Semáforo 🚩 cuando un país está saturado'],
    roles: ['super_admin', 'country_admin', 'editor', 'viewer'],
  },
  {
    id: 'brief',
    icon: ClipboardList,
    color: '#8B5CF6',
    bg: '#EDE9FE',
    title: 'Briefing',
    subtitle: 'Próximos 14 días',
    desc: 'Resumen diario de todo lo que sale. Ideal para arrancar el día sabiendo exactamente qué se envía, por qué canal y a qué segmento.',
    tips: ['Filtrado automático por tu país', 'Agrupado por canal para claridad', 'Próximos 14 días de un vistazo', 'Estado de cada comunicación en tiempo real'],
    roles: ['super_admin', 'country_admin', 'editor', 'viewer'],
  },
  {
    id: 'map',
    icon: BarChart2,
    color: '#10B981',
    bg: '#D1FAE5',
    title: 'Dashboard',
    subtitle: 'KPIs · Tendencias · Insights',
    desc: 'Métricas clave de tu planning de comunicación: total de comms, tasa de aprobación, canales más usados, distribución por país y evolución mensual.',
    tips: ['5 KPIs principales arriba', 'Tendencia mensual con AreaChart', 'Heatmap de actividad (últimas 18 semanas)', 'Filtros por país, canal, estado y tópico'],
    roles: ['super_admin', 'country_admin', 'editor', 'viewer'],
  },
  {
    id: 'data',
    icon: Table2,
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Data Master',
    subtitle: 'Tabla · Export · Import',
    desc: 'Vista tabular de todas las comunicaciones. Buscá, filtrá, editá en línea. Importá desde CSV y exportá el planning con filtros de fecha y país.',
    tips: ['Búsqueda en tiempo real', 'Export con filtros de fecha y país', 'Import masivo desde CSV', 'Eliminación múltiple (solo super admin)'],
    roles: ['super_admin', 'country_admin', 'editor'],
  },
  {
    id: 'notif',
    icon: Bell,
    color: '#EF4444',
    bg: '#FEE2E2',
    title: 'Notificaciones',
    subtitle: 'Alertas inteligentes',
    desc: 'Centro de alertas contextual que te avisa sobre comms vencidas, pendientes de aprobación, planificadas para hoy o en borrador para mañana.',
    tips: ['⏰ Vencidas sin publicar', '⚠️ Mañana en Borrador', '📅 Planificadas hoy', '📋 Pendientes de aprobación'],
    roles: ['super_admin', 'country_admin', 'editor', 'viewer'],
  },
  {
    id: 'admin',
    icon: Settings,
    color: '#6366F1',
    bg: '#EEF2FF',
    title: 'Administración',
    subtitle: 'Usuarios · Config · Auditoría',
    desc: 'Panel de gestión de usuarios, países, canales y segmentos. Incluye auditoría completa de cambios y reset de contraseñas.',
    tips: ['Gestión de usuarios y roles', 'Configuración de canales y segmentos', 'Log de auditoría completo', 'Reset de contraseñas (super admin)'],
    roles: ['super_admin'],
  },
  {
    id: 'global',
    icon: Globe,
    color: '#1D9E75',
    bg: '#D1FAE5',
    title: 'Multi-país',
    subtitle: 'Global · Local · Filtros',
    desc: 'Cada usuario ve automáticamente las comunicaciones de su país + GL (Global). Los super admins ven todo. El prefiltro es configurable.',
    tips: ['GL = comunicaciones globales', 'Prefiltro automático por rol', 'Filtros manuales en calendario', 'Saturación visible por país y día'],
    roles: ['super_admin', 'country_admin', 'editor', 'viewer'],
  },
]

const ALL_ROLES = [
  { id: 'super_admin',   badge: 'bg-purple-100 text-purple-700', desc: 'Acceso total. Ve y edita todas las comms de todos los países. Gestiona usuarios, canales y configuración.' },
  { id: 'country_admin', badge: 'bg-blue-100 text-blue-700',     desc: 'Ve y edita las comms de su país + GL. Puede aprobar y publicar comunicaciones locales.' },
  { id: 'editor',        badge: 'bg-green-100 text-green-700',   desc: 'Puede crear y editar comms pero no eliminar. Ve todas las comunicaciones.' },
  { id: 'viewer',        badge: 'bg-gray-100 text-gray-600',     desc: 'Solo lectura. Ve las comunicaciones de su país + GL pero no puede modificarlas.' },
]

function FeatureCard({ feature, available }) {
  const Icon = feature.icon
  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all relative ${
      available
        ? 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
        : 'border-gray-100 opacity-40 grayscale'
    }`}>
      {!available && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
          <Lock className="h-2.5 w-2.5 text-gray-400" />
          <span className="text-[10px] text-gray-400 font-medium">Sin acceso</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: feature.bg }}>
          <Icon className="h-5 w-5" style={{ color: feature.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <h3 className="text-sm font-black text-gray-900 tracking-tight">{feature.title}</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{feature.subtitle}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{feature.desc}</p>
          <ul className="space-y-1">
            {feature.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400">
                <span className="text-gray-300 mt-px">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const { role, profile, myCountries } = useAuth()

  const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.viewer
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Usuario'

  // Países del usuario (solo para country_admin/viewer)
  const countryNames = (myCountries ?? [])
    .map(code => COUNTRY_META[code]?.name ?? code)
    .filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* Hero */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                <span className="text-white text-[11px] font-black tracking-tight">GCH</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Global Comms Hub</h1>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">BSG · Internal Communications Platform</p>
              </div>
            </div>
            <div className="h-px w-12 bg-gray-900 mb-4" />
            <p className="text-base text-gray-600 leading-relaxed max-w-xl">
              Plataforma centralizada para planificar, gestionar y hacer seguimiento de todas las comunicaciones internas de BSG a nivel global y local.
            </p>
          </div>

          {/* Tarjeta personalizada por rol */}
          <div className={`rounded-2xl border p-5 mb-10 ${roleInfo.badge.replace('text-', 'border-').split(' ')[0]} bg-white`}
               style={{ borderColor: 'currentColor' }}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-base font-black text-gray-900">Hola, {firstName} 👋</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleInfo.badge}`}>
                    {roleInfo.label}
                  </span>
                  {countryNames.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      · {countryNames.join(', ')}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">{roleInfo.tagline}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{roleInfo.desc}</p>
                <ul className="space-y-1.5">
                  {roleInfo.actions.map((action, i) => (
                    <li key={i} className={`text-xs leading-snug ${action.startsWith('·') ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Features grid */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Funcionalidades de la plataforma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  available={f.roles.includes(role ?? 'viewer')}
                />
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Roles de acceso</h2>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {ALL_ROLES.map((r, i, arr) => (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                    r.id === role ? 'bg-gray-100' : ''
                  } ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${r.badge}`}>
                    {ROLE_INFO[r.id]?.label ?? r.id}
                  </span>
                  <span className="text-xs text-gray-500 leading-relaxed flex-1">{r.desc}</span>
                  {r.id === role && (
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 mt-0.5">Tu rol</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-300 uppercase tracking-widest">Global Comms Hub · BSG · {new Date().getFullYear()}</p>
          </div>

        </div>
      </div>
    </div>
  )
}
