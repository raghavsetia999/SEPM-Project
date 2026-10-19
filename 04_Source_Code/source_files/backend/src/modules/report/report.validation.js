import { z } from 'zod'

const handle = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[\w-]+$/, 'Invalid Codeforces handle format')

export const saveReportSchema = { body: z.object({ handle }) }
export const reportIdSchema = {
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid report ID') }),
}
export const latestReportSchema = { params: z.object({ handle }) }
