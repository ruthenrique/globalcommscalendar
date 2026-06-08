// COUNTRY_META y CHANNEL_META se obtienen desde DB via AppContext (countryMeta, channelMeta)
// INTERNAL_CHANNELS y EXTERNAL_CHANNELS se obtienen desde DB via AppContext (internalChannels, externalChannels)

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
  { id: 'cal',   label: 'Calendario',      icon: 'Calendar'     },
  { id: 'brief', label: 'Briefing',        icon: 'ClipboardList'},
  { id: 'map',   label: 'Dashboard',       icon: 'BarChart2'    },
  { id: 'data',  label: 'Data Master',     icon: 'Table2'       },
  { id: 'admin', label: 'Administración',  icon: 'Settings'     },
  { id: 'about', label: 'Acerca de',       icon: 'Info'         },
]
