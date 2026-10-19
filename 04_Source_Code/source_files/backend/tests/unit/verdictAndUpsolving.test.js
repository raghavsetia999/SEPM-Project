import { describe, expect, it } from 'vitest'
import { analyzeUpsolving } from '../../src/modules/analytics/upsolvingAnalyzer.js'
import { analyzeVerdicts } from '../../src/modules/analytics/verdictAnalyzer.js'
import { submissionsFixture } from '../fixtures/submissions.js'

describe('verdict analyzer', () => {
  it('describes verdict distribution and solving behavior', () => {
    const result = analyzeVerdicts(submissionsFixture)

    expect(result.totalSubmissions).toBe(4)
    expect(result.mostCommonFailedVerdict.key).toBe('WRONG_ANSWER')
    expect(result.averageFailedAttemptsBeforeAc).toBe(1)
    expect(result.firstTrySolvedProblems).toBe(0)
    expect(result.multiAttemptSolvedProblems).toBe(1)
    expect(result.mostPainfulProblems).toHaveLength(2)
  })
})

describe('upsolving analyzer', () => {
  it('returns only attempted problems that were never solved', () => {
    const result = analyzeUpsolving(
      submissionsFixture,
      { rating: 1100 },
      [{ topic: 'Dynamic Programming', short: 'DP', weakness: 80 }],
      new Date('2026-06-20T10:00:00.000Z'),
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      problemKey: '200-B',
      attempts: 1,
      lastVerdict: 'WRONG_ANSWER',
    })
    expect(result[0].priorityScore).toBeGreaterThan(0)
    expect(result[0].reason).toBeTruthy()
  })
})
