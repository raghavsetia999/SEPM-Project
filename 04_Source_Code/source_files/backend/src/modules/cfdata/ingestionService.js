import { codeforcesClient } from '../codeforces/codeforces.client.js'
import {
  mapCodeforcesProfile,
  mapCodeforcesRatingChange,
  mapCodeforcesSubmission,
} from '../codeforces/codeforces.mapper.js'
import { CFProfile } from './cfProfile.model.js'
import { CFSubmission } from './cfSubmission.model.js'
import { CFRatingHistory } from './cfRatingHistory.model.js'
import { AnalysisSnapshot } from './analysisSnapshot.model.js'
import { buildAnalysisFromSnapshot } from '../analytics/analytics.service.js'
import { getCodeforcesProblemset } from '../codeforces/codeforces.service.js'
import { env } from '../../config/env.js'

const PAGE_SIZE = 500
const OVERLAP_COUNT = 100
const INIT_MAX_PAGES = 40

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function ingestProfile(handle) {
  const raw = await codeforcesClient.getUser(handle)
  const profile = mapCodeforcesProfile(raw)
  const normalizedHandle = handle.toLowerCase()
  await CFProfile.findOneAndUpdate(
    { handle: normalizedHandle },
    {
      $set: {
        ...profile,
        handle: normalizedHandle,
        registeredAt: profile.registeredAt ? new Date(profile.registeredAt) : null,
        lastFetchedAt: new Date(),
      },
    },
    { upsert: true },
  )
  return profile
}

export async function ingestRatingHistory(handle) {
  const raw = await codeforcesClient.getRatingHistory(handle)
  const normalizedHandle = handle.toLowerCase()
  const operations = raw.map((entry) => {
    const mapped = mapCodeforcesRatingChange(entry)
    return {
      updateOne: {
        filter: { handle: normalizedHandle, contestId: mapped.contestId },
        update: {
          $set: {
            ...mapped,
            handle: normalizedHandle,
            changedAt: mapped.changedAt ? new Date(mapped.changedAt) : null,
          },
        },
        upsert: true,
      },
    }
  })
  if (operations.length) {
    await CFRatingHistory.bulkWrite(operations, { ordered: false })
  }
  return raw.map(mapCodeforcesRatingChange)
}

export async function ingestSubmissions(handle, { type, lastSubmissionId = 0, onProgress } = {}) {
  const normalizedHandle = handle.toLowerCase()

  if (type === 'sync') {
    const batch = await codeforcesClient.getSubmissions(handle, OVERLAP_COUNT, 1)
    if (batch.length) {
      await upsertSubmissions(normalizedHandle, batch)
      if (onProgress) onProgress(batch.length)
    }
    return batch.length
  }

  let from = 1
  let fetched = 0
  while (from <= PAGE_SIZE * INIT_MAX_PAGES) {
    const batch = await codeforcesClient.getSubmissions(handle, PAGE_SIZE, from)
    if (!batch.length) break
    await upsertSubmissions(normalizedHandle, batch)
    fetched += batch.length
    if (onProgress) onProgress(fetched)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
    await sleep(env.CF_THROTTLE_MS)
  }
  return fetched
}

async function upsertSubmissions(normalizedHandle, rawSubmissions) {
  const operations = rawSubmissions.map((rawSub) => {
    const mapped = mapCodeforcesSubmission(rawSub)
    return {
      updateOne: {
        filter: { handle: normalizedHandle, submissionId: mapped.submissionId },
        update: {
          $set: {
            ...mapped,
            handle: normalizedHandle,
            createdAt: mapped.createdAt ? new Date(mapped.createdAt) : null,
          },
        },
        upsert: true,
      },
    }
  })
  await CFSubmission.bulkWrite(operations, { ordered: false })
}

export async function getMaxSubmissionId(handle) {
  const doc = await CFSubmission.findOne({ handle: String(handle).toLowerCase() })
    .sort({ submissionId: -1 })
    .select('submissionId')
    .lean()
  return doc?.submissionId || 0
}

export async function buildSnapshotFromDb(handle) {
  const normalizedHandle = String(handle).toLowerCase()
  const [profile, submissions, ratingHistory] = await Promise.all([
    CFProfile.findOne({ handle: normalizedHandle }).lean(),
    CFSubmission.find({ handle: normalizedHandle }).sort({ submissionId: 1 }).lean(),
    CFRatingHistory.find({ handle: normalizedHandle }).sort({ contestId: 1 }).lean(),
  ])

  if (!profile) throw new Error(`No CF profile found for handle: ${handle}`)

  return {
    profile: {
      handle: profile.handle,
      firstName: profile.firstName,
      lastName: profile.lastName,
      country: profile.country,
      city: profile.city,
      organization: profile.organization,
      contribution: profile.contribution,
      rating: profile.rating,
      maxRating: profile.maxRating,
      rank: profile.rank,
      maxRank: profile.maxRank,
      friendOfCount: profile.friendOfCount,
      avatar: profile.avatar,
      registeredAt: profile.registeredAt ? profile.registeredAt.toISOString() : null,
    },
    submissions: submissions.map((s) => ({
      submissionId: s.submissionId,
      problemKey: s.problemKey,
      contestId: s.contestId,
      index: s.index,
      name: s.name,
      rating: s.rating,
      tags: s.tags,
      verdict: s.verdict,
      language: s.language,
      createdAt: s.createdAt ? s.createdAt.toISOString() : null,
      passedTestCount: s.passedTestCount,
      participantType: s.participantType,
      url: s.url,
    })),
    ratingHistory: ratingHistory.map((r) => ({
      contestId: r.contestId,
      contestName: r.contestName,
      rank: r.rank,
      oldRating: r.oldRating,
      newRating: r.newRating,
      changedAt: r.changedAt ? r.changedAt.toISOString() : null,
    })),
    fetchedAt: new Date().toISOString(),
    cached: false,
  }
}

export async function buildAndSaveSnapshot(handle, userId) {
  const normalizedHandle = String(handle).toLowerCase()
  const snapshot = await buildSnapshotFromDb(handle)
  const problemset = await getCodeforcesProblemset().catch(() => [])
  const analysis = buildAnalysisFromSnapshot(snapshot, problemset)

  const maxSubId = await getMaxSubmissionId(handle)
  await AnalysisSnapshot.deleteMany({ handle: normalizedHandle })
  const saved = await AnalysisSnapshot.create({
    handle: normalizedHandle,
    userId,
    submissionCount: snapshot.submissions.length,
    latestSubmissionId: maxSubId,
    analysis,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + env.ANALYSIS_SNAPSHOT_TTL_MS),
  })
  return saved
}

export async function getFreshAnalysisSnapshot(handle) {
  const normalizedHandle = String(handle).toLowerCase()
  return AnalysisSnapshot.findOne({
    handle: normalizedHandle,
    expiresAt: { $gt: new Date() },
  }).sort({ generatedAt: -1 })
}
