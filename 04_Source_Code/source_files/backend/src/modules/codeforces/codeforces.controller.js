import { successResponse } from '../../utils/ApiResponse.js'
import {
  getCodeforcesProfile,
  getCodeforcesRatingHistory,
  getCodeforcesSnapshot,
  getCodeforcesSubmissions,
} from './codeforces.service.js'

export async function getUser(request, response) {
  response.json(successResponse(await getCodeforcesProfile(request.params.handle)))
}

export async function getSubmissions(request, response) {
  response.json(successResponse(await getCodeforcesSubmissions(request.params.handle)))
}

export async function getRating(request, response) {
  response.json(successResponse(await getCodeforcesRatingHistory(request.params.handle)))
}

export async function getSnapshot(request, response) {
  const snapshot = await getCodeforcesSnapshot(request.params.handle)
  response.json(
    successResponse(snapshot, { source: 'codeforces', generatedAt: snapshot.fetchedAt }),
  )
}
