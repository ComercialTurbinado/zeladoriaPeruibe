import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@zeladoria.gov.br')
  const [senha, setSenha] = useState('admin123')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !senha) { toast.error('Preencha todos os campos'); return }
    setLoading(true)
    try {
      await login(email, senha)
      toast.success('Bem-vindo ao Zela Peruíbe!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 relative px-6">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Accent corner */}
        <div className="absolute -top-3 -left-3 w-16 h-16 bg-blue-200 rounded-xl -z-10 opacity-50" />

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="pt-12 pb-8 px-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-headline font-black text-3xl text-primary tracking-tight mb-2">Zela Peruíbe</h1>
            <p className="text-on-surface-variant font-medium text-xs tracking-widest uppercase">Painel Administrativo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-10 pb-12 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestor@prefeitura.gov.br"
                  disabled={loading}
                  className="w-full bg-slate-100 border-none rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm text-on-surface placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase">Senha</label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">Esqueceu o acesso?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-slate-100 border-none rounded-xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm text-on-surface placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container disabled:opacity-60 text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Acessar Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Shield className="w-3.5 h-3.5 text-secondary" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ambiente Governamental Seguro</span>
            </div>
          </form>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-xs font-medium text-slate-400">
          <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors">Suporte Técnico</a>
          <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
        </div>
      </div>

      {/* Watermark */}
      <div className="fixed bottom-0 right-0 p-10 hidden lg:block">
        <div className="flex flex-col items-end opacity-10">
          <p className="font-headline font-black text-6xl text-primary leading-none">CITY</p>
          <p className="font-headline font-black text-6xl text-primary leading-none">ADMIN</p>
        </div>
      </div>
    </div>
  )
}
