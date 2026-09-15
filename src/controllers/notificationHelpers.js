import Notification from '../models/Notification.js'
import { emitToUser } from '../socket.js'

const ACTOR_FIELDS = 'name headline profilePhoto'

/* $$ creates a Notification doc and pushes it live to the recipient's socket, if connected $$ */
export async function notify({ recipient, actor, type, post, job }) {
  if (String(recipient) === String(actor)) return /* $$ never notify yourself $$ */

  const doc = await Notification.create({ recipient, actor, type, post, job })
  const populated = await doc.populate([
    { path: 'actor', select: ACTOR_FIELDS },
    { path: 'post', select: 'text' },
    { path: 'job', select: 'title company' },
  ])
  emitToUser(recipient, 'notification:new', populated.toObject())
  return populated
}
