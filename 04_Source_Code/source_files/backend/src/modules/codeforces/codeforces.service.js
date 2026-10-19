import { codeforcesClient } from './codeforces.client.js'
import {
  mapCodeforcesProfile,
  mapCodeforcesRatingChange,
  mapCodeforcesSubmission,
} from './codeforces.mapper.js'
import { env } from '../../config/env.js'
import {
  codeforcesProblemUrl,
  createProblemKey,
  normalizeTag,
} from '../../utils/codeforcesHelpers.js'

const snapshotCache = new Map()
const snapshotRequests = new Map()
let problemsetCache = null
let problemsetRequest = null

function fresh(entry, ttl) {
  return entry && Date.now() - entry.cachedAt < ttl
}

export async function getCodeforcesProfile(handle) {
  return mapCodeforcesProfile(await codeforcesClient.getUser(handle))
}

export async function getCodeforcesSubmissions(handle) {
  const submissions = await codeforcesClient.getSubmissions(handle)
  return submissions.map(mapCodeforcesSubmission)
}

export async function getCodeforcesRatingHistory(handle) {
  const history = await codeforcesClient.getRatingHistory(handle)
  return history.map(mapCodeforcesRatingChange)
}

export async function getCodeforcesSnapshot(handle, { forceRefresh = false } = {}) {
  const key = handle.toLowerCase()
  const cached = snapshotCache.get(key)
  if (!forceRefresh && fresh(cached, env.CODEFORCES_CACHE_TTL_MS)) {
    return { ...cached.value, cached: true }
  }
  if (!forceRefresh && snapshotRequests.has(key)) return snapshotRequests.get(key)

  const request = Promise.all([
    getCodeforcesProfile(handle),
    getCodeforcesSubmissions(handle),
    getCodeforcesRatingHistory(handle),
  ])
    .then(([profile, submissions, ratingHistory]) => {
      const value = {
        profile,
        submissions,
        ratingHistory,
        fetchedAt: new Date().toISOString(),
        cached: false,
      }
      snapshotCache.set(key, { value, cachedAt: Date.now() })
      return value
    })
    .catch((error) => {
      if (cached) return { ...cached.value, cached: true, stale: true }
      throw error
    })
    .finally(() => snapshotRequests.delete(key))

  snapshotRequests.set(key, request)
  return request
}

function mapProblem(problem) {
  return {
    problemKey: createProblemKey(problem),
    contestId: problem.contestId ?? null,
    index: problem.index || null,
    name: problem.name || 'Unknown problem',
    rating: problem.rating ?? null,
    tags: [...new Set((problem.tags || []).map(normalizeTag))],
    url: codeforcesProblemUrl(problem.contestId, problem.index),
  }
}

export async function getCodeforcesProblemset({ forceRefresh = false } = {}) {
  if (!forceRefresh && fresh(problemsetCache, env.CODEFORCES_PROBLEMSET_CACHE_TTL_MS)) {
    return problemsetCache.value
  }
  if (!forceRefresh && problemsetRequest) return problemsetRequest

  problemsetRequest = codeforcesClient
    .getProblemset()
    .then((result) => {
      const value = (result.problems || []).map(mapProblem)
      problemsetCache = { value, cachedAt: Date.now() }
      return value
    })
    .catch((error) => {
      if (problemsetCache) return problemsetCache.value
      throw error
    })
    .finally(() => {
      problemsetRequest = null
    })
  return problemsetRequest
}
