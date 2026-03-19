import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import {
  AlertCircle, CheckCircle2, Clock, TrendingUp,
  Users, Timer, Star, ArrowUpRight,
} from 'lucide-react'
import { dashboardAPI, ocorrenciasAPI } from '../api/zeladoria.js'
import Header from '../components/Header.jsx'
import { StatusBadge, CriticidadeBadge } from '../components/StatusBadge.jsx'
import { CATEGORIAS } from '../data/mockData.js'

function StatCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const CALOR_COLORS = {
  ABERTO: '#ef4444',
  TRIAGEM: '#f59e0b',
  ANALISE: '#3b82f6',
  EXECUCAO: '#8b5cf6',
  CONCLUIDO: '#22c55e',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [tendencia, setTendencia] = useState([])
  const [mapaData, setMapaData] = useState([])
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const [s, c, t, m, r] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCategorias(),
        dashboardAPI.getTendencia(),
        dashboardAPI.getMapaCalor(),
        ocorrenciasAPI.listar({ limit: 5 }),
      ])
      setStats(s)
      setCategorias(c)
      setTendencia(t)
      setMapaData(m)
      setRecentes(r.data.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Dashboard"
        subtitle="Visão geral das ocorrências do município"
        onRefresh={carregar}
        loading={loading}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={AlertCircle} label="Total" value={stats.total} color="blue" trend={12} />
            <StatCard icon={AlertCircle} label="Abertas" value={stats.abertas} color="red" sub="Aguardando triagem" />
            <StatCard icon={Clock} label="Em andamento" value={stats.em_andamento} color="yellow" />
            <StatCard icon={CheckCircle2} label="Concluídas" value={stats.concluidas} color="green" trend={8} />
            <StatCard icon={Timer} label="Média resolução" value={`${stats.media_resolucao_horas}h`} color="purple" />
            <StatCard icon={Star} label="Satisfação" value={`${stats.nps_satisfacao}%`} color="green" trend={3} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Categorias */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ocorrências por Categoria</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categorias}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categorias.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ocorrências`, name]}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tendência Semanal */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendência Semanal</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tendencia} barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="abertas" name="Abertas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mapa + Recentes */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Mapa de Calor */}
          <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Mapa de Ocorrências</h3>
              <p className="text-xs text-gray-400 mt-0.5">Distribuição geográfica · últimos 30 dias</p>
            </div>
            <div style={{ height: 360 }}>
              <MapContainer
                center={[-23.5505, -46.6333]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                {mapaData.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={[p.lat, p.lng]}
                    radius={8 + p.intensidade * 3}
                    fillColor={CALOR_COLORS.ABERTO}
                    color="white"
                    weight={2}
                    fillOpacity={0.75}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-semibold">{p.protocolo}</p>
                        <p className="text-gray-500">{CATEGORIAS[p.categoria]?.label}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Ocorrências Recentes */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Ocorrências Recentes</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimas registradas</p>
              </div>
              <Link
                to="/ocorrencias"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                Ver todas <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentes.map((oc) => (
                <Link
                  key={oc.id}
                  to={`/ocorrencias/${oc.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition group"
                >
                  <span className="text-2xl mt-0.5 leading-none">
                    {CATEGORIAS[oc.categoria]?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{oc.protocolo}</span>
                      <StatusBadge status={oc.status} />
                    </div>
                    <p className="text-sm text-gray-700 truncate">{oc.descricao}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{oc.bairro}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
