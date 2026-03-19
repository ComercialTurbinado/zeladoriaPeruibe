const mongoose = require('mongoose')

const cidadaoSchema = new mongoose.Schema(
  {
    nome: { type: String, trim: true },
    cpf: { type: String, trim: true, sparse: true }, // nullable
    telefone: { type: String, required: true, trim: true, index: true },
    anonimo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
)

// Garante que um mesmo telefone não seja duplicado (um cidadão por número)
cidadaoSchema.index({ telefone: 1 }, { unique: true })

module.exports = mongoose.model('Cidadao', cidadaoSchema)
