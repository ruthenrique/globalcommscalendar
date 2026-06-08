import { Calendar, BarChart2, Table2, ClipboardList, Bell, Globe, Settings, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp }  from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'

const FEATURE_IDS = ['cal', 'brief', 'map', 'data', 'notif', 'admin', 'global']
const FEATURE_ICONS = { cal: Calendar, brief: ClipboardList, map: BarChart2, data: Table2, notif: Bell, admin: Settings, global: Globe }
const FEATURE_COLORS = {
  cal:    { color: '#0EA5E9', bg: '#E0F2FE' },
  brief:  { color: '#8B5CF6', bg: '#EDE9FE' },
  map:    { color: '#10B981', bg: '#D1FAE5' },
  data:   { color: '#F59E0B', bg: '#FEF3C7' },
  notif:  { color: '#EF4444', bg: '#FEE2E2' },
  admin:  { color: '#6366F1', bg: '#EEF2FF' },
  global: { color: '#1D9E75', bg: '#D1FAE5' },
}
const ROLE_ACCESS = {
  cal:    ['super_admin','country_admin','editor','viewer'],
  brief:  ['super_admin','country_admin','editor','viewer'],
  map:    ['super_admin','country_admin','editor','viewer'],
  data:   ['super_admin','country_admin','editor'],
  notif:  ['super_admin','country_admin','editor','viewer'],
  admin:  ['super_admin'],
  global: ['super_admin','country_admin','editor','viewer'],
}
const ROLE_BADGE = {
  super_admin:   'bg-purple-100 text-purple-700 border-purple-200',
  country_admin: 'bg-blue-100 text-blue-700 border-blue-200',
  editor:        'bg-green-100 text-green-700 border-green-200',
  viewer:        'bg-gray-100 text-gray-600 border-gray-200',
}
const ALL_ROLE_IDS = ['super_admin','country_admin','editor','viewer']

function FeatureCard({ id, t }) {
  const Icon    = FEATURE_ICONS[id]
  const { color, bg } = FEATURE_COLORS[id]
  const title    = t(`about.features.${id}.title`)
  const subtitle = t(`about.features.${id}.subtitle`)
  const desc     = t(`about.features.${id}.desc`)
  const tips     = t(`about.features.${id}.tips`, { returnObjects: true })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <h3 className="text-sm font-black text-gray-900 tracking-tight">{title}</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{subtitle}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
          <ul className="space-y-1">
            {Array.isArray(tips) && tips.map((tip, i) => (
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
  const { t }                       = useTranslation()
  const { countryMeta }             = useApp()
  const { role, profile, myCountries } = useAuth()

  const firstName    = profile?.full_name?.split(' ')[0] ?? ''
  const badge        = ROLE_BADGE[role] ?? ROLE_BADGE.viewer
  const roleLabel    = t(`about.roles.${role ?? 'viewer'}.label`)
  const roleTagline  = t(`about.roles.${role ?? 'viewer'}.tagline`)
  const roleDesc     = t(`about.roles.${role ?? 'viewer'}.desc`)
  const roleActions  = t(`about.roles.${role ?? 'viewer'}.actions`, { returnObjects: true })

  const countryNames = (myCountries ?? [])
    .map(code => countryMeta[code]?.name ?? code)
    .filter(Boolean)

  const availableFeatures = FEATURE_IDS.filter(id => ROLE_ACCESS[id].includes(role ?? 'viewer'))

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
            <p className="text-base text-gray-600 leading-relaxed max-w-xl">{t('about.tagline')}</p>
          </div>

          {/* Tarjeta personalizada por rol */}
          <div className={`rounded-2xl border p-5 mb-10 bg-white ${badge.split(' ')[0]}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {firstName && (
                    <span className="text-base font-black text-gray-900">
                      {t('about.hello', { name: firstName })}
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge}`}>
                    {roleLabel}
                  </span>
                  {countryNames.length > 0 && (
                    <span className="text-[11px] text-gray-400">· {countryNames.join(', ')}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">{roleTagline}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{roleDesc}</p>
                <ul className="space-y-1.5">
                  {Array.isArray(roleActions) && roleActions.map((action, i) => (
                    <li key={i} className={`text-xs leading-snug ${action.startsWith('·') ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Features disponibles */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('about.yourFeatures')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableFeatures.map(id => (
                <FeatureCard key={id} id={id} t={t} />
              ))}
            </div>
          </div>

          {/* Roles de acceso */}
          <div className="mb-10">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('about.rolesTitle')}</h2>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              {ALL_ROLE_IDS.map((rid, i) => (
                <div
                  key={rid}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${rid === role ? 'bg-gray-100' : ''} ${i < ALL_ROLE_IDS.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${ROLE_BADGE[rid]}`}>
                    {t(`about.roles.${rid}.label`)}
                  </span>
                  <span className="text-xs text-gray-500 leading-relaxed flex-1">
                    {t(`about.roleDescs.${rid}`)}
                  </span>
                  {rid === role && (
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 mt-0.5">
                      {t('about.yourRole')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-300 uppercase tracking-widest">
              Global Comms Hub · BSG · {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
