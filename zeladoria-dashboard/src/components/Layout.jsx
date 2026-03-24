import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import NovaOcorrenciaModal from './NovaOcorrenciaModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()
  const [modalAberto, setModalAberto] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar onNovaOcorrencia={() => setModalAberto(true)} />
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>

      {modalAberto && (
        <NovaOcorrenciaModal
          onClose={() => setModalAberto(false)}
          onCriada={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
