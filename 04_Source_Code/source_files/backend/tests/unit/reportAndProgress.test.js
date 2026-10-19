import { describe, expect, it, vi } from 'vitest'
import {
  buildReportPayload,
  ensureWeeklyReportForUser,
  getLatestReportForHandle,
  saveReportForUser,
} from '../../src/modules/report/report.service.js'
import {
  buildProgressHistory,
  getProgressForUser,
} from '../../src/modules/progress/progress.service.js'
import { PassThrough } from 'node:stream'
import { createReportPdf } from '../../src/modules/report/report.pdf.js'

function analysisFixture() {
  return {
    profile: { handle: 'fixture', rating: 1200 },
    summary: { solvedProblems: 10 },
    topicAnalysis: [{ topic: 'DP', weakness: 70, attempted: 5 }],
    ratingAnalysis: [],
    verdictAnalysis: { distribution: [] },
    upsolvingAnalysis: [],
    metadata: { submissionCount: 20 },
    generatedAt: '2026-06-01T00:00:00.000Z',
  }
}

describe('report persistence helpers', () => {
  it('builds the complete persisted report contract', () => {
    const analysis = analysisFixture()
    const payload = buildReportPayload('user-1', analysis)
    expect(payload).toMatchObject({
      userId: 'user-1',
      handle: 'fixture',
      isSaved: true,
      metadata: { analyticsVersion: 1 },
    })
  })

  it('supports an injected model and analyzer for isolated persistence tests', async () => {
    const saved = await saveReportForUser(
      { id: 'user-1', preferredPracticeMinutes: 60 },
      'fixture',
      {
        analyze: async () => analysisFixture(),
        model: { create: async (value) => ({ ...value, id: 'report-1' }) },
      },
    )
    expect(saved.id).toBe('report-1')
  })

  it('renders a valid PDF report stream', async () => {
    const output = new PassThrough()
    const chunks = []
    output.on('data', (chunk) => chunks.push(chunk))
    const finished = new Promise((resolve, reject) => {
      output.on('finish', resolve)
      output.on('error', reject)
    })
    createReportPdf(buildReportPayload('user-1', analysisFixture()), output)
    await finished
    const pdf = Buffer.concat(chunks)

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(1000)
  })

  it('generates a weekly report after seven days and records comparison data', async () => {
    const previous = {
      generatedAt: '2026-06-01T00:00:00.000Z',
      profile: { rating: 1180 },
      summary: { solvedProblems: 8 },
      topicAnalysis: [{ topic: 'DP', weakness: 80, attempted: 5 }],
    }
    const create = vi.fn(async (payload) => ({ ...payload, id: 'weekly-2' }))
    const result = await ensureWeeklyReportForUser(
      {
        id: 'user-1',
        codeforcesHandle: 'fixture',
        preferredPracticeMinutes: 60,
        preferences: { weeklyReport: true },
      },
      {
        analyze: async () => analysisFixture(),
        model: {
          findOne: () => ({ sort: () => ({ lean: async () => previous }) }),
          create,
        },
      },
      new Date('2026-06-10T00:00:00.000Z'),
    )

    expect(result.generated).toBe(true)
    expect(result.report.reportType).toBe('weekly')
    expect(result.report.weeklyComparison).toMatchObject({
      hasBaseline: true,
      solvedChange: 2,
      ratingChange: 20,
      weaknessChange: -10,
    })
    expect(create).toHaveBeenCalledOnce()
  })

  it('forces a fresh Codeforces snapshot when saving a report', async () => {
    const analyze = vi.fn(async () => analysisFixture())
    await saveReportForUser({ id: 'user-1', preferredPracticeMinutes: 60 }, 'fixture', {
      analyze,
      model: { create: async (value) => ({ ...value, id: 'report-1' }) },
    })
    expect(analyze).toHaveBeenCalledWith('fixture', { forceRefresh: true })
  })

  it('looks up the latest report with a case-insensitive handle', async () => {
    const findOne = vi.fn(() => ({ sort: () => ({ lean: async () => ({ id: 'report-1' }) }) }))
    await getLatestReportForHandle('user-1', 'Raghav', { findOne })
    const [filter] = findOne.mock.calls[0]
    expect(filter.handle).toBeInstanceOf(RegExp)
    expect(filter.handle.test('raghav')).toBe(true)
    expect(filter.handle.test('RAGHAV')).toBe(true)
  })

  it('reuses the current weekly report before the next seven-day boundary', async () => {
    const current = { id: 'weekly-1', generatedAt: '2026-06-08T00:00:00.000Z' }
    const analyze = vi.fn()
    const result = await ensureWeeklyReportForUser(
      {
        id: 'user-1',
        codeforcesHandle: 'fixture',
        preferredPracticeMinutes: 60,
        preferences: { weeklyReport: true },
      },
      {
        analyze,
        model: {
          findOne: () => ({ sort: () => ({ lean: async () => current }) }),
        },
      },
      new Date('2026-06-10T00:00:00.000Z'),
    )

    expect(result).toMatchObject({ report: current, generated: false })
    expect(analyze).not.toHaveBeenCalled()
  })
})

describe('progress history', () => {
  it('matches saved reports case-insensitively', async () => {
    const find = vi.fn(() => ({ sort: () => ({ select: () => ({ lean: async () => [] }) }) }))
    await getProgressForUser('user-1', 'Raghav', { find })
    const [filter] = find.mock.calls[0]
    expect(filter.handle).toBeInstanceOf(RegExp)
    expect(filter.handle.test('raghav')).toBe(true)
    expect(filter.handle.test('RAGHAV')).toBe(true)
  })

  it('requires two reports before claiming trend confidence', () => {
    const one = buildProgressHistory([
      {
        id: 'one',
        generatedAt: '2026-06-01T00:00:00.000Z',
        profile: { rating: 1200 },
        summary: { solvedProblems: 10 },
        topicAnalysis: [{ topic: 'DP', weakness: 70, attempted: 5 }],
      },
    ])
    expect(one.hasEnoughData).toBe(false)

    const two = buildProgressHistory([
      ...one.points.map((point) => ({
        id: point.reportId,
        generatedAt: point.generatedAt,
        profile: { rating: point.rating },
        summary: { solvedProblems: point.solved },
        topicAnalysis: [{ topic: 'DP', weakness: 70, attempted: 5 }],
      })),
      {
        id: 'two',
        generatedAt: '2026-06-08T00:00:00.000Z',
        profile: { rating: 1240 },
        summary: { solvedProblems: 14 },
        topicAnalysis: [{ topic: 'DP', weakness: 55, attempted: 8 }],
      },
    ])
    expect(two.hasEnoughData).toBe(true)
    expect(two.topicImprovement[0].improvement).toBe(15)
  })
})
