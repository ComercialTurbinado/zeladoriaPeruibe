import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import {
  AlertCircle, CheckCircle2, Clock, TrendingUp,
  Timer, Star, ArrowUpRight, ArrowRight,
} from 'lucide-react'
import { dashboardAPI, ocorrenciasAPI } from '../api/zeladoria.js'
import Header from '../components/Header.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { CATEGORIAS } from '../data/mockData.js'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-blue-50', iconColor = 'text-blue-600', trend, borderColor }) {
  return (
    <div className={`bg-white rounded-xl p-6 flex flex-col justify-between h-40 hover:shadow-md transition-shadow border border-slate-100 ${borderColor ? `border-l-4 ${borderColor}` : ''}`}>
      <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-medium text-sm">{label}</span>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-headline font-black text-on-surface leading-none">{value}</h3>
        {sub && (
          <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend !== undefined && trend >= 0 ? 'text-secondary' : trend !== undefined ? 'text-error' : 'text-on-surface-variant'}`}>
            {trend !== undefined && <TrendingUp className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  )
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
    <div className="min-h-screen bg-surface">
      <Header
        title="Dashboard"
        subtitle="Visão geral das ocorrências do município"
        onRefresh={carregar}
        loading={loading}
      />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={AlertCircle}
              label="Total de Ocorrências"
              value={stats.total?.toLocaleString('pt-BR')}
              sub={`+12% vs mês anterior`}
              trend={12}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={Clock}
              label="Pendentes"
              value={stats.abertas}
              sub="Requer atenção imediata"
              iconBg="bg-red-50"
              iconColor="text-red-600"
              borderColor="border-red-500"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolvidas"
              value={stats.concluidas?.toLocaleString('pt-BR')}
              sub={`${stats.total ? Math.round((stats.concluidas / stats.total) * 100) : 0}% taxa de eficiência`}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              borderColor="border-green-500"
            />
            <StatCard
              icon={Timer}
              label="Tempo Médio de Resposta"
              value={`${stats.media_resolucao_horas}h`}
              sub="Meta: abaixo de 3h"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* Mapa + Donut */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Mapa de Calor */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-primary">Mapa de Calor de Ocorrências</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Densidade em tempo real por setor urbano</p>
              </div>
              <span className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">Ao Vivo</span>
            </div>
            <div style={{ height: 360 }}>
              <MapContainer
                center={[-23.9999, -46.3833]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© OpenStreetMap'
                />
                {mapaData.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={[p.lat, p.lng]}
                    radius={8 + p.intensidade * 3}
                    fillColor="#ef4444"
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

          {/* Serviços Mais Solicitados */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-headline font-bold text-primary">Serviços Mais Solicitados</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Distribuição por categoria</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
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
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 px-2">
                {categorias.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.fill }} />
                      <span className="text-on-surface-variant text-xs">{cat.name}</span>
                    </div>
                    <span className="font-bold text-on-surface text-xs">
                      {categorias.reduce((a, c) => a + c.value, 0) > 0
                        ? Math.round((cat.value / categorias.reduce((a, c) => a + c.value, 0)) * 100)
                        : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-primary">Recent Activity Feed</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Registro em tempo real de ações administrativas</p>
            </div>
            <Link to="/ocorrencias" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentes.map((oc) => (
              <Link
                key={oc.id}
                to={`/ocorrencias/${oc.id}`}
                className="flex items-start gap-4 px-6 py-4 hover:bg-surface-container-low/30 transition group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                  {CATEGORIAS[oc.categoria]?.icon || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-primary">#{oc.protocolo}</span>
                    <StatusBadge status={oc.status} />
                  </div>
                  <p className="text-sm text-on-surface truncate">{oc.descricao}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{oc.bairro}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                  {formatDistanceToNow(new Date(oc.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
