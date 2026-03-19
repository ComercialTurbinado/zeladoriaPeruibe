const mongoose = require('mongoose')

// Sub-documentos embutidos (não precisam de collection própria)
const midiaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    tipo: { type: String, enum: ['FOTO', 'VIDEO'], default: 'FOTO' },
  },
  { _id: false }
)

const logStatusSchema = new mongoose.Schema(
  {
    status_anterior: { type: String },
    status_novo: { type: String, required: true },
    observacao: { type: String },
    admin: { type: String, default: 'Sistema' },
    data: { type: Date, default: Date.now },
  },
  { _id: false }
)

const ocorrenciaSchema = new mongoose.Schema(
  {
    protocolo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    cidadao_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cidadao',
    },

    // Snapshot do cidadão no momento do registro
    cidadao: {
      nome: { type: String },
      telefone: { type: String },
      anonimo: { type: Boolean, default: false },
    },

    categoria: {
      type: String,
      required: true,
      enum: ['BURACO', 'ILUMINACAO', 'LIXO', 'ARVORE', 'CALCADA', 'AGUA', 'OUTRO'],
      index: true,
    },

    descricao: { type: String },

    status: {
      type: String,
      enum: ['ABERTO', 'TRIAGEM', 'ANALISE', 'EXECUCAO', 'CONCLUIDO', 'CANCELADO'],
      default: 'ABERTO',
      index: true,
    },

    criticidade: {
      type: String,
      enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'],
      default: 'MEDIA',
      index: true,
    },

    bairro: { type: String, trim: true, index: true },
    rua: { type: String, trim: true },

    latitude: { type: Number },
    longitude: { type: Number },

    midias: [midiaSchema],
    logs: [logStatusSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

// Índice geoespacial para o mapa de calor
ocorrenciaSchema.index({ latitude: 1, longitude: 1 })

// Índice composto para filtros do dashboard
ocorrenciaSchema.index({ status: 1, categoria: 1, bairro: 1, created_at: -1 })

module.exports = mongoose.model('Ocorrencia', ocorrenciaSchema)
