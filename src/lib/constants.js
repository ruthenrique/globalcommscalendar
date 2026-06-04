// Country metadata (synced with DB, used as fallback)
export const COUNTRY_META = {
  AR: { name: 'Argentina',  flag: '🇦🇷', color: '#8B5CF6' },
  GL: { name: 'Global',     flag: '🌍',  color: '#1D9E75' },
  MX: { name: 'México',     flag: '🇲🇽', color: '#D85A30' },
  CL: { name: 'Chile',      flag: '🇨🇱', color: '#BA7517' },
  PE: { name: 'Perú',       flag: '🇵🇪', color: '#639922' },
  BR: { name: 'Brasil',     flag: '🇧🇷', color: '#185FA5' },
  ES: { name: 'España',     flag: '🇪🇸', color: '#D4537E' },
  CN: { name: 'China',      flag: '🇨🇳', color: '#378ADD' },
}

export const CHANNEL_META = {
  Emarsys:           { color: '#818CF8', type: 'internal' },
  Humand:            { color: '#1D9E75', type: 'internal' },
  'Cartelera Digital':{ color: '#185FA5', type: 'internal' },
  LinkedIn:          { color: '#3C3489', type: 'external' },
  TikTok:            { color: '#BA7517', type: 'external' },
  Instagram:         { color: '#993556', type: 'external' },
}

export const INTERNAL_CHANNELS = ['Emarsys','Humand','Cartelera Digital']
export const EXTERNAL_CHANNELS = ['LinkedIn','TikTok','Instagram']

export const STATUS_META = {
  'Aprobado':    { bg: '#EAF3DE', color: '#27500A', dot: '#3B6D11' },
  'En revisión': { bg: '#FAEEDA', color: '#633806', dot: '#BA7517' },
  'Borrador':    { bg: '#F1EFE8', color: '#444',    dot: '#888'    },
  'Publicado':   { bg: '#E1F5EE', color: '#085041', dot: '#1D9E75' },
  'Cancelado':   { bg: '#FCEBEB', color: '#791F1F', dot: '#D85A30' },
}

export const FORMAT_ICON = {
  Post:    '📝',
  Video:   '🎥',
  Carrusel:'🎡',
  Email:   '📧',
  Encuesta:'📊',
}

export const ROLE_META = {
  super_admin:   { label: 'Super Admin',    badge: 'bg-purple-100 text-purple-800', canEdit: true,  canDelete: true,  canManage: true  },
  country_admin: { label: 'Country Admin',  badge: 'bg-blue-100 text-blue-800',    canEdit: true,  canDelete: true,  canManage: false },
  editor:        { label: 'Editor',         badge: 'bg-green-100 text-green-800',  canEdit: true,  canDelete: false, canManage: false },
  viewer:        { label: 'Viewer',         badge: 'bg-gray-100 text-gray-700',    canEdit: false, canDelete: false, canManage: false },
}

export const PAIS_IDIOMA = {
  AR: 'Español', MX: 'Español', CL: 'Español', PE: 'Español',
  BR: 'Portugués', ES: 'Español', CN: 'Inglés', GL: 'Español',
}

export const NAV_ITEMS = [
  { id: 'cal',   label: 'Calendario',      icon: 'Calendar'  },
  { id: 'map',   label: 'Analytics',       icon: 'BarChart2' },
  { id: 'data',  label: 'Data Master',     icon: 'Table2'    },
  { id: 'admin', label: 'Administración',  icon: 'Settings'  },
]
