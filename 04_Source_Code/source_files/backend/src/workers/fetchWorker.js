import os from 'node:os'
import { env } from '../config/env.js'
import {
  claimNextJob,
  completeJob,
  failJob,
  updateJobProgress,
} from '../modules/cfdata/jobService.js'
import {
  ingestProfile,
  ingestRatingHistory,
  ingestSubmissions,
  getMaxSubmissionId,
  buildAndSaveSnapshot,
} from '../modules/cfdata/ingestionService.js'

const WORKER_ID = `${os.hostname()}:${process.pid}`

let running = false

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processNextJob() {
  const job = await claimNextJob(WORKER_ID)
  if (!job) return false

  try {
    const { handle, userId, type } = job

    await updateJobProgress(job._id, 'profile', 0, 4)
    await ingestProfile(handle)
    await sleep(env.CF_THROTTLE_MS)

    await updateJobProgress(job._id, 'rating-history', 1, 4)
    await ingestRatingHistory(handle)
    await sleep(env.CF_THROTTLE_MS)

    await updateJobProgress(job._id, 'submissions', 2, 4)
    const lastSubmissionId = job.lastSubmissionId || 0
    const fetched = await ingestSubmissions(handle, {
      type,
      lastSubmissionId,
    })

    await updateJobProgress(job._id, 'analysis', 3, 4)
    const latestSubmissionId = await getMaxSubmissionId(handle)
    const savedSnapshot = await buildAndSaveSnapshot(handle, userId)

    await completeJob(job._id, {
      snapshotId: savedSnapshot._id,
      submissionCount: fetched,
    })

    console.log(
      `[worker:${WORKER_ID}] job ${job._id} COMPLETED (${type} ${handle}, ${fetched} submissions)`,
    )
    return true
  } catch (error) {
    console.error(`[worker:${WORKER_ID}] job ${job._id} FAILED: ${error.message}`)
    await failJob(job._id, error)
    return true
  }
}

export async function startWorker() {
  if (running) return
  running = true
  console.log(`[worker:${WORKER_ID}] started, polling every ${env.WORKER_POLL_INTERVAL_MS}ms`)

  while (running) {
    try {
      const processed = await processNextJob()
      if (processed) {
        await sleep(250)
      } else {
        await sleep(env.WORKER_POLL_INTERVAL_MS)
      }
    } catch (error) {
      console.error(`[worker:${WORKER_ID}] loop error: ${error.message}`)
      await sleep(2000)
    }
  }
}

export function stopWorker() {
  running = false
  console.log(`[worker:${WORKER_ID}] stopped`)
}
