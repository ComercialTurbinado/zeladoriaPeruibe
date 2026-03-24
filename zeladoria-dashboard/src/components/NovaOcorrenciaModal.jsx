import { useState } from 'react'
import { X, Send, MapPin, User, Phone, FileText, AlertTriangle } from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, CRITICIDADE } from '../data/mockData.js'
import toast from 'react-hot-toast'

const BAIRROS = [
  'Centro', 'Vila Nova', 'Jardim América', 'Bela Vista', 'Jardins',
  'Balneário Gaivota', 'Balneário Stella Maris', 'Guaratuba', 'Helvécia',
  'Mirim', 'Outros',
]

const initialForm = {
  categoria: '',
  descricao: '',
  criticidade: 'MEDIA',
  bairro: '',
  rua: '',
  cidadao_nome: '',
  cidadao_telefone: '',
  cidadao_anonimo: false,
  latitude: '',
  longitude: '',
}

export default function NovaOcorrenciaModal({ onClose, onCriada }) {
  const [form, setForm] = useState(initialForm)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState({})

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (erros[key]) setErros(prev => ({ ...prev, [key]: '' }))
  }

  function validar() {
    const e = {}
    if (!form.categoria) e.categoria = 'Selecione uma categoria'
    if (!form.descricao || form.descricao.length < 10) e.descricao = 'Descreva com pelo menos 10 caracteres'
    if (!form.bairro) e.bairro = 'Informe o bairro'
    if (!form.cidadao_anonimo && !form.cidadao_telefone) e.cidadao_telefone = 'Informe o telefone ou marque como anônimo'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errosVal = validar()
    if (Object.keys(errosVal).length > 0) {
      setErros(errosVal)
      return
    }

    setSalvando(true)
    try {
      // Gera protocolo automático (será sobrescrito pelo backend em modo real)
      const ano = new Date().getFullYear()
      const protocolo = `ZLD-${ano}-${String(Date.now()).slice(-4)}`

      const dados = {
        protocolo,
        categoria: form.categoria,
        descricao: form.descricao,
        criticidade: form.criticidade,
        bairro: form.bairro,
        rua: form.rua || '',
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        cidadao: {
          nome: form.cidadao_anonimo ? 'Anônimo' : (form.cidadao_nome || 'Não informado'),
          telefone: form.cidadao_anonimo ? '' : form.cidadao_telefone,
          anonimo: form.cidadao_anonimo,
        },
        midias: [],
      }

      const nova = await ocorrenciasAPI.criar(dados)
      toast.success(`Ocorrência ${nova.protocolo} criada com sucesso!`)
      onCriada?.(nova)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.erro || 'Erro ao criar ocorrência')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-blue-700">
          <div>
            <h2 className="text-white font-bold text-lg">Nova Ocorrência</h2>
            <p className="text-blue-200 text-xs mt-0.5">Registrar manualmente via painel administrativo</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Categoria + Criticidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.categoria ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              >
                <option value="">Selecione...</option>
                {Object.entries(CATEGORIAS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              {erros.categoria && <p className="text-red-500 text-xs mt-1">{erros.categoria}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Criticidade
              </label>
              <select
                value={form.criticidade}
                onChange={e => set('criticidade', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CRITICIDADE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Descreva o problema em detalhes..."
              rows={3}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.descricao ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {erros.descricao && <p className="text-red-500 text-xs mt-1">{erros.descricao}</p>}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Localização <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={form.bairro}
                  onChange={e => set('bairro', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.bairro ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                >
                  <option value="">Bairro *</option>
                  {BAIRROS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {erros.bairro && <p className="text-red-500 text-xs mt-1">{erros.bairro}</p>}
              </div>
              <input
                type="text"
                value={form.rua}
                onChange={e => set('rua', e.target.value)}
                placeholder="Rua / Referência"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="Latitude (opcional)"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="Longitude (opcional)"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cidadão */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Dados do Cidadão
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cidadao_anonimo}
                  onChange={e => set('cidadao_anonimo', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-700"
                />
                Denúncia anônima
              </label>
            </div>

            {!form.cidadao_anonimo && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.cidadao_nome}
                  onChange={e => set('cidadao_nome', e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={form.cidadao_telefone}
                      onChange={e => set('cidadao_telefone', e.target.value)}
                      placeholder="+55 13 99999-0000"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.cidadao_telefone ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                  </div>
                  {erros.cidadao_telefone && <p className="text-red-500 text-xs mt-1">{erros.cidadao_telefone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              O protocolo será gerado automaticamente. Se o cidadão tiver telefone cadastrado, ele receberá confirmação via WhatsApp.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-60 rounded-xl transition"
          >
            {salvando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {salvando ? 'Registrando...' : 'Registrar Ocorrência'}
          </button>
        </div>
      </div>
    </div>
  )
}
