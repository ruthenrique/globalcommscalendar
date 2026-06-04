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
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[9px] font-black tracking-tight">GCH</span>
          </div>
          <div>
            <div className="text-sm font-black text-gray-900 tracking-tight leading-none">Global Comms Hub</div>
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">BSG</div>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 uppercase tracking-widest hidden sm:block">
          Internal Communications Platform
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {mode === 'confirm' ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-6">📧</div>
              <h1 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Revisá tu email</h1>
              <p className="text-sm text-gray-500 mb-8">
                Enviamos un link de confirmación a <span className="text-gray-900 font-medium">{email}</span>.
              </p>
              <button onClick={() => setMode('login')} className="text-xs text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">
                ← Volver
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-10">
                <div className="w-8 h-px bg-gray-900 mb-6" />
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                  {mode === 'login' ? 'Iniciar\nsesión' : 'Crear\ncuenta'}
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="name" className="text-[10px] text-gray-400 uppercase tracking-widest">Nombre completo</Label>
                    <Input
                      id="name" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Ana García" required
                      className="mt-2 h-10 text-sm border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 bg-transparent placeholder:text-gray-300"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email" className="text-[10px] text-gray-400 uppercase tracking-widest">Email</Label>
                  <Input
                    id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@empresa.com" required
                    className="mt-2 h-10 text-sm border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 bg-transparent placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[10px] text-gray-400 uppercase tracking-widest">Contraseña</Label>
                  <Input
                    id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="mt-2 h-10 text-sm border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-900 bg-transparent placeholder:text-gray-300"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-500 py-2 border-l-2 border-red-500 pl-3">
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-11 text-sm bg-gray-900 hover:bg-black text-white rounded-none font-semibold tracking-wide"
                    disabled={loading}
                  >
                    {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-xs text-gray-400 text-center">
                {mode === 'login' ? (
                  <>¿No tenés cuenta?{' '}
                    <button onClick={() => setMode('signup')} className="text-gray-900 hover:underline underline-offset-2">Registrate</button>
                  </>
                ) : (
                  <>¿Ya tenés cuenta?{' '}
                    <button onClick={() => setMode('login')} className="text-gray-900 hover:underline underline-offset-2">Iniciá sesión</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-gray-100">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest text-center">
          Global Comms Hub · BSG · Internal use only
        </p>
      </div>

    </div>
  )
}
