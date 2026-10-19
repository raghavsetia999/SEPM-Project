import {
  codeforcesProblemUrl,
  createProblemKey,
  normalizeTag,
} from '../../utils/codeforcesHelpers.js'

export function mapCodeforcesProfile(raw) {
  return {
    handle: raw.handle,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    country: raw.country || '',
    city: raw.city || '',
    organization: raw.organization || '',
    contribution: raw.contribution || 0,
    rating: raw.rating || null,
    maxRating: raw.maxRating || null,
    rank: raw.rank || 'unrated',
    maxRank: raw.maxRank || 'unrated',
    friendOfCount: raw.friendOfCount || 0,
    avatar: raw.titlePhoto || raw.avatar || null,
    registeredAt: raw.registrationTimeSeconds
      ? new Date(raw.registrationTimeSeconds * 1000).toISOString()
      : null,
  }
}

export function mapCodeforcesSubmission(raw) {
  const problem = raw.problem || {}
  return {
    submissionId: raw.id,
    problemKey: createProblemKey(problem),
    contestId: problem.contestId ?? raw.contestId ?? null,
    index: problem.index || null,
    name: problem.name || 'Unknown problem',
    rating: problem.rating ?? null,
    tags: [...new Set((problem.tags || []).map(normalizeTag))],
    verdict: raw.verdict || 'UNKNOWN',
    language: raw.programmingLanguage || 'Unknown',
    createdAt: raw.creationTimeSeconds
      ? new Date(raw.creationTimeSeconds * 1000).toISOString()
      : null,
    passedTestCount: raw.passedTestCount ?? null,
    participantType: raw.author?.participantType || null,
    url: codeforcesProblemUrl(problem.contestId ?? raw.contestId, problem.index),
  }
}

export function mapCodeforcesRatingChange(raw) {
  return {
    contestId: raw.contestId,
    contestName: raw.contestName,
    rank: raw.rank,
    oldRating: raw.oldRating,
    newRating: raw.newRating,
    changedAt: new Date(raw.ratingUpdateTimeSeconds * 1000).toISOString(),
  }
}
