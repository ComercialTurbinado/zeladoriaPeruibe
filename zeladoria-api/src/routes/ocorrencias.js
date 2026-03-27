const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const ctrl = require('../controllers/ocorrenciasController')
const authMiddleware = require('../middleware/auth')

// ─── Configuração do multer para upload de mídias ─────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, nome)
  },
})

const fileFilter = (req, file, cb) => {
  const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
  if (permitidos.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Tipo de arquivo não permitido'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
})

// ─── Rotas (ordem importa: específicas antes de /:id) ─────────

// Exportação antes de /:id para não conflitar
router.get('/export', authMiddleware, ctrl.exportar)

// Consulta pública — usada pelo N8N Flow 2
// GET /ocorrencias/consulta?protocolo=ZLD-2024-001 OU ?telefone=5511999990001
router.get('/consulta', ctrl.consultar)

// Status público — somente dados básicos (sem Authorization)
// GET /ocorrencias/status?protocolo=ZLD-2024-001
router.get('/status', ctrl.consultarStatusBasico)

// CRUD
router.get('/', authMiddleware, ctrl.listar)
router.post('/', ctrl.criar)                                          // N8N sem auth
router.get('/:id', authMiddleware, ctrl.buscarPorId)
router.patch('/:id/status', authMiddleware, ctrl.atualizarStatus)

// Upload de mídias
router.post('/:id/midias', authMiddleware, upload.single('midia'), ctrl.uploadMidia)

module.exports = router
