import { z } from 'zod'

export const handleParamsSchema = {
  params: z.object({
    handle: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .regex(/^[\w-]+$/, 'Invalid Codeforces handle format'),
  }),
}
