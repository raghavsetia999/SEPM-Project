import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  enqueueSync,
  getJobStatus,
  getAnalysis,
} from './jobs.service.js'

export const sync = asyncHandler(async (request, response) => {
  await enqueueSync(request, response)
})

export const jobStatus = asyncHandler(async (request, response) => {
  await getJobStatus(request, response)
})

export const analysis = asyncHandler(async (request, response) => {
  await getAnalysis(request, response)
})
