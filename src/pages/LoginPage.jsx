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
    <div className="min-h-screen bg-[#f5f4f1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <span className="text-white font-bold text-base">C</span>
          </div>
          <div>
            <div className="text-slate-800 font-semibold text-base">CommOS</div>
            <div className="text-slate-400 text-xs">Global 2026</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          {mode === 'confirm' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h1 className="text-base font-semibold mb-2">Revisá tu email</h1>
              <p className="text-sm text-slate-500 mb-4">
                Te enviamos un link de confirmación a <strong>{email}</strong>.
              </p>
              <button onClick={() => setMode('login')} className="text-slate-600 text-sm hover:underline">
                ← Volver
              </button>
            </div>
          ) : (
          <>
            <h1 className="text-lg font-semibold text-slate-800 mb-0.5">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="text-xs text-slate-400 mb-5">
              {mode === 'login' ? 'Ingresá tus credenciales para continuar' : 'Completá los datos para registrarte'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="name" className="text-xs text-slate-600">Nombre completo</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ana García" required className="mt-1 h-9 text-sm" />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-xs text-slate-600">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.com" required className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="password" className="text-xs text-slate-600">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 h-9 text-sm" />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-9 text-sm bg-slate-800 hover:bg-slate-700" disabled={loading}>
                {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <>¿No tenés cuenta?{' '}
                  <button onClick={() => setMode('signup')} className="text-slate-600 hover:underline">Registrate</button>
                </>
              ) : (
                <>¿Ya tenés cuenta?{' '}
                  <button onClick={() => setMode('login')} className="text-slate-600 hover:underline">Iniciá sesión</button>
                </>
              )}
            </div>
          </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Plataforma de Comunicación Interna · BSG
        </p>
      </div>
    </div>
  )
}
