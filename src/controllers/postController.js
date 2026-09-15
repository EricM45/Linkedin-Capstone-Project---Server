import Post from '../models/Post.js'
import { acceptedConnectionIds } from './connectionHelpers.js'
import { notify } from './notificationHelpers.js'

const AUTHOR = 'name headline profilePhoto'

/* $$ how many times each post in `postIds` has been reposted, and whether `meId` is one of the reposters $$ */
async function getRepostMeta(postIds, meId) {
  const reposts = await Post.find({ repostOf: { $in: postIds } })
    .select('repostOf author')
    .lean()
  const counts = {}
  const mineSet = new Set()
  for (const r of reposts) {
    const key = String(r.repostOf)
    counts[key] = (counts[key] || 0) + 1
    if (String(r.author) === String(meId)) mineSet.add(key)
  }
  return { counts, mineSet }
}

const shape = (post, meId, repostMeta = { counts: {}, mineSet: new Set() }) => {
  const p = post.toObject ? post.toObject() : post
  const me = String(meId)
  const original = p.repostOf
  return {
    _id: p._id,
    author: p.author,
    text: p.text,
    image: p.image || '',
    likeCount: (p.likes || []).length,
    likedByMe: (p.likes || []).some((id) => String(id) === me),
    comments: (p.comments || []).map((c) => ({
      _id: c._id,
      author: c.author,
      text: c.text,
      createdAt: c.createdAt,
      mine: String(c.author?._id ?? c.author) === me,
    })),
    commentCount: (p.comments || []).length,
    mine: String(p.author?._id ?? p.author) === me,
    createdAt: p.createdAt,
    repostOf: original
      ? {
          _id: original._id,
          author: original.author,
          text: original.text,
          image: original.image || '',
          createdAt: original.createdAt,
          repostCount: repostMeta.counts[String(original._id)] || 0,
          repostedByMe: repostMeta.mineSet.has(String(original._id)),
        }
      : null,
    repostCount: repostMeta.counts[String(p._id)] || 0,
    repostedByMe: repostMeta.mineSet.has(String(p._id)),
  }
}

const REPOST_POPULATE = { path: 'repostOf', populate: { path: 'author', select: AUTHOR } }

/* $$ every post id whose repost stats we need: the posts themselves, plus whatever they repost $$ */
function idsNeedingRepostMeta(posts) {
  const ids = new Set()
  for (const p of posts) {
    ids.add(String(p._id))
    if (p.repostOf) ids.add(String(p.repostOf._id))
  }
  return [...ids]
}

/* $$ re-fetch a single post, fully populated and shaped, after a mutation $$ */
async function loadShaped(id, meId) {
  const populated = await Post.findById(id)
    .populate('author', AUTHOR)
    .populate('comments.author', AUTHOR)
    .populate(REPOST_POPULATE)
    .lean()
  const repostMeta = await getRepostMeta(idsNeedingRepostMeta([populated]), meId)
  return shape(populated, meId, repostMeta)
}

/* $$ feed = my posts + my connections' posts $$ */
export const getFeed = async (req, res) => {
  try {
    const connIds = await acceptedConnectionIds(req.userId)
    const authors = [req.userId, ...connIds]
    const posts = await Post.find({ author: { $in: authors } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('author', AUTHOR)
      .populate('comments.author', AUTHOR)
      .populate(REPOST_POPULATE)
      .lean()
    const repostMeta = await getRepostMeta(idsNeedingRepostMeta(posts), req.userId)
    res.json({ posts: posts.map((p) => shape(p, req.userId, repostMeta)) })
  } catch (err) {
    console.error('Could not load feed:', err)
    res.status(500).json({ message: 'Could not load feed' })
  }
}

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR)
      .populate('comments.author', AUTHOR)
      .populate(REPOST_POPULATE)
      .lean()
    const repostMeta = await getRepostMeta(idsNeedingRepostMeta(posts), req.userId)
    res.json({ posts: posts.map((p) => shape(p, req.userId, repostMeta)) })
  } catch (err) {
    console.error('Could not load posts:', err)
    res.status(500).json({ message: 'Could not load posts' })
  }
}

export const createPost = async (req, res) => {
  try {
    const { text, image } = req.body
    if (!text?.trim() && !image?.trim()) {
      return res.status(400).json({ message: 'Write something or add an image' })
    }
    const created = await Post.create({
      author: req.userId,
      text: text?.trim() || '',
      image: image?.trim() || '',
    })
    const populated = await Post.findById(created._id).populate('author', AUTHOR).lean()
    res.status(201).json({ post: shape(populated, req.userId) })
  } catch (err) {
    console.error('Could not post:', err)
    res.status(500).json({ message: 'Could not post' })
  }
}

export const toggleRepost = async (req, res) => {
  try {
    const original = await Post.findById(req.params.id)
    if (!original) return res.status(404).json({ message: 'Post not found' })
    if (String(original.author) === String(req.userId)) {
      return res.status(400).json({ message: "You can't repost your own post" })
    }

    const existing = await Post.findOne({ author: req.userId, repostOf: req.params.id })
    if (existing) {
      await existing.deleteOne()
      return res.json({
        reposted: false,
        removedPostId: existing._id,
        original: await loadShaped(original._id, req.userId),
      })
    }

    const created = await Post.create({ author: req.userId, repostOf: req.params.id, text: '' })
    await notify({ recipient: original.author, actor: req.userId, type: 'post_repost', post: original._id })
    res.status(201).json({
      reposted: true,
      post: await loadShaped(created._id, req.userId),
      original: await loadShaped(original._id, req.userId),
    })
  } catch (err) {
    console.error('Could not repost:', err)
    res.status(500).json({ message: 'Could not repost' })
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.author) !== String(req.userId))
      return res.status(403).json({ message: 'Not your post' })
    await post.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    console.error('Could not delete:', err)
    res.status(500).json({ message: 'Could not delete' })
  }
}

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const me = String(req.userId)
    const i = post.likes.findIndex((id) => String(id) === me)
    const liking = i === -1
    if (liking) post.likes.push(req.userId)
    else post.likes.splice(i, 1)
    await post.save()
    if (liking) await notify({ recipient: post.author, actor: req.userId, type: 'post_like', post: post._id })
    res.json({ post: await loadShaped(post._id, req.userId) })
  } catch (err) {
    console.error('Could not react:', err)
    res.status(500).json({ message: 'Could not react' })
  }
}

export const addComment = async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' })
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    post.comments.push({ author: req.userId, text: text.trim() })
    await post.save()
    await notify({ recipient: post.author, actor: req.userId, type: 'post_comment', post: post._id })
    res.status(201).json({ post: await loadShaped(post._id, req.userId) })
  } catch (err) {
    console.error('Could not comment:', err)
    res.status(500).json({ message: 'Could not comment' })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const comment = post.comments.id(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    if (String(comment.author) !== String(req.userId) && String(post.author) !== String(req.userId))
      return res.status(403).json({ message: 'Not allowed' })
    comment.deleteOne()
    await post.save()
    res.json({ post: await loadShaped(post._id, req.userId) })
  } catch (err) {
    console.error('Could not delete comment:', err)
    res.status(500).json({ message: 'Could not delete comment' })
  }
}
