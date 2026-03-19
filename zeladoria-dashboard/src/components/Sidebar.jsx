import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertCircle,
  KanbanSquare,
  Map,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ocorrencias', icon: AlertCircle, label: 'Ocorrências' },
  { to: '/kanban', icon: KanbanSquare, label: 'Kanban' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { admin, logout } = useAuth()

  return (
    <aside
      className={`
        flex flex-col bg-blue-900 text-white transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        min-h-screen shrink-0
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-blue-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">Zeladoria</p>
            <p className="text-blue-300 text-xs">Painel Admin</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
               ${isActive
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                 : 'text-blue-200 hover:bg-blue-800 hover:text-white'
               }
               ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Admin Info + Logout */}
      <div className="border-t border-blue-800 p-3 space-y-1">
        {!collapsed && admin && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{admin.nome}</p>
            <p className="text-xs text-blue-300 truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-200 hover:bg-red-600 hover:text-white transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-20 -right-3 bg-blue-700 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-blue-900 transition-colors"
        style={{ position: 'sticky', bottom: 20, alignSelf: 'flex-end', marginRight: collapsed ? -12 : -12 }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
