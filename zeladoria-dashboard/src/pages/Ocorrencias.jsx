import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Download, MapPin, Calendar, Eye, RefreshCw } from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS, CRITICIDADE } from '../data/mockData.js'
import Header from '../components/Header.jsx'
import { StatusBadge, CriticidadeBadge } from '../components/StatusBadge.jsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const BAIRROS = ['Todos', 'Centro', 'Vila Nova', 'Jardim América', 'Bela Vista']

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [filtros, setFiltros] = useState({
    busca: '',
    status: '',
    categoria: '',
    bairro: '',
    criticidade: '',
  })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== '')
      )
      const res = await ocorrenciasAPI.listar(params)
      setOcorrencias(res.data)
      setTotal(res.total)
    } catch (err) {
      toast.error('Erro ao carregar ocorrências')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    const timer = setTimeout(carregar, 300)
    return () => clearTimeout(timer)
  }, [carregar])

  async function handleExportar() {
    setExportando(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== '')
      )
      await ocorrenciasAPI.exportar(params, 'csv')
      toast.success('CSV exportado com sucesso!')
    } catch {
      toast.error('Erro ao exportar')
    } finally {
      setExportando(false)
    }
  }

  function setFiltro(key, value) {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Ocorrências"
        subtitle={`${total} registro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        onRefresh={carregar}
        loading={loading}
      />

      <div className="p-6 space-y-4">
        {/* Barra de filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar protocolo, bairro ou descrição..."
                value={filtros.busca}
                onChange={(e) => setFiltro('busca', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <select
              value={filtros.status}
              onChange={(e) => setFiltro('status', e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-36"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Categoria */}
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltro('categoria', e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-40"
            >
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORIAS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>

            {/* Criticidade */}
            <select
              value={filtros.criticidade}
              onChange={(e) => setFiltro('criticidade', e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-36"
            >
              <option value="">Criticidade</option>
              {Object.entries(CRITICIDADE).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Exportar */}
            <button
              onClick={handleExportar}
              disabled={exportando}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
            >
              {exportando
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Carregando...</p>
              </div>
            </div>
          ) : ocorrencias.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma ocorrência encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Protocolo', 'Categoria', 'Localização', 'Cidadão', 'Status', 'Criticidade', 'Data', 'Ações'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ocorrencias.map((oc) => (
                    <tr key={oc.id} className="hover:bg-gray-50 transition group">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-600 font-medium">{oc.protocolo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{CATEGORIAS[oc.categoria]?.icon}</span>
                          <span className="text-sm text-gray-700 whitespace-nowrap">{CATEGORIAS[oc.categoria]?.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{oc.bairro}</p>
                            <p className="text-xs text-gray-400 truncate max-w-32">{oc.rua}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {oc.cidadao.anonimo ? (
                            <span className="text-gray-400 italic">Anônimo</span>
                          ) : oc.cidadao.nome}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={oc.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CriticidadeBadge criticidade={oc.criticidade} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">
                            {format(new Date(oc.created_at), 'dd/MM/yy', { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/ocorrencias/${oc.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
