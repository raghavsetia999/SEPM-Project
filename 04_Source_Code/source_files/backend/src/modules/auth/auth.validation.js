import { z } from 'zod'

const email = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase())

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must include an uppercase letter, a lowercase letter and a number.',
  )

export const codeforcesHandle = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[\w-]+$/, 'Codeforces handle may only contain letters, numbers, underscores, and hyphens')

export const optionalCodeforcesHandle = codeforcesHandle.optional()

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    password,
    codeforcesHandle: optionalCodeforcesHandle,
    targetRating: z.coerce.number().int().min(800).max(4000).optional(),
  }),
}

export const loginSchema = {
  body: z.object({ email, password: z.string().min(1).max(72) }),
}

export const forgotPasswordSchema = {
  body: z.object({ email }),
}

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().trim().min(32).max(256),
    password,
  }),
}
