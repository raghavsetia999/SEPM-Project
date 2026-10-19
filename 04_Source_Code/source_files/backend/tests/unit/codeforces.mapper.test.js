import { describe, expect, it } from 'vitest'
import {
  mapCodeforcesProfile,
  mapCodeforcesSubmission,
} from '../../src/modules/codeforces/codeforces.mapper.js'

describe('Codeforces mapper', () => {
  it('maps a profile into the internal contract', () => {
    expect(
      mapCodeforcesProfile({ handle: 'tourist', rating: 3900, maxRating: 4000 }),
    ).toMatchObject({
      handle: 'tourist',
      rating: 3900,
      maxRating: 4000,
    })
  })

  it('creates a stable problem key and normalized tags', () => {
    const mapped = mapCodeforcesSubmission({
      id: 42,
      contestId: 123,
      creationTimeSeconds: 1_700_000_000,
      verdict: 'OK',
      problem: {
        contestId: 123,
        index: 'A',
        name: 'Example',
        rating: 900,
        tags: ['Math', 'math'],
      },
    })

    expect(mapped.problemKey).toBe('123-A')
    expect(mapped.tags).toEqual(['math'])
    expect(mapped.url).toContain('/123/A')
  })
})
