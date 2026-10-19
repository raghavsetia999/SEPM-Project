import { FetchJob } from './fetchJob.model.js'
import { env } from '../../config/env.js'

const ACTIVE_STATUSES = ['PENDING', 'RUNNING']

export async function createJob({ handle, userId, type = 'sync', priority = 0 }) {
  const normalizedHandle = String(handle).toLowerCase()
  const existing = await FetchJob.findOne({
    handle: normalizedHandle,
    status: { $in: ACTIVE_STATUSES },
  })
  if (existing) return existing
  return FetchJob.create({
    handle: normalizedHandle,
    userId,
    type,
    priority: type === 'init' ? 10 : priority,
  })
}

export async function claimNextJob(workerId) {
  await recoverStaleJobs()
  return FetchJob.findOneAndUpdate(
    { status: 'PENDING', claimedBy: null },
    {
      $set: {
        status: 'RUNNING',
        claimedBy: workerId,
        claimedAt: new Date(),
        expiresAt: new Date(Date.now() + env.JOB_LEASE_MS),
      },
      $inc: { attempts: 1 },
    },
    { sort: { priority: -1, createdAt: 1 }, returnDocument: 'after' },
  )
}

export async function completeJob(jobId, result) {
  return FetchJob.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: 'COMPLETED',
        result,
        claimedBy: null,
        claimedAt: null,
        expiresAt: null,
        progress: {
          phase: 'done',
          done: result?.submissionCount ?? 0,
          total: result?.submissionCount ?? 0,
        },
      },
    },
    { returnDocument: 'after' },
  )
}

export async function failJob(jobId, error) {
  const job = await FetchJob.findById(jobId)
  if (!job) return null
  const failed = job.attempts >= job.maxAttempts
  return FetchJob.findByIdAndUpdate(
    jobId,
    {
      $set: {
        status: failed ? 'FAILED' : 'PENDING',
        claimedBy: null,
        claimedAt: null,
        expiresAt: null,
        error: { message: error.message || '', stack: error.stack || '' },
      },
    },
    { returnDocument: 'after' },
  )
}

export async function updateJobProgress(jobId, phase, done, total) {
  return FetchJob.findByIdAndUpdate(
    jobId,
    { $set: { progress: { phase, done, total } } },
    { returnDocument: 'after' },
  )
}

export async function recoverStaleJobs() {
  const now = new Date()
  const stale = await FetchJob.find({ status: 'RUNNING', expiresAt: { $lt: now } })
  for (const job of stale) {
    if (job.attempts >= job.maxAttempts) {
      job.status = 'FAILED'
      job.error = { message: 'Job lease expired after max attempts', stack: '' }
    } else {
      job.status = 'PENDING'
    }
    job.claimedBy = null
    job.claimedAt = null
    job.expiresAt = null
    await job.save()
  }
}

export async function getJobById(jobId) {
  return FetchJob.findById(jobId)
}

export async function getLatestJobForHandle(handle) {
  return FetchJob.findOne({ handle: String(handle).toLowerCase() }).sort({ createdAt: -1 })
}
