const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token de autenticação não fornecido' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const admin = await Admin.findById(decoded.id).select('-senha')
    if (!admin || !admin.ativo) {
      return res.status(401).json({ erro: 'Usuário inativo ou não encontrado' })
    }

    req.admin = admin
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado — faça login novamente' })
    }
    return res.status(401).json({ erro: 'Token inválido' })
  }
}

module.exports = authMiddleware
