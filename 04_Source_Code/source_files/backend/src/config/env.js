import 'dotenv/config'
import { z } from 'zod'

const developmentSecret = 'development-only-secret-change-before-production'

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().optional(),
)

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/cp-performance-analyzer'),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    JWT_SECRET: z.string().min(32).default(developmentSecret),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32).default(developmentSecret),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
    PASSWORD_RESET_URL: z.string().url().default('http://localhost:5173/reset-password'),
    PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    SMTP_FROM: z.string().default('CP Pulse <no-reply@cppulse.local>'),
    SENDGRID_API_KEY: optionalString,
    SENDGRID_FROM_EMAIL: z.string().email().default('no-reply@example.com'),
    SENDGRID_FROM_NAME: z.string().default('CP Pulse'),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:5000/api/auth/google/callback'),
    CODEFORCES_API_BASE_URL: z.string().url().default('https://codeforces.com/api'),
    CODEFORCES_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
    CODEFORCES_CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 60 * 1000),
    CODEFORCES_PROBLEMSET_CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(6 * 60 * 60 * 1000),
    CF_THROTTLE_MS: z.coerce.number().int().min(0).default(2000),
    WORKER_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(100).default(2000),
    JOB_LEASE_MS: z.coerce.number().int().min(60000).default(10 * 60 * 1000),
    ANALYSIS_SNAPSHOT_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(24 * 60 * 60 * 1000),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV === 'production' && values.JWT_SECRET === developmentSecret) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be configured in production',
      })
    }
    if (values.NODE_ENV === 'production' && values.JWT_REFRESH_SECRET === developmentSecret) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be configured in production',
      })
    }
    if (Boolean(values.GOOGLE_CLIENT_ID) !== Boolean(values.GOOGLE_CLIENT_SECRET)) {
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together',
      })
    }
    if (Boolean(values.SMTP_USER) !== Boolean(values.SMTP_PASS)) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'SMTP_USER and SMTP_PASS must be configured together',
      })
    }
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid environment configuration: ${details}`)
}

export const env = Object.freeze(parsed.data)
