import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const publicUser = (u) => {
  const o = u.toObject ? u.toObject() : u
  delete o.password
  return o
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const register = async (req, res) => {
  try {
    const { name, email, password, headline } = req.body
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (!EMAIL_RX.test(email.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'An account with that email already exists' })

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password: hash,
      headline: headline || '',
    })
    res.status(201).json({ token: sign(user._id), user: publicUser(user) })
  } catch (err) {
    console.error('Could not register:', err)
    res.status(500).json({ message: 'Could not register' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password')
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    const ok = await bcrypt.compare(password || '', user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' })

    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (err) {
    console.error('Could not log in:', err)
    res.status(500).json({ message: 'Could not log in' })
  }
}

export const me = async (req, res) => {
  const user = await User.findById(req.userId)
  /* $$ a since-deleted user with a still-valid token must look like an auth failure, so the client's 401 interceptor logs it out instead of leaving a stale shell up $$ */
  if (!user) return res.status(401).json({ message: 'Invalid or expired session' })
  res.json({ user: publicUser(user) })
}
