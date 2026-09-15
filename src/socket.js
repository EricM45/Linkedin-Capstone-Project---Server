import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io = null

export function initSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Not authenticated'))
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = payload.id
      next()
    } catch {
      next(new Error('Invalid or expired session'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`)
  })

  return io
}

export function emitToUser(userId, event, payload) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, payload)
}
