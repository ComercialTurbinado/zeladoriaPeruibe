// =============================================================
// CAMADA DE API — Zeladoria Dashboard
// =============================================================
// Esta camada abstrai todas as chamadas ao backend.
// Em modo MOCK (padrão), retorna dados locais.
// Em modo REAL, conecta ao zeladoria-api (Node.js + MongoDB).
//
// Para ativar modo real: VITE_USE_MOCK_API=false no .env
// =============================================================

import axios from 'axios'
import {
  mockOcorrencias,
  mockStats,
  mockCategoriasPizza,
  mockTendenciaSemanal,
  mockAdmins,
} from '../data/mockData.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false'

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeladoria_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zeladoria_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Helper para simular latência no mock ────────────────────
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// =============================================================
// AUTH
// =============================================================
export const authAPI = {
  /**
   * Login do administrador
   * n8n endpoint: POST /webhook/admin/login
   * Body: { email, senha }
   * Returns: { token, admin: { id, nome, email, role } }
   */
  async login(email, senha) {
    if (USE_MOCK) {
      await delay(600)
      const admin = mockAdmins.find(
        (a) => a.email === email && a.senha === senha
      )
      if (!admin) throw new Error('Credenciais inválidas')
      const fakeToken = btoa(JSON.stringify({ id: admin.id, email: admin.email, exp: Date.now() + 86400000 }))
      return { token: fakeToken, admin: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role } }
    }
    const res = await api.post('/admin/login', { email, senha })
    return res
  },

  async logout() {
    localStorage.removeItem('zeladoria_token')
    localStorage.removeItem('zeladoria_admin')
  },
}

// =============================================================
// OCORRÊNCIAS
// =============================================================
export const ocorrenciasAPI = {
  /**
   * Listar ocorrências com filtros
   * n8n endpoint: GET /webhook/ocorrencias?status=&categoria=&bairro=&criticidade=&page=&limit=
   */
  async listar(filtros = {}) {
    if (USE_MOCK) {
      await delay(400)
      let lista = [...mockOcorrencias]
      if (filtros.status) lista = lista.filter((o) => o.status === filtros.status)
      if (filtros.categoria) lista = lista.filter((o) => o.categoria === filtros.categoria)
      if (filtros.bairro) lista = lista.filter((o) => o.bairro.toLowerCase().includes(filtros.bairro.toLowerCase()))
      if (filtros.criticidade) lista = lista.filter((o) => o.criticidade === filtros.criticidade)
      if (filtros.busca) {
        const q = filtros.busca.toLowerCase()
        lista = lista.filter(
          (o) =>
            o.protocolo.toLowerCase().includes(q) ||
            o.descricao.toLowerCase().includes(q) ||
            o.bairro.toLowerCase().includes(q)
        )
      }
      return { data: lista, total: lista.length, page: 1, totalPages: 1 }
    }
    return api.get('/ocorrencias', { params: filtros })
  },

  /**
   * Buscar ocorrência por ID
   * n8n endpoint: GET /webhook/ocorrencias/:id
   */
  async buscarPorId(id) {
    if (USE_MOCK) {
      await delay(300)
      const item = mockOcorrencias.find((o) => o.id === Number(id))
      if (!item) throw new Error('Ocorrência não encontrada')
      return item
    }
    return api.get(`/ocorrencias/${id}`)
  },

  /**
   * Atualizar status de uma ocorrência
   * n8n endpoint: PATCH /webhook/ocorrencias/:id/status
   * Body: { status, observacao }
   * Side-effect n8n: Envia notificação WhatsApp ao cidadão via Evolution API
   */
  async atualizarStatus(id, novoStatus, observacao = '') {
    if (USE_MOCK) {
      await delay(500)
      const idx = mockOcorrencias.findIndex((o) => o.id === Number(id))
      if (idx === -1) throw new Error('Ocorrência não encontrada')
      const antiga = mockOcorrencias[idx]
      mockOcorrencias[idx] = {
        ...antiga,
        status: novoStatus,
        updated_at: new Date().toISOString(),
        logs: [
          ...antiga.logs,
          {
            status_anterior: antiga.status,
            status_novo: novoStatus,
            data: new Date().toISOString(),
            admin: 'Admin Dashboard',
            observacao,
          },
        ],
      }
      return mockOcorrencias[idx]
    }
    return api.patch(`/ocorrencias/${id}/status`, { status: novoStatus, observacao })
  },

  /**
   * Exportar lista de ocorrências como CSV
   * n8n endpoint: GET /webhook/ocorrencias/export?formato=csv
   */
  async exportar(filtros = {}, formato = 'csv') {
    if (USE_MOCK) {
      await delay(800)
      const { data } = await ocorrenciasAPI.listar(filtros)
      const headers = ['Protocolo', 'Categoria', 'Bairro', 'Status', 'Criticidade', 'Data', 'Cidadão']
      const rows = data.map((o) => [
        o.protocolo,
        o.categoria,
        o.bairro,
        o.status,
        o.criticidade,
        new Date(o.created_at).toLocaleString('pt-BR'),
        o.cidadao.anonimo ? 'Anônimo' : o.cidadao.nome,
      ])
      const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ocorrencias_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return { success: true }
    }
    // Em modo real: recebe blob CSV do n8n
    const response = await api.get('/ocorrencias/export', {
      params: { ...filtros, formato },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocorrencias_${new Date().toISOString().slice(0, 10)}.${formato}`
    a.click()
    return { success: true }
  },
}

// =============================================================
// DASHBOARD / ESTATÍSTICAS
// =============================================================
export const dashboardAPI = {
  /**
   * Estatísticas gerais do dashboard
   * n8n endpoint: GET /webhook/dashboard/stats
   */
  async getStats() {
    if (USE_MOCK) {
      await delay(300)
      return mockStats
    }
    return api.get('/dashboard/stats')
  },

  /**
   * Dados para gráfico de pizza (por categoria)
   * n8n endpoint: GET /webhook/dashboard/categorias
   */
  async getCategorias() {
    if (USE_MOCK) {
      await delay(300)
      return mockCategoriasPizza
    }
    return api.get('/dashboard/categorias')
  },

  /**
   * Tendência semanal de abertura e resolução
   * n8n endpoint: GET /webhook/dashboard/tendencia?periodo=7d
   */
  async getTendencia(periodo = '7d') {
    if (USE_MOCK) {
      await delay(300)
      return mockTendenciaSemanal
    }
    return api.get('/dashboard/tendencia', { params: { periodo } })
  },

  /**
   * Dados para mapa de calor (lat/lng + contagem por ponto)
   * n8n endpoint: GET /webhook/dashboard/mapa-calor
   */
  async getMapaCalor() {
    if (USE_MOCK) {
      await delay(400)
      return mockOcorrencias.map((o) => ({
        id: o.id,
        lat: o.latitude,
        lng: o.longitude,
        intensidade: o.criticidade === 'CRITICA' ? 4 : o.criticidade === 'ALTA' ? 3 : 2,
        protocolo: o.protocolo,
        categoria: o.categoria,
        status: o.status,
        criticidade: o.criticidade,
        bairro: o.bairro,
      }))
    }
    return api.get('/dashboard/mapa-calor')
  },
}

export default api
