import { beforeEach, describe, expect, it, vi } from 'vitest'
import { codeforcesClient } from '../../src/modules/codeforces/codeforces.client.js'
import {
  getCodeforcesProblemset,
  getCodeforcesSnapshot,
} from '../../src/modules/codeforces/codeforces.service.js'

describe('Codeforces cache', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('coalesces and reuses snapshots inside the TTL', async () => {
    const user = vi
      .spyOn(codeforcesClient, 'getUser')
      .mockResolvedValue({ handle: 'cache_fixture' })
    const submissions = vi.spyOn(codeforcesClient, 'getSubmissions').mockResolvedValue([])
    const rating = vi.spyOn(codeforcesClient, 'getRatingHistory').mockResolvedValue([])

    const [first, second] = await Promise.all([
      getCodeforcesSnapshot('cache_fixture'),
      getCodeforcesSnapshot('cache_fixture'),
    ])
    const third = await getCodeforcesSnapshot('cache_fixture')

    expect(first.profile.handle).toBe('cache_fixture')
    expect(second.profile.handle).toBe('cache_fixture')
    expect(third.cached).toBe(true)
    expect(user).toHaveBeenCalledTimes(1)
    expect(submissions).toHaveBeenCalledTimes(1)
    expect(rating).toHaveBeenCalledTimes(1)
  })

  it('normalizes and caches the global problem catalogue', async () => {
    const problemset = vi.spyOn(codeforcesClient, 'getProblemset').mockResolvedValue({
      problems: [{ contestId: 42, index: 'A', name: 'Example', rating: 900, tags: ['Math'] }],
    })

    const first = await getCodeforcesProblemset()
    const second = await getCodeforcesProblemset()

    expect(first[0]).toMatchObject({ problemKey: '42-A', tags: ['math'] })
    expect(second).toEqual(first)
    expect(problemset).toHaveBeenCalledTimes(1)
  })
})
