import { successResponse } from '../../utils/ApiResponse.js'
import { updateCodeforcesHandle, updateUserPreferences, updateUserProfile } from './user.service.js'
import { assertCodeforcesHandleExists } from '../codeforces/codeforces.validator.js'

export function getProfile(request, response) {
  response.json(successResponse({ user: request.user.toPublicJSON() }))
}

export async function patchProfile(request, response) {
  const user = await updateUserProfile(request.user, request.body)
  response.json(successResponse({ user: user.toPublicJSON() }))
}

export async function patchHandle(request, response) {
  const handle = await assertCodeforcesHandleExists(request.body.codeforcesHandle)
  const user = await updateCodeforcesHandle(request.user, handle)
  response.json(successResponse({ user: user.toPublicJSON() }))
}

export async function patchPreferences(request, response) {
  const user = await updateUserPreferences(request.user, request.body)
  response.json(successResponse({ user: user.toPublicJSON() }))
}
