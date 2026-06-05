import { Calendar, BarChart2, Table2, ClipboardList, Bell, Download, Globe } from 'lucide-react'

const FEATURES = [
  {
    icon: Calendar,
    color: '#0EA5E9',
    bg: '#E0F2FE',
    title: 'Calendario',
    subtitle: 'Vista Semana · Día · Mes',
    desc: 'Planificá y visualizá todas las comunicaciones internas y externas por canal y país. Drag & drop para mover fechas, filtros por país, canal y estado.',
    tips: ['Vista semana y día para el día a día', 'Vista mes para planificación estratégica', 'Click en la fecha para navegar rápido', 'Semáforo 🚩 cuando un país está saturado'],
  },
  {
    icon: ClipboardList,
    color: '#8B5CF6',
    bg: '#EDE9FE',
    title: 'Briefing',
    subtitle: 'Próximos 14 días',
    desc: 'Resumen diario de todo lo que sale. Ideal para arrancar el día sabiendo exactamente qué se envía, por qué canal y a qué segmento.',
    tips: ['Filtrado automático por tu país', 'Agrupado por canal para claridad', 'Próximos 14 días de un vistazo', 'Estado de cada comunicación en tiempo real'],
  },
  {
    icon: BarChart2,
    color: '#10B981',
    bg: '#D1FAE5',
    title: 'Dashboard',
    subtitle: 'KPIs · Tendencias · Insights',
    desc: 'Métricas clave de tu planning de comunicación: total de comms, tasa de aprobación, canales más usados, distribución por país y evolución mensual.',
    tips: ['5 KPIs principales arriba', 'Tendencia mensual con AreaChart', 'Heatmap de actividad (últimas 18 semanas)', 'Filtros por país, canal, estado y tópico'],
  },
  {
    icon: Table2,
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Data Master',
    subtitle: 'Tabla · Export · Import',
    desc: 'Vista tabular de todas las comunicaciones. Buscá, filtrá, editá en línea. Importá desde CSV y exportá el planning con filtros de fecha y país.',
    tips: ['Búsqueda en tiempo real', 'Export con filtros de fecha y país', 'Import masivo desde CSV', 'Eliminación múltiple (solo super admin)'],
  },
  {
    icon: Bell,
    color: '#EF4444',
    bg: '#FEE2E2',
    title: 'Notificaciones',
    subtitle: 'Alertas inteligentes',
    desc: 'Centro de alertas contextual que te avisa sobre comms vencidas, pendientes de aprobación, planificadas para hoy o en borrador para mañana.',
    tips: ['⏰ Vencidas sin publicar', '⚠️ Mañana en Borrador', '📅 Planificadas hoy', '📋 Pendientes de aprobación'],
  },
  {
    icon: Globe,
    color: '#1D9E75',
    bg: '#D1FAE5',
    title: 'Multi-país',
    subtitle: 'Global · Local · Filtros',
    desc: 'Cada usuario ve automáticamente las comunicaciones de su país + GL (Global). Los super admins ven todo. El prefiltro es configurable.',
    tips: ['GL = comunicaciones globales', 'Prefiltro automático por rol', 'Filtros manuales en calendario', 'Saturación visible por país y día'],
  },
]

function FeatureCard({ feature }) {
  const Icon = feature.icon
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
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
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* Hero */}
          <div className="mb-10">
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
            <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-xl">
              Cada equipo de país puede ver y gestionar su comunicación mientras el equipo global mantiene visibilidad completa. Todo en un solo lugar, en tiempo real.
            </p>
          </div>

          {/* Features grid */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Qué podés hacer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
            </div>
          </div>

          {/* Roles */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Roles de acceso</h2>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { role: 'Super Admin',   badge: 'bg-purple-100 text-purple-700', desc: 'Acceso total. Ve y edita todas las comms de todos los países. Gestiona usuarios, canales y configuración.' },
                { role: 'Country Admin', badge: 'bg-blue-100 text-blue-700',     desc: 'Ve y edita las comms de su país + GL. Puede aprobar y publicar comunicaciones locales.' },
                { role: 'Editor',        badge: 'bg-green-100 text-green-700',   desc: 'Puede crear y editar comms pero no eliminar. Ve todas las comunicaciones.' },
                { role: 'Viewer',        badge: 'bg-gray-100 text-gray-600',     desc: 'Solo lectura. Ve las comunicaciones de su país + GL pero no puede modificarlas.' },
              ].map((r, i, arr) => (
                <div key={r.role} className={`flex items-start gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${r.badge}`}>{r.role}</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{r.desc}</span>
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
