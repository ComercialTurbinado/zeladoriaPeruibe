const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

function gerarToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
}

// POST /admin/login
async function login(req, res) {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' })
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), ativo: true })
    if (!admin) {
      return res.status(401).json({ erro: 'Credenciais inválidas' })
    }

    const senhaCorreta = await admin.compararSenha(senha)
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas' })
    }

    const token = gerarToken(admin._id)

    return res.json({
      token,
      admin: {
        id: admin._id,
        nome: admin.nome,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err) {
    console.error('Erro login:', err)
    return res.status(500).json({ erro: 'Erro interno do servidor' })
  }
}

// GET /admin/me  (valida token e retorna dados do admin)
async function me(req, res) {
  return res.json({
    id: req.admin._id,
    nome: req.admin.nome,
    email: req.admin.email,
    role: req.admin.role,
  })
}

module.exports = { login, me }
