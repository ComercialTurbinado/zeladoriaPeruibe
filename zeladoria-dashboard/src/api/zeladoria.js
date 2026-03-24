// =============================================================
// CAMADA DE API — Zeladoria Dashboard
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
  timeout: 15000,
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

// ─── Normaliza doc MongoDB: adiciona id = _id.toString() ─────
function normalize(doc) {
  if (!doc) return doc
  return { ...doc, id: doc._id ? String(doc._id) : doc.id }
}

function normalizeList(list) {
  return Array.isArray(list) ? list.map(normalize) : list
}

// ─── Helper para simular latência no mock ────────────────────
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// =============================================================
// AUTH
// =============================================================
export const authAPI = {
  async login(email, senha) {
    if (USE_MOCK) {
      await delay(600)
      const admin = mockAdmins.find((a) => a.email === email && a.senha === senha)
      if (!admin) throw new Error('Credenciais inválidas')
      const fakeToken = btoa(JSON.stringify({ id: admin.id, email: admin.email, exp: Date.now() + 86400000 }))
      return { token: fakeToken, admin: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role } }
    }
    return api.post('/admin/login', { email, senha })
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
      const page = parseInt(filtros.page) || 1
      const limit = parseInt(filtros.limit) || 10
      const start = (page - 1) * limit
      const paginated = lista.slice(start, start + limit)
      return { data: paginated, total: lista.length, page, totalPages: Math.ceil(lista.length / limit) }
    }
    const res = await api.get('/ocorrencias', { params: filtros })
    return { ...res, data: normalizeList(res.data) }
  },

  async buscarPorId(id) {
    if (USE_MOCK) {
      await delay(300)
      const item = mockOcorrencias.find((o) => String(o.id) === String(id))
      if (!item) throw new Error('Ocorrência não encontrada')
      return item
    }
    const res = await api.get(`/ocorrencias/${id}`)
    return normalize(res)
  },

  async criar(dados) {
    if (USE_MOCK) {
      await delay(600)
      const novo = {
        id: Date.now(),
        protocolo: `ZLD-${new Date().getFullYear()}-${String(mockOcorrencias.length + 1).padStart(3, '0')}`,
        status: 'ABERTO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logs: [{ status_anterior: null, status_novo: 'ABERTO', admin: 'Admin Dashboard', data: new Date().toISOString() }],
        midias: [],
        ...dados,
      }
      mockOcorrencias.unshift(novo)
      return novo
    }
    const res = await api.post('/ocorrencias', dados)
    return normalize(res)
  },

  async atualizarStatus(id, novoStatus, observacao = '') {
    if (USE_MOCK) {
      await delay(500)
      const idx = mockOcorrencias.findIndex((o) => String(o.id) === String(id))
      if (idx === -1) throw new Error('Ocorrência não encontrada')
      const antiga = mockOcorrencias[idx]
      mockOcorrencias[idx] = {
        ...antiga,
        status: novoStatus,
        updated_at: new Date().toISOString(),
        logs: [
          ...antiga.logs,
          { status_anterior: antiga.status, status_novo: novoStatus, data: new Date().toISOString(), admin: 'Admin Dashboard', observacao },
        ],
      }
      return mockOcorrencias[idx]
    }
    const res = await api.patch(`/ocorrencias/${id}/status`, { status: novoStatus, observacao })
    return normalize(res)
  },

  async exportar(filtros = {}, formato = 'csv') {
    if (USE_MOCK) {
      await delay(800)
      const { data } = await ocorrenciasAPI.listar({ ...filtros, limit: 9999 })
      const headers = ['Protocolo', 'Categoria', 'Bairro', 'Status', 'Criticidade', 'Data', 'Cidadão']
      const rows = data.map((o) => [
        o.protocolo, o.categoria, o.bairro, o.status, o.criticidade,
        new Date(o.created_at).toLocaleString('pt-BR'),
        o.cidadao?.anonimo ? 'Anônimo' : o.cidadao?.nome,
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

  async uploadMidia(id, file) {
    if (USE_MOCK) {
      await delay(800)
      const idx = mockOcorrencias.findIndex((o) => String(o.id) === String(id))
      if (idx === -1) throw new Error('Ocorrência não encontrada')
      const fakeUrl = URL.createObjectURL(file)
      const tipo = file.type.startsWith('video') ? 'VIDEO' : 'FOTO'
      mockOcorrencias[idx].midias.push({ url: fakeUrl, tipo })
      return mockOcorrencias[idx]
    }
    const form = new FormData()
    form.append('midia', file)
    const res = await api.post(`/ocorrencias/${id}/midias`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return normalize(res)
  },
}

// =============================================================
// DASHBOARD / ESTATÍSTICAS
// =============================================================
export const dashboardAPI = {
  async getStats() {
    if (USE_MOCK) {
      await delay(300)
      return mockStats
    }
    return api.get('/dashboard/stats')
  },

  async getCategorias() {
    if (USE_MOCK) {
      await delay(300)
      return mockCategoriasPizza
    }
    return api.get('/dashboard/categorias')
  },

  async getTendencia(periodo = '7d') {
    if (USE_MOCK) {
      await delay(300)
      return mockTendenciaSemanal
    }
    return api.get('/dashboard/tendencia', { params: { periodo } })
  },

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
