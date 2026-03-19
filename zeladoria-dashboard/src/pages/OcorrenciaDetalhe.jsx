import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import {
  ArrowLeft, MapPin, User, Phone, Calendar, Clock,
  CheckCircle2, AlertTriangle, Image, Video, Send, ChevronRight,
} from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS } from '../data/mockData.js'
import { StatusBadge, CriticidadeBadge } from '../components/StatusBadge.jsx'
import Header from '../components/Header.jsx'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const FLUXO_STATUS = ['ABERTO', 'TRIAGEM', 'ANALISE', 'EXECUCAO', 'CONCLUIDO']

export default function OcorrenciaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [oc, setOc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [midiaAtiva, setMidiaAtiva] = useState(0)

  async function carregar() {
    setLoading(true)
    try {
      const data = await ocorrenciasAPI.buscarPorId(id)
      setOc(data)
      setNovoStatus(data.status)
    } catch (err) {
      toast.error('Ocorrência não encontrada')
      navigate('/ocorrencias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [id])

  async function handleAtualizarStatus() {
    if (!novoStatus || novoStatus === oc.status) {
      toast.error('Selecione um status diferente do atual')
      return
    }
    setAtualizando(true)
    try {
      const updated = await ocorrenciasAPI.atualizarStatus(id, novoStatus, observacao)
      setOc(updated)
      setObservacao('')
      toast.success(`Status atualizado para "${STATUS[novoStatus]?.label}"`)
    } catch (err) {
      toast.error('Erro ao atualizar status')
    } finally {
      setAtualizando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando ocorrência...</p>
        </div>
      </div>
    )
  }

  if (!oc) return null

  const cat = CATEGORIAS[oc.categoria]
  const idxStatusAtual = FLUXO_STATUS.indexOf(oc.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`Ocorrência ${oc.protocolo}`}
        subtitle={`${cat?.label} · ${oc.bairro}`}
      />

      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/ocorrencias" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Ocorrências
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{oc.protocolo}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Header da ocorrência */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{cat?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{cat?.label}</h2>
                    <p className="text-sm text-gray-500 font-mono">{oc.protocolo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CriticidadeBadge criticidade={oc.criticidade} />
                  <StatusBadge status={oc.status} />
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 text-sm">
                {oc.descricao}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {oc.rua}, {oc.bairro}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {format(new Date(oc.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDistanceToNow(new Date(oc.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Galeria de Mídias */}
            {oc.midias?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4" /> Mídias anexadas ({oc.midias.length})
                </h3>
                <div className="relative">
                  <img
                    src={oc.midias[midiaAtiva]?.url}
                    alt="Mídia da ocorrência"
                    className="w-full h-72 object-cover rounded-xl"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Imagem+indisponível' }}
                  />
                  {oc.midias[midiaAtiva]?.tipo === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-4">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                {oc.midias.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {oc.midias.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setMidiaAtiva(i)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === midiaAtiva ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                      >
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                        {m.tipo === 'VIDEO' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Localização Exata
                </h3>
              </div>
              <div style={{ height: 280 }}>
                <MapContainer
                  center={[oc.latitude, oc.longitude]}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  />
                  <Marker position={[oc.latitude, oc.longitude]}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold">{oc.protocolo}</p>
                        <p>{oc.rua}, {oc.bairro}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="px-5 py-3 bg-gray-50 text-xs text-gray-500 font-mono">
                📍 {oc.latitude.toFixed(6)}, {oc.longitude.toFixed(6)}
              </div>
            </div>

            {/* Timeline de status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Histórico de Status
              </h3>
              <div className="space-y-0">
                {[...oc.logs].reverse().map((log, i) => (
                  <div key={i} className="relative flex gap-4">
                    {i < oc.logs.length - 1 && (
                      <div className="absolute left-3 top-7 bottom-0 w-0.5 bg-gray-100" />
                    )}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-800">
                        {STATUS[log.status_novo]?.label}
                        {log.status_anterior && (
                          <span className="text-gray-400 font-normal ml-1.5">
                            ← {STATUS[log.status_anterior]?.label}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.admin} · {format(new Date(log.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {log.observacao && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1.5">
                          {log.observacao}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Progresso do fluxo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Fluxo de Atendimento</h3>
              <div className="space-y-2">
                {FLUXO_STATUS.map((s, i) => {
                  const isCurrent = s === oc.status
                  const isDone = i < idxStatusAtual
                  return (
                    <div key={s} className={`flex items-center gap-3 p-2.5 rounded-xl transition ${isCurrent ? 'bg-blue-50' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-green-500' : isCurrent ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <span className="text-xs text-white font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm ${isCurrent ? 'font-semibold text-blue-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                        {STATUS[s]?.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alterar status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Atualizar Status
              </h3>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observação sobre a mudança (opcional)..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAtualizarStatus}
                disabled={atualizando || novoStatus === oc.status}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl transition"
              >
                {atualizando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {atualizando ? 'Atualizando...' : 'Salvar alteração'}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Cidadão será notificado via WhatsApp automaticamente
              </p>
            </div>

            {/* Dados do cidadão */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Cidadão
              </h3>
              {oc.cidadao.anonimo ? (
                <p className="text-sm text-gray-400 italic">Denúncia anônima</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">{oc.cidadao.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{oc.cidadao.telefone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
