import { describe, expect, it } from 'vitest'
import { analyzeRatingBands } from '../../src/modules/analytics/ratingAnalyzer.js'
import { submissionsFixture } from '../fixtures/submissions.js'

describe('rating analyzer', () => {
  it('returns every stable bucket with problem-based statistics', () => {
    const result = analyzeRatingBands(submissionsFixture)

    expect(result.map((bucket) => bucket.key)).toEqual([
      'unrated',
      '800-1000',
      '1000-1200',
      '1200-1400',
      '1400-1600',
      '1600-1800',
      '1800+',
    ])
    expect(result.find((bucket) => bucket.key === '1000-1200')).toMatchObject({
      attempted: 1,
      solved: 1,
      failed: 1,
      rate: 100,
      avg: 2,
    })
    expect(result.find((bucket) => bucket.key === '1200-1400')).toMatchObject({
      attempted: 1,
      solved: 0,
      rate: 0,
    })
  })
})
