import { analyzeProblemGroups } from './problemAnalyzer.js'

function countFailedVerdicts(submissions) {
  return submissions.reduce((counts, submission) => {
    const verdict = submission.verdict || 'UNKNOWN'
    counts[verdict] = (counts[verdict] || 0) + 1
    return counts
  }, {})
}

function calculatePriority(problem, profile, topicAnalysis, now) {
  const topicWeaknesses = new Map()
  for (const topic of topicAnalysis) {
    topicWeaknesses.set(topic.topic.toLowerCase(), topic)
    topicWeaknesses.set(topic.short.toLowerCase(), topic)
  }
  const matchingWeakness = problem.tags.reduce((highest, tag) => {
    const match = topicWeaknesses.get(tag.toLowerCase())
    return Math.max(highest, match?.weakness || 0)
  }, 0)
  const attemptScore = Math.min(40, problem.failedSubmissions.length * 10)
  const weaknessScore = matchingWeakness * 0.3
  const currentRating = profile?.rating || 0
  const ratingScore =
    problem.rating == null
      ? 5
      : problem.rating >= currentRating - 100 && problem.rating <= currentRating + 400
        ? 15
        : problem.rating > currentRating + 700
          ? 2
          : 8
  const lastAttemptedAt = problem.lastSubmission?.createdAt
  const daysSinceAttempt = lastAttemptedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(lastAttemptedAt).getTime()) / 86400000))
    : 365
  const recencyScore = daysSinceAttempt <= 7 ? 10 : daysSinceAttempt <= 30 ? 7 : 3
  const contestScore = problem.participantType === 'CONTESTANT' ? 5 : 2
  const score = Math.round(
    Math.max(
      0,
      Math.min(100, attemptScore + weaknessScore + ratingScore + recencyScore + contestScore),
    ),
  )

  const reasons = []
  if (problem.failedSubmissions.length >= 3)
    reasons.push(`${problem.failedSubmissions.length} failed attempts`)
  if (matchingWeakness >= 60) reasons.push('matches a high-weakness topic')
  if (ratingScore === 15) reasons.push('fits your current improvement range')
  if (daysSinceAttempt <= 30) reasons.push('attempted recently')

  return {
    score,
    level: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low',
    reason: reasons.length ? reasons.join('; ') : 'Useful unfinished practice from your history',
    daysSinceAttempt,
  }
}

export function analyzeUpsolving(submissions, profile, topicAnalysis = [], now = new Date()) {
  return analyzeProblemGroups(submissions)
    .filter((problem) => !problem.solved)
    .map((problem) => {
      const priority = calculatePriority(problem, profile, topicAnalysis, now)
      return {
        problemKey: problem.problemKey,
        name: problem.name,
        contest: `${problem.contestId ?? ''}${problem.index ?? ''}` || problem.problemKey,
        contestId: problem.contestId,
        index: problem.index,
        rating: problem.rating,
        tags: problem.tags,
        url: problem.url,
        attempts: problem.relevantSubmissions.length,
        lastVerdict: problem.lastSubmission?.verdict || 'UNKNOWN',
        verdict: problem.lastSubmission?.verdict || 'UNKNOWN',
        failedVerdictCounts: countFailedVerdicts(problem.failedSubmissions),
        lastAttemptedAt: problem.lastSubmission?.createdAt || null,
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priority: priority.level,
        reason: priority.reason,
      }
    })
    .sort(
      (left, right) => right.priorityScore - left.priorityScore || right.attempts - left.attempts,
    )
}
