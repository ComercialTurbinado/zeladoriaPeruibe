import { useState, useRef } from 'react'
import {
  Search,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronRight,
  MapPin,
  Tag,
  CalendarDays,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { consultarStatusPublico } from '../api/zeladoria.js'

// ─── Configuração visual por status ───────────────────────────
const STATUS_CONFIG = {
  ABERTO: {
    label: 'Aberto',
    icon: AlertCircle,
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    progress: 10,
    desc: 'Seu chamado foi recebido e aguarda triagem pela equipe.',
  },
  TRIAGEM: {
    label: 'Em Triagem',
    icon: Clock,
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
    progress: 30,
    desc: 'A equipe está avaliando a prioridade e categoria do seu chamado.',
  },
  EM_ANALISE: {
    label: 'Em Análise',
    icon: Clock,
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    progress: 50,
    desc: 'Um técnico está analisando o problema relatado.',
  },
  ANALISE: {
    label: 'Em Análise',
    icon: Clock,
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    progress: 50,
    desc: 'Um técnico está analisando o problema relatado.',
  },
  EXECUCAO: {
    label: 'Em Execução',
    icon: RefreshCw,
    bar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    progress: 75,
    desc: 'A equipe de campo já está trabalhando na resolução.',
  },
  CONCLUIDO: {
    label: 'Concluído',
    icon: CheckCircle2,
    bar: 'bg-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    progress: 100,
    desc: 'O problema foi resolvido. Obrigado por contribuir com Peruíbe!',
  },
  FINALIZADO: {
    label: 'Concluído',
    icon: CheckCircle2,
    bar: 'bg-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    progress: 100,
    desc: 'O problema foi resolvido. Obrigado por contribuir com Peruíbe!',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: XCircle,
    bar: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    progress: 0,
    desc: 'Este chamado foi cancelado pela equipe de zeladoria.',
  },
  NAO_ENCONTRADO: {
    label: 'Não encontrado',
    icon: XCircle,
    bar: 'bg-gray-300',
    badge: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
    progress: 0,
    desc: '',
  },
}

function getStatusCfg(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG['ABERTO']
}

// ─── Formata data pt-BR ────────────────────────────────────────
function fmtData(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ─── Formata data curta ────────────────────────────────────────
function fmtDataCurta(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Componente: Resultado ─────────────────────────────────────
function ResultadoCard({ ocorrencia }) {
  const status = ocorrencia.status || 'ABERTO'
  const cfg = getStatusCfg(status)
  const StatusIcon = cfg.icon
  const naoEncontrado = status === 'NAO_ENCONTRADO'
  const logs = ocorrencia.logs || ocorrencia.historico || []

  if (naoEncontrado) {
    return (
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Protocolo não encontrado</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Não encontramos nenhum chamado com o protocolo{' '}
            <span className="font-mono font-semibold text-slate-700">{ocorrencia.protocolo}</span>.
            <br />Verifique o código e tente novamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Card principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header colorido */}
        <div className={`h-1.5 w-full ${cfg.bar}`} />

        <div className="px-6 py-5">
          {/* Protocolo + badge */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Protocolo</p>
              <h2 className="text-xl font-mono font-bold text-slate-900 tracking-wide">
                {ocorrencia.protocolo}
              </h2>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${cfg.badge}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400">Progresso do atendimento</span>
              <span className="text-xs font-bold text-slate-600">{cfg.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${cfg.progress}%` }}
              />
            </div>
            {cfg.desc && (
              <p className="text-xs text-slate-500 mt-2">{cfg.desc}</p>
            )}
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-slate-100" />

          {/* Detalhes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ocorrencia.categoria && (
              <InfoItem icon={Tag} label="Categoria" value={ocorrencia.categoria} />
            )}
            {(ocorrencia.bairro || ocorrencia.rua) && (
              <InfoItem
                icon={MapPin}
                label="Local"
                value={[ocorrencia.rua, ocorrencia.bairro].filter(Boolean).join(', ')}
              />
            )}
            {ocorrencia.created_at && (
              <InfoItem icon={CalendarDays} label="Abertura" value={fmtDataCurta(ocorrencia.created_at)} />
            )}
            {ocorrencia.updated_at && ocorrencia.updated_at !== ocorrencia.created_at && (
              <InfoItem icon={RefreshCw} label="Atualização" value={fmtDataCurta(ocorrencia.updated_at)} />
            )}
          </div>

          {/* Descrição */}
          {ocorrencia.descricao && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 font-medium mb-1">Descrição</p>
              <p className="text-sm text-slate-700 leading-relaxed">{ocorrencia.descricao}</p>
            </div>
          )}

          {/* Última observação */}
          {ocorrencia.ultimo_log?.observacao && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-500 font-medium mb-1">Última observação da equipe</p>
              <p className="text-sm text-blue-800 leading-relaxed">{ocorrencia.ultimo_log.observacao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline de logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Histórico de atualizações</h3>
          </div>
          <div className="px-6 py-4">
            <ol className="relative border-l border-slate-200 space-y-5 ml-2">
              {[...logs].reverse().map((log, i) => {
                const logStatus = log.status_novo || log.status || status
                const logCfg = getStatusCfg(logStatus)
                return (
                  <li key={i} className="ml-4">
                    <span className={`absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white ${logCfg.dot}`} />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block w-fit ${logCfg.badge}`}>
                        {logCfg.label}
                      </span>
                      <time className="text-[11px] text-slate-400">{fmtData(log.data || log.created_at)}</time>
                    </div>
                    {log.observacao && (
                      <p className="mt-1 text-xs text-slate-500">{log.observacao}</p>
                    )}
                    {(log.admin || log.responsavel) && (
                      <p className="text-[11px] text-slate-400 mt-0.5">por {log.admin || log.responsavel}</p>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-sm text-slate-700 font-medium leading-snug truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────
export default function ConsultarStatus() {
  const [protocolo, setProtocolo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)

  const protocoloFormatado = protocolo.toUpperCase().trim()
  const formatoValido = /^ZEL-\d{8}-[A-Z0-9]{3,}$/i.test(protocoloFormatado)

  async function consultar(e) {
    e?.preventDefault()
    if (!protocoloFormatado) {
      setErro('Informe o código do protocolo.')
      inputRef.current?.focus()
      return
    }
    if (!formatoValido) {
      setErro('Formato inválido. Use: ZEL-AAAAMMDD-XXXX')
      inputRef.current?.focus()
      return
    }
    setErro('')
    setLoading(true)
    setResultado(null)
    try {
      const data = await consultarStatusPublico(protocoloFormatado)
      // Normaliza: aceita { ocorrencia: {...} } ou o objeto direto
      setResultado(data?.ocorrencia || data)
    } catch (err) {
      setErro(err.message || 'Erro ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function limpar() {
    setProtocolo('')
    setResultado(null)
    setErro('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex flex-col">

      {/* Topo */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Zela Peruíbe</p>
            <p className="text-blue-300 text-[10px] uppercase tracking-widest">Peruíbe • SP</p>
          </div>
        </div>
        <a
          href="/login"
          className="text-xs text-blue-300 hover:text-white transition-colors flex items-center gap-1"
        >
          Área restrita <ArrowRight className="w-3 h-3" />
        </a>
      </header>

      {/* Conteúdo central */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-lg">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <ChevronRight className="w-3 h-3" />
              Portal do Cidadão
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
              Consultar status<br />
              <span className="text-blue-300">do seu chamado</span>
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed">
              Informe o código de protocolo recebido pelo WhatsApp<br className="hidden sm:block" />
              para acompanhar o andamento da sua solicitação.
            </p>
          </div>

          {/* Formulário */}
          <form
            onSubmit={consultar}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl"
          >
            <label className="block text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">
              Código do protocolo
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={protocolo}
                onChange={(e) => {
                  setProtocolo(e.target.value)
                  if (erro) setErro('')
                  if (resultado) setResultado(null)
                }}
                placeholder="ZEL-20260327-XXXX"
                autoComplete="off"
                spellCheck={false}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white placeholder-white/30
                  font-mono text-base tracking-wider focus:outline-none focus:ring-2 transition-all
                  ${erro
                    ? 'border-red-400/60 focus:ring-red-400/40'
                    : formatoValido && protocoloFormatado
                      ? 'border-green-400/60 focus:ring-green-400/40'
                      : 'border-white/20 focus:ring-blue-400/40'
                  }`}
                onKeyDown={(e) => e.key === 'Enter' && consultar()}
              />
              {formatoValido && protocoloFormatado && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
              )}
            </div>

            {/* Erro de validação */}
            {erro && (
              <p className="mt-2 text-red-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {erro}
              </p>
            )}

            <p className="mt-2 text-white/30 text-[11px]">
              Exemplo: ZEL-20260327-0XRG
            </p>

            {/* Botões */}
            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={loading || !protocoloFormatado}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400
                  disabled:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40
                  active:scale-95 text-white font-bold py-3 rounded-xl transition-all duration-150 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Consultar status
                  </>
                )}
              </button>

              {(resultado || protocolo) && !loading && (
                <button
                  type="button"
                  onClick={limpar}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20
                    text-white/70 hover:text-white rounded-xl text-sm transition-all duration-150 active:scale-95"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>

          {/* Resultado */}
          {resultado && <ResultadoCard ocorrencia={resultado} />}

          {/* Rodapé */}
          <div className="mt-10 text-center">
            <p className="text-white/20 text-[11px]">
              Canal oficial da Prefeitura de Peruíbe · Zela Peruíbe
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
