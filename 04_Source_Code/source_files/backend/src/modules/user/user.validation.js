import { z } from 'zod'
import { codeforcesHandle } from '../auth/auth.validation.js'

const topicList = z.array(z.string().trim().min(1).max(50)).max(12)

export const updateProfileSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      targetRating: z.coerce.number().int().min(800).max(4000).optional(),
      preferredPracticeMinutes: z.coerce
        .number()
        .int()
        .refine((value) => [30, 60, 90, 120].includes(value))
        .optional(),
      difficultTopics: topicList.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one profile field is required'),
}

export const updateHandleSchema = {
  body: z.object({
    codeforcesHandle,
  }),
}

export const updatePreferencesSchema = {
  body: z
    .object({
      includeGymSubmissions: z.boolean().optional(),
      weeklyReport: z.boolean().optional(),
      streakReminders: z.boolean().optional(),
      contestReminders: z.boolean().optional(),
      detailedAIExplanations: z.boolean().optional(),
      automaticRefresh: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one preference is required'),
}
