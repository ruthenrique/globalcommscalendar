import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    let err
    if (mode === 'login') {
      err = await signIn(email, password)
    } else {
      err = await signUp(email, password, name)
      if (!err) { setError(''); setMode('confirm') }
    }
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#0d0d1a',
        backgroundImage: `
          radial-gradient(at 15% 20%, hsla(270,80%,60%,0.55) 0px, transparent 50%),
          radial-gradient(at 85% 10%, hsla(200,90%,55%,0.45) 0px, transparent 50%),
          radial-gradient(at 75% 80%, hsla(320,70%,55%,0.45) 0px, transparent 50%),
          radial-gradient(at 10% 85%, hsla(240,85%,65%,0.4) 0px, transparent 50%),
          radial-gradient(at 50% 50%, hsla(170,60%,50%,0.2) 0px, transparent 60%)
        `,
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-base">G</span>
          </div>
          <div>
            <div className="text-white font-semibold text-base tracking-tight">Global Comms Hub</div>
            <div className="text-white/40 text-xs">BSG</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/15">
          {mode === 'confirm' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h1 className="text-base font-semibold mb-2 text-white">Revisá tu email</h1>
              <p className="text-sm text-white/60 mb-4">
                Te enviamos un link de confirmación a <strong className="text-white/80">{email}</strong>.
              </p>
              <button onClick={() => setMode('login')} className="text-white/60 text-sm hover:text-white transition-colors">
                ← Volver
              </button>
            </div>
          ) : (
          <>
            <h1 className="text-lg font-semibold text-white mb-0.5">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="text-xs text-white/50 mb-5">
              {mode === 'login' ? 'Ingresá tus credenciales para continuar' : 'Completá los datos para registrarte'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="name" className="text-xs text-white/70">Nombre completo</Label>
                  <Input
                    id="name" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ana García" required
                    className="mt-1 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/10"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-xs text-white/70">Email</Label>
                <Input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com" required
                  className="mt-1 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/10"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-xs text-white/70">Contraseña</Label>
                <Input
                  id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="mt-1 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/10"
                />
              </div>

              {error && (
                <div className="text-xs text-red-300 bg-red-500/15 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-9 text-sm bg-white text-slate-900 hover:bg-white/90 font-medium"
                disabled={loading}
              >
                {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-white/40">
              {mode === 'login' ? (
                <>¿No tenés cuenta?{' '}
                  <button onClick={() => setMode('signup')} className="text-white/70 hover:text-white transition-colors">Registrate</button>
                </>
              ) : (
                <>¿Ya tenés cuenta?{' '}
                  <button onClick={() => setMode('login')} className="text-white/70 hover:text-white transition-colors">Iniciá sesión</button>
                </>
              )}
            </div>
          </>
          )}
        </div>

        <p className="text-center text-xs text-white/25 mt-6">
          Global Comms Hub · BSG
        </p>
      </div>
    </div>
  )
}
