import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['connection_request', 'connection_accepted', 'post_like', 'post_comment', 'post_repost', 'job_post'],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
