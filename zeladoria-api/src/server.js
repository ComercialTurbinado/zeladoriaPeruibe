require('dotenv').config()

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

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
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
    console.log(`    GET    /ocorrencias/:id`)
    console.log(`    PATCH  /ocorrencias/:id/status`)
    console.log(`    GET    /ocorrencias/export`)
    console.log(`    GET    /dashboard/stats`)
    console.log(`    GET    /dashboard/categorias`)
    console.log(`    GET    /dashboard/tendencia`)
    console.log(`    GET    /dashboard/mapa-calor`)
  })
}

start()
