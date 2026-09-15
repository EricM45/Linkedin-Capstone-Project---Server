import mongoose from 'mongoose'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { relationshipTo } from './connectionHelpers.js'
import { emitToUser } from '../socket.js'

const CARD_FIELDS = 'name headline profilePhoto'

/* $$ one row per conversation partner, with the last message and my unread count $$ */
export const listConversations = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.userId)
    const rows = await Message.aggregate([
      { $match: { $or: [{ sender: me }, { recipient: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'] },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$recipient', me] }, { $eq: ['$read', false] }] }, 1, 0] },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ])

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
      .select(CARD_FIELDS)
      .lean()
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))

    const conversations = rows
      .filter((r) => byId[String(r._id)])
      .map((r) => ({
        user: byId[String(r._id)],
        lastMessage: { text: r.lastMessage.text, createdAt: r.lastMessage.createdAt, mine: String(r.lastMessage.sender) === String(me) },
        unreadCount: r.unreadCount,
      }))

    res.json({ conversations })
  } catch (err) {
    console.error('Could not load conversations:', err)
    res.status(500).json({ message: 'Could not load conversations' })
  }
}

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean()

    await Message.updateMany({ sender: userId, recipient: req.userId, read: false }, { read: true })

    res.json({ messages })
  } catch (err) {
    console.error('Could not load messages:', err)
    res.status(500).json({ message: 'Could not load messages' })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params
    const text = (req.body.text || '').trim()
    if (!text) return res.status(400).json({ message: 'Message text is required' })
    if (String(userId) === String(req.userId)) {
      return res.status(400).json({ message: "You can't message yourself" })
    }

    const relationship = await relationshipTo(req.userId, userId)
    if (relationship !== 'connected') {
      return res.status(403).json({ message: 'You can only message your connections' })
    }

    const message = await Message.create({ sender: req.userId, recipient: userId, text })
    const sender = await User.findById(req.userId).select(CARD_FIELDS).lean()

    emitToUser(userId, 'message:new', { ...message.toObject(), sender })
    res.status(201).json({ message })
  } catch (err) {
    console.error('Could not send message:', err)
    res.status(500).json({ message: 'Could not send message' })
  }
}
