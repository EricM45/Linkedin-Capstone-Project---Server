import Connection from '../models/Connection.js'

/* $$ ids (as strings) of everyone `userId` is connected to (accepted) $$ */
export async function acceptedConnectionIds(userId) {
  const rows = await Connection.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  }).lean()
  return rows.map((r) =>
    String(r.requester) === String(userId) ? String(r.recipient) : String(r.requester)
  )
}

/* $$ relationship between `me` and `other`
   'self' | 'connected' | 'pending_outgoing' | 'pending_incoming' | 'none' $$ */
export async function relationshipTo(me, other) {
  if (String(me) === String(other)) return 'self'
  const row = await Connection.findOne({
    $or: [
      { requester: me, recipient: other },
      { requester: other, recipient: me },
    ],
  }).lean()
  if (!row) return 'none'
  if (row.status === 'accepted') return 'connected'
  return String(row.requester) === String(me) ? 'pending_outgoing' : 'pending_incoming'
}
