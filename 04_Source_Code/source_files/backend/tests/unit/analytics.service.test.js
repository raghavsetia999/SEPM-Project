import { describe, expect, it } from 'vitest'
import {
  analyzeTopics,
  createSummary,
  groupSubmissionsByProblem,
} from '../../src/modules/analytics/analytics.service.js'
import { submissionsFixture } from '../fixtures/submissions.js'

describe('analytics service', () => {
  it('groups repeated submissions by stable problem identity', () => {
    const groups = groupSubmissionsByProblem(submissionsFixture)
    expect(groups).toHaveLength(2)
    expect(groups[0].submissions).toHaveLength(3)
  })

  it('calculates topic statistics from unique problems and ignores failures after first AC', () => {
    const topics = analyzeTopics(submissionsFixture, new Date('2026-06-20T10:00:00.000Z'))
    const dp = topics.find((topic) => topic.short === 'DP')

    expect(dp).toMatchObject({
      attempted: 2,
      solved: 1,
      unsolved: 1,
      failed: 2,
      rate: 50,
      avgAttemptsBeforeAc: 2,
    })
    expect(dp.components).toBeDefined()
    expect(dp.weakness).toBeGreaterThanOrEqual(0)
    expect(dp.weakness).toBeLessThanOrEqual(100)
  })

  it('creates a problem-based summary', () => {
    const topicAnalysis = analyzeTopics(submissionsFixture)
    const summary = createSummary(
      {
        profile: { handle: 'fixture' },
        submissions: submissionsFixture,
        ratingHistory: [],
        fetchedAt: '2026-06-20T10:00:00.000Z',
      },
      topicAnalysis,
    )

    expect(summary).toMatchObject({
      totalSubmissions: 4,
      attemptedProblems: 2,
      solvedProblems: 1,
      unsolvedAttemptedProblems: 1,
      acRate: 50,
    })
    expect(summary.recentActivity).toHaveLength(4)
    expect(summary.recentActivity[0].problemKey).toBe('100-A')
  })
})
