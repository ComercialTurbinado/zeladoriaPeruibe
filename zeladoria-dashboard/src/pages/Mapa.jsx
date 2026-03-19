import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet'
import { dashboardAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS } from '../data/mockData.js'
import Header from '../components/Header.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

const COR_STATUS = {
  ABERTO: '#ef4444',
  TRIAGEM: '#f59e0b',
  ANALISE: '#3b82f6',
  EXECUCAO: '#8b5cf6',
  CONCLUIDO: '#22c55e',
  CANCELADO: '#9ca3af',
}

const RAIO_CRITICIDADE = {
  BAIXA: 7,
  MEDIA: 10,
  ALTA: 14,
  CRITICA: 18,
}

export default function Mapa() {
  const [pontos, setPontos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const data = await dashboardAPI.getMapaCalor()
      setPontos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Mapa de Ocorrências"
        subtitle="Visualização geográfica de todos os chamados"
        onRefresh={carregar}
        loading={loading}
      />

      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* Legenda e filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legenda por Status</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(STATUS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setFiltroStatus(filtroStatus === k ? '' : k)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    filtroStatus === k || filtroStatus === ''
                      ? 'opacity-100'
                      : 'opacity-40'
                  } ${v.color}`}
                >
                  <span className={`w-2 h-2 rounded-full`} style={{ background: COR_STATUS[k] }} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tamanho = Criticidade</p>
            <div className="flex items-end gap-3">
              {Object.entries(RAIO_CRITICIDADE).map(([k, r]) => (
                <div key={k} className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-blue-400 opacity-70" style={{ width: r * 2, height: r * 2 }} />
                  <span className="text-xs text-gray-400">{k.charAt(0) + k.slice(1).toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: 500 }}>
          <MapContainer
            center={[-23.5505, -46.6333]}
            zoom={14}
            style={{ height: '100%', width: '100%', minHeight: 500 }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            {pontos
              .filter((p) => !filtroStatus || p.status === filtroStatus)
              .map((p, i) => (
                <CircleMarker
                  key={i}
                  center={[p.lat, p.lng]}
                  radius={(RAIO_CRITICIDADE[p.criticidade] || 10)}
                  fillColor={COR_STATUS[p.status] || COR_STATUS.ABERTO}
                  color="white"
                  weight={2}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-40">
                      <p className="font-bold text-sm">{p.protocolo}</p>
                      <p className="text-gray-600">{CATEGORIAS[p.categoria]?.label}</p>
                      <StatusBadge status={p.status || 'ABERTO'} />
                      <Link
                        to={`/ocorrencias/${p.id}`}
                        className="block mt-2 text-center text-blue-600 hover:underline"
                      >
                        Ver detalhes →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
