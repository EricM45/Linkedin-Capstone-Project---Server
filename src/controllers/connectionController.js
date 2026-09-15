import Connection from '../models/Connection.js'
import User from '../models/User.js'
import { acceptedConnectionIds } from './connectionHelpers.js'
import { notify } from './notificationHelpers.js'

const CARD_FIELDS = 'name headline location profilePhoto'

export const sendRequest = async (req, res) => {
  try {
    const recipient = req.params.userId
    if (String(recipient) === String(req.userId)) {
      return res.status(400).json({ message: "You can't connect with yourself" })
    }
    const existing = await Connection.findOne({
      $or: [
        { requester: req.userId, recipient },
        { requester: recipient, recipient: req.userId },
      ],
    })
    if (existing) {
      if (existing.status === 'accepted')
        return res.status(409).json({ message: 'Already connected' })
      /* $$ they already invited me -> accept it $$ */
      if (String(existing.requester) === String(recipient)) {
        existing.status = 'accepted'
        await existing.save()
        await notify({ recipient, actor: req.userId, type: 'connection_accepted' })
        return res.json({ status: 'connected' })
      }
      return res.status(409).json({ message: 'Invitation already sent' })
    }
    await Connection.create({ requester: req.userId, recipient, status: 'pending' })
    await notify({ recipient, actor: req.userId, type: 'connection_request' })
    res.status(201).json({ status: 'pending_outgoing' })
  } catch (err) {
    console.error('Could not send invitation:', err)
    res.status(500).json({ message: 'Could not send invitation' })
  }
}

/* $$ accept / ignore an incoming request from :userId $$ */
export const respondRequest = async (req, res) => {
  try {
    const { userId } = req.params
    const { action } = req.body /* $$ 'accept' | 'ignore' $$ */
    const conn = await Connection.findOne({
      requester: userId,
      recipient: req.userId,
      status: 'pending',
    })
    if (!conn) return res.status(404).json({ message: 'No pending invitation from this person' })

    if (action === 'accept') {
      conn.status = 'accepted'
      await conn.save()
      await notify({ recipient: userId, actor: req.userId, type: 'connection_accepted' })
      return res.json({ status: 'connected' })
    }
    await conn.deleteOne()
    res.json({ status: 'none' })
  } catch (err) {
    console.error('Could not respond:', err)
    res.status(500).json({ message: 'Could not respond' })
  }
}

/* $$ remove a connection OR withdraw a sent invitation to :userId $$ */
export const removeConnection = async (req, res) => {
  try {
    const { userId } = req.params
    await Connection.deleteOne({
      $or: [
        { requester: req.userId, recipient: userId },
        { requester: userId, recipient: req.userId },
      ],
    })
    res.json({ status: 'none' })
  } catch (err) {
    console.error('Could not remove connection:', err)
    res.status(500).json({ message: 'Could not remove connection' })
  }
}

export const listConnections = async (req, res) => {
  try {
    const targetId = req.params.userId || req.userId
    const ids = await acceptedConnectionIds(targetId)
    const users = await User.find({ _id: { $in: ids } })
      .select(CARD_FIELDS)
      .lean()
    res.json({ users })
  } catch (err) {
    console.error('Could not load connections:', err)
    res.status(500).json({ message: 'Could not load connections' })
  }
}

/* $$ incoming pending invitations for me $$ */
export const listInvitations = async (req, res) => {
  try {
    const rows = await Connection.find({ recipient: req.userId, status: 'pending' })
      .populate('requester', CARD_FIELDS)
      .sort({ createdAt: -1 })
      .lean()
    res.json({ invitations: rows.map((r) => ({ _id: r._id, from: r.requester, createdAt: r.createdAt })) })
  } catch (err) {
    console.error('Could not load invitations:', err)
    res.status(500).json({ message: 'Could not load invitations' })
  }
}
