import { successResponse } from '../../utils/ApiResponse.js'
import { analyzeHandle } from './analytics.service.js'

export async function analyze(request, response) {
  const report = await analyzeHandle(request.params.handle, {
    forceRefresh: request.query.refresh === 'true',
  })
  response.json(
    successResponse(report, {
      generatedAt: report.summary.source.fetchedAt,
      cached: report.cache.cached,
      stale: report.cache.stale,
      source: 'codeforces',
    }),
  )
}

export async function summary(request, response) {
  const report = await analyzeHandle(request.params.handle, {
    forceRefresh: request.query.refresh === 'true',
  })
  response.json(successResponse(report.summary))
}

export async function weakness(request, response) {
  const report = await analyzeHandle(request.params.handle)
  response.json(successResponse(report.topicAnalysis))
}

export async function rating(request, response) {
  const report = await analyzeHandle(request.params.handle)
  response.json(successResponse(report.ratingAnalysis))
}

export async function verdicts(request, response) {
  const report = await analyzeHandle(request.params.handle)
  response.json(successResponse(report.verdictAnalysis))
}

export async function upsolving(request, response) {
  const report = await analyzeHandle(request.params.handle)
  response.json(successResponse(report.upsolvingAnalysis))
}
