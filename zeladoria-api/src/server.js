require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./config/database')

const app = express()

// ─── Middlewares globais ───────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Servir arquivos de upload estáticos ──────────────────────
const uploadsDir = path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsDir))

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// ─── Rotas ────────────────────────────────────────────────────
app.use('/admin',       require('./routes/auth'))
app.use('/ocorrencias', require('./routes/ocorrencias'))
app.use('/dashboard',   require('./routes/dashboard'))

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.path}` })
})

// ─── Error handler global (captura erros do multer tb) ────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ erro: 'Arquivo muito grande (máx. 20MB)' })
  }
  if (err.message === 'Tipo de arquivo não permitido') {
    return res.status(415).json({ erro: err.message })
  }
  console.error('❌  Erro não tratado:', err)
  res.status(500).json({ erro: 'Erro interno do servidor' })
})

// ─── Inicializar ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀  Zeladoria API rodando na porta ${PORT}`)
    console.log(`📋  Endpoints:`)
    console.log(`    POST   /admin/login`)
    console.log(`    GET    /admin/me`)
    console.log(`    GET    /ocorrencias`)
    console.log(`    POST   /ocorrencias`)
    console.log(`    GET    /ocorrencias/consulta?protocolo=&telefone=`)
    console.log(`    GET    /ocorrencias/:id`)
    console.log(`    PATCH  /ocorrencias/:id/status`)
    console.log(`    POST   /ocorrencias/:id/midias`)
    console.log(`    GET    /ocorrencias/export`)
    console.log(`    GET    /dashboard/stats`)
    console.log(`    GET    /dashboard/categorias`)
    console.log(`    GET    /dashboard/tendencia`)
    console.log(`    GET    /dashboard/mapa-calor`)
    console.log(`    GET    /uploads/:filename`)
  })
}

start()
