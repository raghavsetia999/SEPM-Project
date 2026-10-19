import { env } from '../../config/env.js'
import { successResponse } from '../../utils/ApiResponse.js'
import {
  accessTokenCookie,
  authCookieOptions,
  clearAuthCookieOptions,
  completeGoogleAuthorization,
  createGoogleAuthorization,
  isGoogleOAuthConfigured,
  loginUser,
  oauthStateCookie,
  oauthStateCookieOptions,
  refreshSession,
  refreshTokenCookie,
  refreshTokenCookieOptions,
  registerUser,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  revokeSession,
} from './auth.service.js'
import { assertCodeforcesHandleExists } from '../codeforces/codeforces.validator.js'

function requestContext(request) {
  return {
    userAgent: request.headers['user-agent'] || '',
    ip: request.ip || request.socket?.remoteAddress || '',
  }
}

function setSession(response, accessToken, refreshToken) {
  response.cookie(accessTokenCookie, accessToken, authCookieOptions())
  response.cookie(refreshTokenCookie, refreshToken, refreshTokenCookieOptions())
}

function clearSessionCookies(response) {
  const { access, refresh } = clearAuthCookieOptions()
  response.clearCookie(accessTokenCookie, access)
  response.clearCookie(refreshTokenCookie, refresh)
}

export async function register(request, response) {
  const context = requestContext(request)
  if (request.body?.codeforcesHandle) {
    request.body.codeforcesHandle = await assertCodeforcesHandleExists(request.body.codeforcesHandle)
  }

  const { user, accessToken, refreshToken } = await registerUser(request.body, context)
  setSession(response, accessToken, refreshToken)
  response.status(201).json(successResponse({ user: user.toPublicJSON() }))
}

export async function login(request, response) {
  const { user, accessToken, refreshToken } = await loginUser(request.body, requestContext(request))
  setSession(response, accessToken, refreshToken)
  response.json(successResponse({ user: user.toPublicJSON() }))
}

export async function refresh(request, response) {
  const rawToken = request.cookies?.[refreshTokenCookie]
  const { user, accessToken, refreshToken } = await refreshSession(
    rawToken,
    requestContext(request),
  )
  setSession(response, accessToken, refreshToken)
  response.json(successResponse({ user: user.toPublicJSON() }))
}

export async function logout(request, response) {
  const rawToken = request.cookies?.[refreshTokenCookie]
  await revokeSession(rawToken)
  clearSessionCookies(response)
  response.json(successResponse({ loggedOut: true }))
}

export function me(request, response) {
  response.json(successResponse({ user: request.user.toPublicJSON() }))
}

export function googleStatus(_request, response) {
  response.json(successResponse({ configured: isGoogleOAuthConfigured() }))
}

export function googleStart(_request, response) {
  const { state, url } = createGoogleAuthorization()
  response.cookie(oauthStateCookie, state, oauthStateCookieOptions())
  response.redirect(url)
}

export async function googleCallback(request, response) {
  const { maxAge: _maxAge, ...clearOptions } = oauthStateCookieOptions()
  response.clearCookie(oauthStateCookie, clearOptions)

  if (request.query.error) {
    response.redirect(`${env.CLIENT_ORIGIN}/login?oauth=denied`)
    return
  }

  try {
    const { user, accessToken, refreshToken } = await completeGoogleAuthorization(
      {
        code: request.query.code,
        state: request.query.state,
        expectedState: request.cookies?.[oauthStateCookie],
      },
      requestContext(request),
    )
    setSession(response, accessToken, refreshToken)
    response.redirect(`${env.CLIENT_ORIGIN}/dashboard?oauth=success`)
  } catch {
    response.redirect(`${env.CLIENT_ORIGIN}/login?oauth=failed`)
  }
}

export async function forgotPassword(request, response) {
  const result = await requestPasswordReset(request.body)
  response.status(202).json(
    successResponse({
      ...result,
      message: 'If an account exists for that email, a reset link has been prepared.',
    }),
  )
}

export async function resetPassword(request, response) {
  const { user, accessToken, refreshToken } = await resetPasswordService(
    request.body,
    requestContext(request),
  )
  setSession(response, accessToken, refreshToken)
  response.json(successResponse({ user: user.toPublicJSON() }))
}
