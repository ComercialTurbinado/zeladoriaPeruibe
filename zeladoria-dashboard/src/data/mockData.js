// =============================================================
// MOCK DATA — substitua pelas chamadas reais à API n8n/backend
// =============================================================

export const CATEGORIAS = {
  BURACO: { label: 'Buraco / Pavimentação', color: '#ef4444', icon: '🕳️' },
  ILUMINACAO: { label: 'Iluminação Pública', color: '#f59e0b', icon: '💡' },
  LIXO: { label: 'Lixo / Entulho', color: '#22c55e', icon: '🗑️' },
  ARVORE: { label: 'Árvore / Poda', color: '#10b981', icon: '🌳' },
  CALCADA: { label: 'Calçada Danificada', color: '#8b5cf6', icon: '🧱' },
  AGUA: { label: 'Vazamento de Água', color: '#3b82f6', icon: '💧' },
  OUTRO: { label: 'Outros', color: '#6b7280', icon: '📋' },
}

export const STATUS = {
  ABERTO: { label: 'Aberto', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  TRIAGEM: { label: 'Em Triagem', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  ANALISE: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  EXECUCAO: { label: 'Em Execução', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

export const CRITICIDADE = {
  BAIXA: { label: 'Baixa', color: 'text-green-600', bg: 'bg-green-50' },
  MEDIA: { label: 'Média', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ALTA: { label: 'Alta', color: 'text-red-600', bg: 'bg-red-50' },
  CRITICA: { label: 'Crítica', color: 'text-red-800', bg: 'bg-red-100' },
}

export const mockOcorrencias = [
  {
    id: 1,
    protocolo: 'ZLD-2024-001',
    categoria: 'BURACO',
    descricao: 'Buraco grande na Rua das Flores, próximo ao n° 250. Está causando acidentes com motociclistas.',
    status: 'EXECUCAO',
    criticidade: 'ALTA',
    bairro: 'Centro',
    rua: 'Rua das Flores',
    latitude: -23.5505,
    longitude: -46.6333,
    cidadao: { nome: 'João Silva', telefone: '+5511999990001', anonimo: false },
    midias: [
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/buraco1/800/600' },
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/buraco2/800/600' },
    ],
    created_at: '2024-11-10T08:30:00Z',
    updated_at: '2024-11-12T14:00:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-10T08:30:00Z', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'TRIAGEM', data: '2024-11-10T09:00:00Z', admin: 'Maria Gestora' },
      { status_anterior: 'TRIAGEM', status_novo: 'ANALISE', data: '2024-11-11T10:00:00Z', admin: 'Carlos Coordenador' },
      { status_anterior: 'ANALISE', status_novo: 'EXECUCAO', data: '2024-11-12T14:00:00Z', admin: 'Carlos Coordenador' },
    ],
  },
  {
    id: 2,
    protocolo: 'ZLD-2024-002',
    categoria: 'ILUMINACAO',
    descricao: 'Poste apagado há 3 dias na Av. Principal. Trecho escuro à noite, inseguro.',
    status: 'ANALISE',
    criticidade: 'ALTA',
    bairro: 'Vila Nova',
    rua: 'Av. Principal',
    latitude: -23.5490,
    longitude: -46.6380,
    cidadao: { nome: 'Anônimo', telefone: '+5511999990002', anonimo: true },
    midias: [
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/poste1/800/600' },
    ],
    created_at: '2024-11-11T19:00:00Z',
    updated_at: '2024-11-12T08:00:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-11T19:00:00Z', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'ANALISE', data: '2024-11-12T08:00:00Z', admin: 'Ana Supervisora' },
    ],
  },
  {
    id: 3,
    protocolo: 'ZLD-2024-003',
    categoria: 'LIXO',
    descricao: 'Descarte irregular de entulho na calçada da Praça Central. Acumulou muito lixo.',
    status: 'CONCLUIDO',
    criticidade: 'MEDIA',
    bairro: 'Centro',
    rua: 'Praça Central',
    latitude: -23.5520,
    longitude: -46.6310,
    cidadao: { nome: 'Maria Oliveira', telefone: '+5511999990003', anonimo: false },
    midias: [
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/lixo1/800/600' },
      { tipo: 'VIDEO', url: 'https://picsum.photos/seed/lixo2/800/600' },
    ],
    created_at: '2024-11-08T11:00:00Z',
    updated_at: '2024-11-10T16:00:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-08T11:00:00Z', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'EXECUCAO', data: '2024-11-09T07:00:00Z', admin: 'Roberto Admin' },
      { status_anterior: 'EXECUCAO', status_novo: 'CONCLUIDO', data: '2024-11-10T16:00:00Z', admin: 'Roberto Admin' },
    ],
  },
  {
    id: 4,
    protocolo: 'ZLD-2024-004',
    categoria: 'CALCADA',
    descricao: 'Calçada levantada por raiz de árvore, risco de queda para idosos.',
    status: 'ABERTO',
    criticidade: 'MEDIA',
    bairro: 'Jardim América',
    rua: 'Rua Primavera',
    latitude: -23.5465,
    longitude: -46.6355,
    cidadao: { nome: 'Pedro Santos', telefone: '+5511999990004', anonimo: false },
    midias: [
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/calcada1/800/600' },
    ],
    created_at: '2024-11-13T07:30:00Z',
    updated_at: '2024-11-13T07:30:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-13T07:30:00Z', admin: 'Sistema WhatsApp' },
    ],
  },
  {
    id: 5,
    protocolo: 'ZLD-2024-005',
    categoria: 'AGUA',
    descricao: 'Vazamento de água na rua há 2 dias. Água correndo o dia todo, muito desperdício.',
    status: 'TRIAGEM',
    criticidade: 'CRITICA',
    bairro: 'Bela Vista',
    rua: 'Rua das Acácias',
    latitude: -23.5535,
    longitude: -46.6295,
    cidadao: { nome: 'Lucia Ferreira', telefone: '+5511999990005', anonimo: false },
    midias: [
      { tipo: 'VIDEO', url: 'https://picsum.photos/seed/agua1/800/600' },
    ],
    created_at: '2024-11-13T09:15:00Z',
    updated_at: '2024-11-13T10:00:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-13T09:15:00Z', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'TRIAGEM', data: '2024-11-13T10:00:00Z', admin: 'Ana Supervisora' },
    ],
  },
  {
    id: 6,
    protocolo: 'ZLD-2024-006',
    categoria: 'ARVORE',
    descricao: 'Árvore com galhos caídos bloqueando parte da rua após a chuva.',
    status: 'EXECUCAO',
    criticidade: 'ALTA',
    bairro: 'Jardim América',
    rua: 'Alameda dos Ipês',
    latitude: -23.5480,
    longitude: -46.6340,
    cidadao: { nome: 'Anônimo', telefone: '+5511999990006', anonimo: true },
    midias: [
      { tipo: 'FOTO', url: 'https://picsum.photos/seed/arvore1/800/600' },
    ],
    created_at: '2024-11-12T06:00:00Z',
    updated_at: '2024-11-12T11:00:00Z',
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', data: '2024-11-12T06:00:00Z', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'EXECUCAO', data: '2024-11-12T11:00:00Z', admin: 'Carlos Coordenador' },
    ],
  },
]

