import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { register, login, me } from '../controllers/authController.js'
import {
  getProfile,
  updateProfile,
  searchUsers,
  getSuggestions,
} from '../controllers/userController.js'
import {
  sendRequest,
  respondRequest,
  removeConnection,
  listConnections,
  listInvitations,
} from '../controllers/connectionController.js'
import {
  getFeed,
  getUserPosts,
  createPost,
  deletePost,
  toggleLike,
  toggleRepost,
  addComment,
  deleteComment,
} from '../controllers/postController.js'
import { listNotifications, markAllRead } from '../controllers/notificationController.js'
import { listConversations, getMessages, sendMessage } from '../controllers/messageController.js'
import { listJobs, getUserJobs, createJob, deleteJob, applyToJob } from '../controllers/jobController.js'

const router = Router()

/* $$ only the actually brute-forceable endpoints get the strict limiter — /me just reads an existing valid token $$ */
router.post('/auth/register', authLimiter, register)
router.post('/auth/login', authLimiter, login)
router.get('/auth/me', requireAuth, me)

router.get('/users/search', requireAuth, searchUsers)
router.get('/users/suggestions', requireAuth, getSuggestions)
router.get('/users/:id', requireAuth, getProfile)
router.patch('/users/me', requireAuth, updateProfile)

router.get('/connections', requireAuth, listConnections)
router.get('/connections/invitations', requireAuth, listInvitations)
router.get('/connections/user/:userId', requireAuth, listConnections)
router.post('/connections/request/:userId', requireAuth, sendRequest)
router.post('/connections/respond/:userId', requireAuth, respondRequest)
router.delete('/connections/:userId', requireAuth, removeConnection)

router.get('/posts/feed', requireAuth, getFeed)
router.get('/posts/user/:userId', requireAuth, getUserPosts)
router.post('/posts', requireAuth, createPost)
router.delete('/posts/:id', requireAuth, deletePost)
router.post('/posts/:id/like', requireAuth, toggleLike)
router.post('/posts/:id/repost', requireAuth, toggleRepost)
router.post('/posts/:id/comments', requireAuth, addComment)
router.delete('/posts/:id/comments/:commentId', requireAuth, deleteComment)

router.get('/notifications', requireAuth, listNotifications)
router.post('/notifications/read-all', requireAuth, markAllRead)

router.get('/messages/conversations', requireAuth, listConversations)
router.get('/messages/:userId', requireAuth, getMessages)
router.post('/messages/:userId', requireAuth, sendMessage)

router.get('/jobs', requireAuth, listJobs)
router.get('/jobs/user/:userId', requireAuth, getUserJobs)
router.post('/jobs', requireAuth, createJob)
router.delete('/jobs/:id', requireAuth, deleteJob)
router.post('/jobs/:id/apply', requireAuth, applyToJob)

export default router
