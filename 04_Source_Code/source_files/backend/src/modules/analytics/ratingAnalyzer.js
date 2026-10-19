import { analyzeProblemGroups } from './problemAnalyzer.js'

export const ratingBuckets = [
  { key: 'unrated', label: 'Unrated', matches: (rating) => rating == null },
  { key: '800-1000', label: '800–1000', matches: (rating) => rating != null && rating < 1000 },
  { key: '1000-1200', label: '1000–1200', matches: (rating) => rating >= 1000 && rating < 1200 },
  { key: '1200-1400', label: '1200–1400', matches: (rating) => rating >= 1200 && rating < 1400 },
  { key: '1400-1600', label: '1400–1600', matches: (rating) => rating >= 1400 && rating < 1600 },
  { key: '1600-1800', label: '1600–1800', matches: (rating) => rating >= 1600 && rating < 1800 },
  { key: '1800+', label: '1800+', matches: (rating) => rating >= 1800 },
]

function bucketFor(rating) {
  return ratingBuckets.find((bucket) => bucket.matches(rating)) || ratingBuckets[0]
}

function rankWeakTags(tagStats) {
  return [...tagStats.entries()]
    .map(([tag, stats]) => {
      const acRate = stats.attempted ? (stats.solved / stats.attempted) * 100 : 0
      const retryPenalty = Math.min(100, (stats.failed / Math.max(stats.attempted * 2, 1)) * 100)
      const score = Math.round((100 - acRate) * 0.7 + retryPenalty * 0.3)
      return { tag, attempted: stats.attempted, solved: stats.solved, failed: stats.failed, score }
    })
    .filter((tag) => tag.attempted > 0)
    .sort((left, right) => right.score - left.score || right.attempted - left.attempted)
    .slice(0, 3)
}

export function analyzeRatingBands(submissions) {
  const buckets = new Map(
    ratingBuckets.map((bucket) => [
      bucket.key,
      {
        key: bucket.key,
        bucket: bucket.label,
        attempted: 0,
        solved: 0,
        failed: 0,
        totalAttempts: 0,
        tagStats: new Map(),
      },
    ]),
  )

  for (const problem of analyzeProblemGroups(submissions)) {
    const definition = bucketFor(problem.rating)
    const bucket = buckets.get(definition.key)
    bucket.attempted += 1
    bucket.solved += problem.solved ? 1 : 0
    bucket.failed += problem.failedSubmissions.length
    bucket.totalAttempts += problem.relevantSubmissions.length

    for (const tag of problem.tags) {
      const stats = bucket.tagStats.get(tag) || { attempted: 0, solved: 0, failed: 0 }
      stats.attempted += 1
      stats.solved += problem.solved ? 1 : 0
      stats.failed += problem.failedSubmissions.length
      bucket.tagStats.set(tag, stats)
    }
  }

  return [...buckets.values()].map((bucket) => {
    const rate = bucket.attempted ? Math.round((bucket.solved / bucket.attempted) * 100) : 0
    const avg = bucket.attempted ? Number((bucket.totalAttempts / bucket.attempted).toFixed(2)) : 0
    const unsolvedRatio = bucket.attempted
      ? ((bucket.attempted - bucket.solved) / bucket.attempted) * 100
      : 0
    const retryPenalty = bucket.attempted
      ? Math.min(100, (bucket.failed / (bucket.attempted * 3)) * 100)
      : 0
    const weakness = Math.round((100 - rate) * 0.5 + retryPenalty * 0.25 + unsolvedRatio * 0.25)

    return {
      key: bucket.key,
      bucket: bucket.bucket,
      attempted: bucket.attempted,
      solved: bucket.solved,
      failed: bucket.failed,
      rate,
      avg,
      weakTags: rankWeakTags(bucket.tagStats),
      weakness: Math.max(0, Math.min(100, weakness)),
    }
  })
}
