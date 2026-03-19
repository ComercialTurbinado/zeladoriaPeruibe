/**
 * SEED — Popula o banco com admin padrão e ocorrências de exemplo
 * Execute: node src/seed.js
 */
require('dotenv').config()
const connectDB = require('./config/database')
const Admin = require('./models/Admin')
const Ocorrencia = require('./models/Ocorrencia')

const ADMINS = [
  {
    nome: 'Admin Master',
    email: 'admin@zeladoria.gov.br',
    senha: 'admin123',
    role: 'ADMIN',
  },
  {
    nome: 'Ana Supervisora',
    email: 'ana@zeladoria.gov.br',
    senha: '123456',
    role: 'SUPERVISOR',
  },
]

const OCORRENCIAS_EXEMPLO = [
  {
    protocolo: 'ZLD-2024-001',
    cidadao: { nome: 'João Silva', telefone: '+5511999990001', anonimo: false },
    categoria: 'BURACO',
    descricao: 'Buraco grande na Rua das Flores, próximo ao n° 250.',
    status: 'EXECUCAO',
    criticidade: 'ALTA',
    bairro: 'Centro',
    rua: 'Rua das Flores',
    latitude: -23.5505,
    longitude: -46.6333,
    midias: [{ url: 'https://picsum.photos/seed/buraco1/800/600', tipo: 'FOTO' }],
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'TRIAGEM', admin: 'Ana Supervisora' },
      { status_anterior: 'TRIAGEM', status_novo: 'EXECUCAO', admin: 'Carlos Coordenador' },
    ],
  },
  {
    protocolo: 'ZLD-2024-002',
    cidadao: { nome: 'Anônimo', telefone: '+5511999990002', anonimo: true },
    categoria: 'ILUMINACAO',
    descricao: 'Poste apagado há 3 dias na Av. Principal.',
    status: 'ANALISE',
    criticidade: 'ALTA',
    bairro: 'Vila Nova',
    rua: 'Av. Principal',
    latitude: -23.549,
    longitude: -46.638,
    midias: [{ url: 'https://picsum.photos/seed/poste1/800/600', tipo: 'FOTO' }],
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'ANALISE', admin: 'Ana Supervisora' },
    ],
  },
  {
    protocolo: 'ZLD-2024-003',
    cidadao: { nome: 'Maria Oliveira', telefone: '+5511999990003', anonimo: false },
    categoria: 'LIXO',
    descricao: 'Descarte irregular de entulho na calçada da Praça Central.',
    status: 'CONCLUIDO',
    criticidade: 'MEDIA',
    bairro: 'Centro',
    rua: 'Praça Central',
    latitude: -23.552,
    longitude: -46.631,
    midias: [{ url: 'https://picsum.photos/seed/lixo1/800/600', tipo: 'FOTO' }],
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'EXECUCAO', admin: 'Roberto Admin' },
      { status_anterior: 'EXECUCAO', status_novo: 'CONCLUIDO', admin: 'Roberto Admin' },
    ],
  },
  {
    protocolo: 'ZLD-2024-004',
    cidadao: { nome: 'Lucia Ferreira', telefone: '+5511999990005', anonimo: false },
    categoria: 'AGUA',
    descricao: 'Vazamento de água na rua há 2 dias. Muito desperdício.',
    status: 'TRIAGEM',
    criticidade: 'CRITICA',
    bairro: 'Bela Vista',
    rua: 'Rua das Acácias',
    latitude: -23.5535,
    longitude: -46.6295,
    midias: [{ url: 'https://picsum.photos/seed/agua1/800/600', tipo: 'VIDEO' }],
    logs: [
      { status_anterior: null, status_novo: 'ABERTO', admin: 'Sistema WhatsApp' },
      { status_anterior: 'ABERTO', status_novo: 'TRIAGEM', admin: 'Ana Supervisora' },
    ],
  },
]

async function seed() {
  await connectDB()
  console.log('\n🌱  Iniciando seed do banco...\n')

  // Admins
  for (const adminData of ADMINS) {
    const existe = await Admin.findOne({ email: adminData.email })
    if (existe) {
      console.log(`⏭️   Admin já existe: ${adminData.email}`)
    } else {
      await Admin.create(adminData)
      console.log(`✅  Admin criado: ${adminData.email} / ${adminData.senha}`)
    }
  }

  // Ocorrências
  for (const oc of OCORRENCIAS_EXEMPLO) {
    const existe = await Ocorrencia.findOne({ protocolo: oc.protocolo })
    if (existe) {
      console.log(`⏭️   Ocorrência já existe: ${oc.protocolo}`)
    } else {
      await Ocorrencia.create(oc)
      console.log(`✅  Ocorrência criada: ${oc.protocolo}`)
    }
  }

  console.log('\n🎉  Seed concluído!\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌  Erro no seed:', err)
  process.exit(1)
})
