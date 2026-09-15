import Notification from '../models/Notification.js'

const ACTOR_FIELDS = 'name headline profilePhoto'

export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('actor', ACTOR_FIELDS)
      .populate('post', 'text')
      .populate('job', 'title company')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const unreadCount = await Notification.countDocuments({ recipient: req.userId, read: false })
    res.json({ notifications, unreadCount })
  } catch (err) {
    console.error('Could not load notifications:', err)
    res.status(500).json({ message: 'Could not load notifications' })
  }
}

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true })
    res.json({ ok: true })
  } catch (err) {
    console.error('Could not update notifications:', err)
    res.status(500).json({ message: 'Could not update notifications' })
  }
}
