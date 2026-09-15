import Job from '../models/Job.js'
import { acceptedConnectionIds } from './connectionHelpers.js'
import { notify } from './notificationHelpers.js'

const POSTER_FIELDS = 'name headline profilePhoto'

/* $$ never leak the raw applicants list — only the poster should know who applied $$ */
const shapeJob = (j, meId) => {
  const { applicants, ...rest } = j
  return { ...rest, applicantCount: applicants.length, applied: applicants.some((id) => String(id) === String(meId)) }
}

export const listJobs = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    const filter = {}
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ title: rx }, { company: rx }, { location: rx }]
    }
    const jobs = await Job.find(filter)
      .populate('postedBy', POSTER_FIELDS)
      .sort({ createdAt: -1 })
      .lean()
    res.json({ jobs: jobs.map((j) => shapeJob(j, req.userId)) })
  } catch (err) {
    console.error('listJobs failed:', err)
    res.status(500).json({ message: 'Could not load jobs' })
  }
}

export const getUserJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.params.userId })
      .populate('postedBy', POSTER_FIELDS)
      .sort({ createdAt: -1 })
      .lean()
    res.json({ jobs: jobs.map((j) => shapeJob(j, req.userId)) })
  } catch (err) {
    console.error('getUserJobs failed:', err)
    res.status(500).json({ message: 'Could not load jobs' })
  }
}

export const createJob = async (req, res) => {
  try {
    const { title, company, location, type, description } = req.body
    if (!title?.trim() || !company?.trim()) {
      return res.status(400).json({ message: 'Title and company are required' })
    }

    const job = await Job.create({
      postedBy: req.userId,
      title: title.trim(),
      company: company.trim(),
      location: location?.trim() || '',
      type: type || 'Full-time',
      description: description?.trim() || '',
    })
    const populated = await job.populate('postedBy', POSTER_FIELDS)

    const friendIds = await acceptedConnectionIds(req.userId)
    await Promise.all(friendIds.map((id) => notify({ recipient: id, actor: req.userId, type: 'job_post', job: job._id })))

    res.status(201).json({ job: shapeJob(populated.toObject(), req.userId) })
  } catch (err) {
    console.error('createJob failed:', err)
    res.status(400).json({ message: 'Could not create job' })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    if (String(job.postedBy) !== String(req.userId)) {
      return res.status(403).json({ message: 'You can only delete your own postings' })
    }
    await job.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    console.error('deleteJob failed:', err)
    res.status(500).json({ message: 'Could not delete job' })
  }
}

export const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    if (String(job.postedBy) === String(req.userId)) {
      return res.status(400).json({ message: "You can't apply to your own job posting" })
    }

    const already = job.applicants.some((id) => String(id) === String(req.userId))
    if (already) {
      job.applicants = job.applicants.filter((id) => String(id) !== String(req.userId))
    } else {
      job.applicants.push(req.userId)
    }
    await job.save()
    res.json({ applied: !already, applicantCount: job.applicants.length })
  } catch (err) {
    console.error('applyToJob failed:', err)
    res.status(500).json({ message: 'Could not apply' })
  }
}
