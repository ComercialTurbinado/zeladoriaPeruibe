import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, FileText, ExternalLink } from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS, CRITICIDADE } from '../data/mockData.js'
import Header from '../components/Header.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STATUS_BADGE_MAP = {
  ABERTO:    'bg-blue-100 text-blue-700',
  TRIAGEM:   'bg-yellow-100 text-yellow-700',
  ANALISE:   'bg-purple-100 text-purple-700',
  EXECUCAO:  'bg-orange-100 text-orange-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
}

const CRIT_MAP = {
  ALTA:  { dot: 'bg-red-500',   text: 'text-red-600',   label: 'Alta' },
  MEDIA: { dot: 'bg-slate-400', text: 'text-slate-500',  label: 'Média' },
  BAIXA: { dot: 'bg-slate-300', text: 'text-slate-400',  label: 'Baixa' },
}

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [filtros, setFiltros] = useState({ busca: '', status: '', categoria: '', bairro: '', criticidade: '' })

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      const res = await ocorrenciasAPI.listar(params)
      setOcorrencias(res.data)
      setTotal(res.total)
    } catch {
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
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
      await ocorrenciasAPI.exportar(params, 'csv')
      toast.success('CSV exportado!')
    } catch {
      toast.error('Erro ao exportar')
    } finally {
      setExportando(false)
    }
  }

  function setFiltro(key, value) {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header title="Ocorrências" subtitle="Listagem de Ocorrências" onRefresh={carregar} loading={loading} />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-primary mb-2">Monitoramento Urbano</h2>
            <p className="text-on-surface-variant max-w-xl text-sm">Gerencie e analise as ocorrências em tempo real. Utilize os filtros avançados para otimizar a resposta das equipes de campo.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportar} disabled={exportando} className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all border border-slate-200 disabled:opacity-60">
              <FileText className="w-4 h-4" />
              Exportar CSV
            </button>
            <button className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all border border-slate-200">
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Busca Rápida</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filtros.busca}
                onChange={e => setFiltro('busca', e.target.value)}
                placeholder="Buscar por ID, Categoria ou Descrição..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Bairro</label>
              <select value={filtros.bairro} onChange={e => setFiltro('bairro', e.target.value)} className="bg-white border-none rounded-lg text-xs font-semibold py-2.5 px-3 focus:ring-1 focus:ring-primary shadow-sm">
                <option value="">Todos os Bairros</option>
                <option value="Centro">Centro</option>
                <option value="Vila Nova">Vila Nova</option>
                <option value="Jardim América">Jardim América</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Status</label>
              <select value={filtros.status} onChange={e => setFiltro('status', e.target.value)} className="bg-white border-none rounded-lg text-xs font-semibold py-2.5 px-3 focus:ring-1 focus:ring-primary shadow-sm">
                <option value="">Qualquer Status</option>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase">Criticidade</label>
              <select value={filtros.criticidade} onChange={e => setFiltro('criticidade', e.target.value)} className="bg-white border-none rounded-lg text-xs font-semibold py-2.5 px-3 focus:ring-1 focus:ring-primary shadow-sm">
                <option value="">Todas</option>
                {Object.entries(CRITICIDADE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-headline font-bold text-primary flex items-center gap-2">
              <span className="text-secondary">🗄️</span>
              Base de Dados de Ocorrências
            </h4>
            <span className="text-xs font-medium text-slate-500">Exibindo {ocorrencias.length} de {total} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['ID', 'Assunto', 'Bairro', 'Status', 'Criticidade', 'Data', 'Ações'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 text-sm">Carregando...</td></tr>
                ) : ocorrencias.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 text-sm">Nenhuma ocorrência encontrada</td></tr>
                ) : ocorrencias.map(oc => {
                  const crit = CRIT_MAP[oc.criticidade] || CRIT_MAP.MEDIA
                  const statusBg = STATUS_BADGE_MAP[oc.status] || 'bg-slate-100 text-slate-600'
                  return (
                    <tr key={oc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 text-sm font-bold text-primary">{oc.protocolo}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-on-surface">{oc.descricao?.slice(0, 40) || CATEGORIAS[oc.categoria]?.label}</span>
                          <span className="text-[10px] text-slate-400">{CATEGORIAS[oc.categoria]?.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">{oc.bairro}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBg}`}>
                          {STATUS[oc.status]?.label || oc.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 font-bold text-xs ${crit.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${crit.dot}`} />
                          {crit.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {format(new Date(oc.created_at), 'dd MMM, yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/ocorrencias/${oc.id}`} className="inline-flex items-center justify-center p-2 text-primary hover:bg-blue-50 rounded-lg transition-all group-hover:translate-x-0.5">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination placeholder */}
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-1">
              {['Anterior', '1', '2', '3', 'Próximo'].map((p, i) => (
                <button key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${p === '1' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
              ))}
            </div>
            <span className="text-xs text-slate-500">Itens por página: <strong className="text-primary">10</strong></span>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Ocorrências Ativas</p>
            <h5 className="text-4xl font-headline font-extrabold mb-4">{ocorrencias.filter(o => o.status !== 'CONCLUIDO').length}</h5>
            <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-2 py-1 rounded-lg">
              <span>↑ +12% esta semana</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tempo Médio de Resposta</p>
              <h5 className="text-4xl font-headline font-extrabold text-primary">2.4h</h5>
            </div>
            <div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div className="w-3/4 h-full bg-secondary rounded-full" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Meta institucional: abaixo de 3.0h</p>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-1">Status das Equipes</p>
                <h5 className="text-2xl font-headline font-extrabold text-green-900">8/10 Equipes em Campo</h5>
              </div>
              <div className="bg-white/60 p-2 rounded-xl">
                <span className="text-2xl">👷</span>
              </div>
            </div>
            <button className="text-xs font-bold text-green-700 underline underline-offset-4 decoration-2 hover:text-green-900 transition">Ver Mapa de Equipes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
