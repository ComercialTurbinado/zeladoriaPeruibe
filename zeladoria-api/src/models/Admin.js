const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
      default: 'OPERADOR',
    },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

// Hash da senha antes de salvar
adminSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next()
  this.senha = await bcrypt.hash(this.senha, 12)
  next()
})

// Método para comparar senha
adminSchema.methods.compararSenha = async function (senhaTexto) {
  return bcrypt.compare(senhaTexto, this.senha)
}

// Não expor a senha nas respostas
adminSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.senha
  return obj
}

module.exports = mongoose.model('Admin', adminSchema)
