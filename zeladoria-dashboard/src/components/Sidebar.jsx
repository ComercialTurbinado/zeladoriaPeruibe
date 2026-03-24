import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertCircle,
  KanbanSquare,
  Map,
  Shield,
  LogOut,
  Plus,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ocorrencias', icon: AlertCircle, label: 'Ocorrências' },
  { to: '/kanban', icon: KanbanSquare, label: 'Kanban' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
]

export default function Sidebar({ onNovaOcorrencia }) {
  const { admin, logout } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-slate-100 border-r border-slate-200 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="flex-shrink-0 w-9 h-9 bg-blue-900 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-blue-900 text-sm leading-tight">Zeladoria</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest">Painel Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 transition-all duration-150
               ${isActive
                 ? 'border-r-4 border-blue-700 bg-slate-200/50 translate-x-1 font-bold text-blue-900'
                 : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-800'
               }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 pb-2 space-y-2">
        {/* Nova Ocorrência button */}
        <button
          onClick={onNovaOcorrencia}
          className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Ocorrência
        </button>

        {/* Support + Sair */}
        <div className="flex items-center gap-2 pt-1">
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs transition-colors">
            <HelpCircle className="w-4 h-4" />
            Suporte
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Admin info at very bottom */}
      {admin && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-100">
          <p className="text-xs font-semibold text-slate-700 truncate">{admin.nome}</p>
          <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
        </div>
      )}
    </aside>
  )
}
