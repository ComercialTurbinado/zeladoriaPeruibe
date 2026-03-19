const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/ocorrenciasController')
const authMiddleware = require('../middleware/auth')

// Rota de exportação antes de /:id para não conflitar
router.get('/export', authMiddleware, ctrl.exportar)

// CRUD
router.get('/', authMiddleware, ctrl.listar)
router.post('/', ctrl.criar)           // Chamado pelo n8n sem auth de admin
router.get('/:id', authMiddleware, ctrl.buscarPorId)
router.patch('/:id/status', authMiddleware, ctrl.atualizarStatus)

module.exports = router
