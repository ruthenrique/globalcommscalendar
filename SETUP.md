# CommOS — Guía de instalación y puesta en marcha

## 1. Instalar Node.js (solo la primera vez)

Abrí **PowerShell como Administrador** y ejecutá:

```powershell
winget install OpenJS.NodeJS.LTS
```

Luego cerrá y volvé a abrir la terminal para que el PATH se actualice.

## 2. Instalar dependencias del proyecto

Desde el directorio del proyecto:

```powershell
cd C:\Users\renrique\AIcelerator
npm install
```

## 3. Configurar Supabase

1. Copiá el archivo de ejemplo:
   ```powershell
   copy .env.example .env
   ```
   (Ya viene con las credenciales del proyecto actual)

2. Si querés migrar a un nuevo proyecto Supabase:
   - Creá un proyecto en https://supabase.com
   - Ejecutá las migraciones en orden: `supabase/migrations/001_initial_schema.sql` y luego `002_seed_data.sql`
   - Actualizá `.env` con la nueva URL y anon key

## 4. Correr en modo desarrollo

```powershell
npm run dev
```

Abrirá en http://localhost:5173

## 5. Primer acceso

Al entrar por primera vez:
- Registrá un usuario nuevo (aparece el formulario de signup)
- Luego en Supabase Dashboard → Table Editor → profiles:
  - Cambiá el `role` de tu usuario a `super_admin`
  - Esto te dará acceso completo

## 6. Build para producción

```powershell
npm run build
```

Los archivos quedan en `/dist`. Se puede deployar en Vercel, Netlify, o cualquier hosting estático.

---

## Arquitectura

```
src/
├── App.jsx                  # Root: AuthProvider + Shell + routing
├── contexts/
│   ├── AuthContext.jsx       # Auth + RBAC + permisos
│   └── AppContext.jsx        # Data: communications, countries, channels
├── pages/
│   ├── CalendarPage.jsx      # Vista calendario (tabla mensual)
│   ├── AnalyticsPage.jsx     # Dashboard de métricas
│   ├── DataMasterPage.jsx    # Tabla editable de datos
│   ├── AdminGlobalPage.jsx   # Vista por país + matriz
│   └── AdminPage.jsx         # Administración: usuarios, países, etc.
├── components/
│   ├── CommModal.jsx         # Modal crear/editar comunicación
│   ├── layout/
│   │   ├── Sidebar.jsx       # Navegación vertical
│   │   └── Toaster.jsx       # Notificaciones toast
│   └── ui/                   # Componentes base (Button, Input, etc.)
├── lib/
│   ├── supabase.js           # Cliente Supabase
│   ├── utils.js              # Helpers: fechas, calendar builder
│   └── constants.js          # Metadata: países, canales, estados
└── index.css                 # Variables CSS + Tailwind
```

## Roles

| Rol           | Ver | Crear | Editar | Eliminar | Admin |
|---------------|-----|-------|--------|----------|-------|
| super_admin   | ✅  | ✅    | ✅     | ✅       | ✅    |
| country_admin | ✅  | ✅    | ✅ *   | ✅ *     | ❌    |
| editor        | ✅  | ✅    | ✅ *   | ❌       | ❌    |
| viewer        | ✅  | ❌    | ❌     | ❌       | ❌    |

`*` Solo en sus países asignados
