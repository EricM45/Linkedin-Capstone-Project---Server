import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { createServer } from 'http'
import routes from './routes/index.js'
import { initSocket } from './socket.js'
import { apiLimiter } from './middleware/rateLimit.js'

dotenv.config()

const { PORT = 4000, MONGODB_URI, CLIENT_URL = 'http://localhost:5173' } = process.env
const origins = CLIENT_URL.split(',').map((s) => s.trim())

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: origins, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use('/api', apiLimiter)

app.get('/', (_req, res) => res.json({ app: 'LinkedIn Clone API', status: 'ok' }))
app.use('/api', routes)

const httpServer = createServer(app)
initSocket(httpServer, origins)

async function start() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing in .env')
  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB connected:', mongoose.connection.name)
  httpServer.listen(PORT, () => console.log(`LinkedIn Clone API on http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('Startup failed:', err.message)
  process.exit(1)
})
