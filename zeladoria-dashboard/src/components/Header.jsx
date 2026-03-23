import { Bell, Settings, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Header({ title, subtitle, onRefresh, loading }) {
  const { admin } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-headline font-bold tracking-tight text-primary">{title}</h1>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button onClick={onRefresh} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-150">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-150 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-150">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-slate-200 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-on-surface leading-tight">{admin?.nome || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500">{admin?.role || 'Administrador'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {admin?.nome?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  )
}
