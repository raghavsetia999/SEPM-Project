import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  deleteReport,
  ensureWeeklyReport,
  exportReport,
  getLatestReport,
  getReport,
  listReports,
  saveReport,
} from './report.controller.js'
import { latestReportSchema, reportIdSchema, saveReportSchema } from './report.validation.js'

export const reportRouter = Router()

reportRouter.use(authMiddleware)
reportRouter.post('/save', validateRequest(saveReportSchema), asyncHandler(saveReport))
reportRouter.post('/weekly', asyncHandler(ensureWeeklyReport))
reportRouter.get('/', asyncHandler(listReports))
reportRouter.get(
  '/handle/:handle/latest',
  validateRequest(latestReportSchema),
  asyncHandler(getLatestReport),
)
reportRouter.get('/:id/export', validateRequest(reportIdSchema), asyncHandler(exportReport))
reportRouter.get('/:id', validateRequest(reportIdSchema), asyncHandler(getReport))
reportRouter.delete('/:id', validateRequest(reportIdSchema), asyncHandler(deleteReport))
