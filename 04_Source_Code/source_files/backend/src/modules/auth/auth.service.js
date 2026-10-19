import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { User } from '../user/user.model.js'
import { RefreshToken } from './refreshToken.model.js'
import { ApiError } from '../../utils/ApiError.js'
import { isPasswordEmailConfigured, sendPasswordResetEmail } from './auth.mail.js'

export const accessTokenCookie = 'accessToken'
export const refreshTokenCookie = 'refreshToken'
export const oauthStateCookie = 'googleOAuthState'

const googleAuthorizationUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
const googleTokenUrl = 'https://oauth2.googleapis.com/token'
const googleUserInfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo'

const REFRESH_COOKIE_PATH = '/api/auth'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Used to equalize timing so login cannot leak whether an email exists.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equalizer-dummy', 10)

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function parseDurationMs(value, fallbackMs) {
  const match = /^(\d+)([smhd])$/.exec(String(value).trim())
  if (!match) return fallbackMs
  const amount = Number(match[1])
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]]
  return amount * unitMs
}

export function signAccessToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseDurationMs(env.JWT_EXPIRES_IN, 15 * 60 * 1000),
    path: '/',
  }
}

export function refreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: REFRESH_COOKIE_PATH,
  }
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/google',
  }
}

export function clearAuthCookieOptions() {
  const { maxAge: _a, ...access } = authCookieOptions()
  const { maxAge: _r, ...refresh } = refreshTokenCookieOptions()
  return { access, refresh }
}

async function issueSessionTokens(user, context = {}) {
  const accessToken = signAccessToken(user.id)

  const familyId = context.familyId || crypto.randomUUID()
  const rawRefreshToken = crypto.randomBytes(48).toString('hex')
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(rawRefreshToken),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: context.userAgent || '',
    ip: context.ip || '',
  })

  return { accessToken, refreshToken: rawRefreshToken }
}

async function revokeRefreshRecord(record, replacedByHash = null) {
  record.revokedAt = new Date()
  record.replacedByHash = replacedByHash
  await record.save()
}

export async function registerUser(input, context = {}) {
  const existingUser = await User.findOne({ email: input.email })
  if (existingUser) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email.')
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    codeforcesHandle: input.codeforcesHandle || '',
    targetRating: input.targetRating || 1600,
  })

  const tokens = await issueSessionTokens(user, context)
  return { user, ...tokens }
}

export async function loginUser(input, context = {}) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash')

  // Always run a bcrypt comparison to keep response timing consistent.
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash || DUMMY_PASSWORD_HASH,
  )

  if (!user || !user.passwordHash || !passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.')
  }

  const tokens = await issueSessionTokens(user, context)
  return { user, ...tokens }
}

export async function refreshSession(rawRefreshToken, context = {}) {
  if (!rawRefreshToken) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'A valid refresh token is required.')
  }

  const tokenHash = hashToken(rawRefreshToken)
  const record = await RefreshToken.findOne({ tokenHash })

  if (!record) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Your session is invalid or has expired.')
  }

  if (record.revokedAt) {
    // Reuse of a rotated/revoked token: revoke the entire family as a precaution.
    await RefreshToken.updateMany({ familyId: record.familyId, revokedAt: null }, [
      { $set: { revokedAt: new Date() } },
    ])
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Your session is invalid or has expired.')
  }

  if (record.expiresAt <= new Date()) {
    await revokeRefreshRecord(record)
    throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please log in again.')
  }

  const user = await User.findById(record.userId)
  if (!user) {
    await revokeRefreshRecord(record)
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'The account for this session no longer exists.')
  }

  const tokens = await issueSessionTokens(user, { ...context, familyId: record.familyId })
  await revokeRefreshRecord(record, hashToken(tokens.refreshToken))

  return { user, ...tokens }
}

export async function revokeSession(rawRefreshToken) {
  if (!rawRefreshToken) return { revoked: false }
  const record = await RefreshToken.findOne({ tokenHash: hashToken(rawRefreshToken) })
  if (!record || record.revokedAt) return { revoked: false }
  await revokeRefreshRecord(record)
  return { revoked: true }
}

export async function revokeAllSessions(userId) {
  await RefreshToken.updateMany({ userId, revokedAt: null }, [{ $set: { revokedAt: new Date() } }])
}

export function isGoogleOAuthConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

export function createGoogleAuthorization() {
  if (!isGoogleOAuthConfigured()) {
    throw new ApiError(
      503,
      'GOOGLE_OAUTH_NOT_CONFIGURED',
      'Google sign-in is not configured on this server.',
    )
  }

  const state = crypto.randomBytes(32).toString('hex')
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    prompt: 'select_account',
  })

  return { state, url: `${googleAuthorizationUrl}?${params.toString()}` }
}

export async function completeGoogleAuthorization({ code, expectedState, state }, context = {}) {
  if (!code || !state || !expectedState || state !== expectedState) {
    throw new ApiError(400, 'INVALID_OAUTH_STATE', 'Google sign-in could not be verified.')
  }

  const tokenResponse = await axios.post(
    googleTokenUrl,
    new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 },
  )

  const profileResponse = await axios.get(googleUserInfoUrl, {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    timeout: 10000,
  })
  const profile = profileResponse.data

  if (!profile.sub || !profile.email || !profile.email_verified) {
    throw new ApiError(
      401,
      'GOOGLE_EMAIL_NOT_VERIFIED',
      'Google did not provide a verified email address.',
    )
  }

  const email = profile.email.trim().toLowerCase()
  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] }).select('+googleId')

  if (user?.googleId && user.googleId !== profile.sub) {
    throw new ApiError(409, 'GOOGLE_ACCOUNT_CONFLICT', 'This email is linked to another account.')
  }

  if (!user) {
    user = new User({
      name: profile.name || email.split('@')[0],
      email,
      googleId: profile.sub,
      emailVerified: true,
      profileImageUrl: profile.picture || '',
    })
  } else {
    user.googleId = profile.sub
    user.emailVerified = true
    user.profileImageUrl = profile.picture || user.profileImageUrl
  }

  await user.save()
  const tokens = await issueSessionTokens(user, context)
  return { user, ...tokens }
}

export async function requestPasswordReset(input) {
  const user = await User.findOne({ email: input.email })
  if (!user) return { accepted: true }

  const resetToken = crypto.randomBytes(32).toString('hex')
  user.passwordResetTokenHash = hashToken(resetToken)
  user.passwordResetExpiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000,
  )
  await user.save()

  const resetUrl = new URL(env.PASSWORD_RESET_URL)
  resetUrl.searchParams.set('token', resetToken)

  if (isPasswordEmailConfigured()) {
    try {
      await sendPasswordResetEmail({
        name: user.name,
        resetUrl: resetUrl.toString(),
        to: user.email,
      })
    } catch (error) {
      console.error('Failed to send password reset email:', error.message)
    }
    return { accepted: true }
  }

  return {
    accepted: true,
    ...(env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl.toString() } : {}),
  }
}

export async function resetPassword(input, context = {}) {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(input.token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt')

  if (!user) {
    throw new ApiError(400, 'INVALID_RESET_TOKEN', 'This reset link is invalid or has expired.')
  }

  user.passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
  user.passwordResetTokenHash = undefined
  user.passwordResetExpiresAt = undefined
  await user.save()

  // Password change invalidates all existing sessions.
  await revokeAllSessions(user.id)

  const tokens = await issueSessionTokens(user, context)
  return { user, ...tokens }
}
