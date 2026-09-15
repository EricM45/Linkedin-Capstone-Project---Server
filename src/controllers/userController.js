import User from '../models/User.js'
import Connection from '../models/Connection.js'
import { acceptedConnectionIds, relationshipTo } from './connectionHelpers.js'

const CARD_FIELDS = 'name headline location profilePhoto'

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Profile not found' })

    const [relationship, connectionIds] = await Promise.all([
      relationshipTo(req.userId, user._id),
      acceptedConnectionIds(user._id),
    ])

    res.json({
      user,
      relationship,
      connectionCount: connectionIds.length,
    })
  } catch (err) {
    console.error('Could not load profile:', err)
    res.status(500).json({ message: 'Could not load profile' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name',
      'headline',
      'about',
      'location',
      'profilePhoto',
      'bannerPhoto',
      'experience',
      'education',
      'skills',
    ]
    const updates = {}
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key]

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    })
    res.json({ user })
  } catch (err) {
    console.error('Could not save profile:', err)
    res.status(400).json({ message: 'Could not save profile' })
  }
}

export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ users: [] })
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const users = await User.find({ $or: [{ name: rx }, { headline: rx }] })
      .select(CARD_FIELDS)
      .limit(20)
      .lean()

    const withRel = await Promise.all(
      users.map(async (u) => ({ ...u, relationship: await relationshipTo(req.userId, u._id) }))
    )
    res.json({ users: withRel })
  } catch (err) {
    console.error('Search failed:', err)
    res.status(500).json({ message: 'Search failed' })
  }
}

/* $$ people you may know: not you, not already connected/pending $$ */
export const getSuggestions = async (req, res) => {
  try {
    const connected = await Connection.find({
      $or: [{ requester: req.userId }, { recipient: req.userId }],
    }).lean()
    const exclude = new Set([String(req.userId)])
    connected.forEach((c) => {
      exclude.add(String(c.requester))
      exclude.add(String(c.recipient))
    })

    const users = await User.find({ _id: { $nin: [...exclude] } })
      .select(CARD_FIELDS)
      .limit(10)
      .lean()
    res.json({ users })
  } catch (err) {
    console.error('Could not load suggestions:', err)
    res.status(500).json({ message: 'Could not load suggestions' })
  }
}
