const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI não definida no .env')
  process.exit(1)
}

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, options)
    console.log(`✅  MongoDB conectado: ${mongoose.connection.host}`)
  } catch (err) {
    console.error('❌  Falha ao conectar ao MongoDB:', err.message)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB desconectado — reconectando...')
})

mongoose.connection.on('error', (err) => {
  console.error('❌  Erro MongoDB:', err.message)
})

module.exports = connectDB