export const mockStats = {
  total: 48,
  abertas: 12,
  em_andamento: 21,
  concluidas: 15,
  media_resolucao_horas: 18.4,
  nps_satisfacao: 87,
}

export const mockCategoriasPizza = [
  { name: 'Iluminação', value: 19, fill: '#f59e0b' },
  { name: 'Buracos', value: 14, fill: '#ef4444' },
  { name: 'Lixo', value: 8, fill: '#22c55e' },
  { name: 'Calçada', value: 4, fill: '#8b5cf6' },
  { name: 'Árvore', value: 2, fill: '#10b981' },
  { name: 'Outros', value: 1, fill: '#6b7280' },
]

export const mockTendenciaSemanal = [
  { dia: 'Seg', abertas: 4, concluidas: 2 },
  { dia: 'Ter', abertas: 7, concluidas: 5 },
  { dia: 'Qua', abertas: 3, concluidas: 6 },
  { dia: 'Qui', abertas: 8, concluidas: 4 },
  { dia: 'Sex', abertas: 11, concluidas: 7 },
  { dia: 'Sab', abertas: 5, concluidas: 3 },
  { dia: 'Dom', abertas: 2, concluidas: 1 },
]

export const mockAdmins = [
  { id: 1, nome: 'Admin Master', email: 'admin@zeladoria.gov.br', role: 'ADMIN', senha: 'admin123' },
  { id: 2, nome: 'Ana Supervisora', email: 'ana@zeladoria.gov.br', role: 'SUPERVISOR', senha: '123456' },
]
