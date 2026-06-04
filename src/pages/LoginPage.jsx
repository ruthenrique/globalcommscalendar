import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]       = useState('login')  // 'login' | 'signup' | 'confirm'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    let err
    if (mode === 'login') {
      err = await signIn(email, password)
    } else {
      err = await signUp(email, password, name)
      if (!err) {
        setError('')
        setMode('confirm')
      }
    }
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <div className="text-white font-semibold text-lg">CommOS</div>
            <div className="text-slate-400 text-xs">Global 2026</div>
          </div>
        </div>

        {/* Setup tip */}
        {mode === 'login' && (
          <div className="bg-indigo-950/60 border border-indigo-800 rounded-xl p-3 mb-4 text-xs text-indigo-200">
            <span className="font-semibold">⚙️ Primera vez?</span> En{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline text-indigo-300">
              Supabase Dashboard
            </a>{' '}
            → Auth → Settings → desactivá <em>"Enable email confirmations"</em>{' '}
            para ingresar sin confirmar email.
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {mode === 'confirm' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h1 className="text-lg font-semibold mb-2">Revisá tu email</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Te enviamos un link de confirmación a <strong>{email}</strong>.
                Hacé click en el link y luego volvé aquí para iniciar sesión.
              </p>
              <button onClick={() => setMode('login')} className="text-primary text-sm hover:underline">
                ← Volver al login
              </button>
            </div>
          ) : (
          <>
          <h1 className="text-xl font-semibold mb-1">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === 'login'
              ? 'Ingresá tus credenciales para continuar'
              : 'Completá los datos para registrarte'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ana García"
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>

            {error && (
              <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                <div className="text-red-600 font-medium">{error}</div>
                {error.includes('not confirmed') && (
                  <div className="text-red-500 text-xs">
                    Para activar el acceso sin confirmación de email, andá a{' '}
                    <strong>Supabase Dashboard → Authentication → Settings</strong>{' '}
                    y desactivá <em>"Enable email confirmations"</em>.
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>¿No tenés cuenta?{' '}
                <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                  Registrate
                </button>
              </>
            ) : (
              <>¿Ya tenés cuenta?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                  Iniciá sesión
                </button>
              </>
            )}
          </div>
          </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Plataforma de Comunicación Interna · BSG
        </p>
      </div>
    </div>
  )
}
