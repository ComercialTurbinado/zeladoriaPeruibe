const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/dashboardController')
const authMiddleware = require('../middleware/auth')

router.get('/stats',      authMiddleware, ctrl.getStats)
router.get('/categorias', authMiddleware, ctrl.getCategorias)
router.get('/tendencia',  authMiddleware, ctrl.getTendencia)
router.get('/mapa-calor', authMiddleware, ctrl.getMapaCalor)

module.exports = router
