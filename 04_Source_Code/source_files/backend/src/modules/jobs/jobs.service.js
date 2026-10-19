import { getJobById, getLatestJobForHandle, createJob } from '../cfdata/jobService.js'
import { getFreshAnalysisSnapshot } from '../cfdata/ingestionService.js'
import { ApiError } from '../../utils/ApiError.js'

export async function enqueueSync(request, response) {
  const { handle } = request.body
  const user = request.user
  const existingSnapshot = await getFreshAnalysisSnapshot(handle)
  const type = existingSnapshot ? 'sync' : 'init'
  const job = await createJob({ handle, userId: user._id, type })
  response.status(202).json({
    success: true,
    data: { jobId: job._id, status: job.status, type: job.type },
  })
}

export async function getJobStatus(request, response) {
  const { jobId } = request.params
  const job = await getJobById(jobId)
  if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'Job not found.')
  if (!job.userId.equals(request.user._id)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not own this job.')
  }
  response.json({
    success: true,
    data: {
      jobId: job._id,
      handle: job.handle,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      progress: job.progress,
      error: job.status === 'FAILED' ? job.error : undefined,
      result: job.status === 'COMPLETED' ? job.result : undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  })
}

export async function getAnalysis(request, response) {
  const { handle } = request.params
  const snapshot = await getFreshAnalysisSnapshot(handle)
  if (!snapshot) {
    throw new ApiError(404, 'ANALYSIS_NOT_FOUND', 'No analysis available. Import data first.')
  }
  response.json({
    success: true,
    data: {
      handle: snapshot.handle,
      analysis: snapshot.analysis,
      submissionCount: snapshot.submissionCount,
      latestSubmissionId: snapshot.latestSubmissionId,
      generatedAt: snapshot.generatedAt,
    },
  })
}
