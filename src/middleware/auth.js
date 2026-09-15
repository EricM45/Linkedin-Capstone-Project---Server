import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}
