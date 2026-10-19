import { successResponse } from '../../utils/ApiResponse.js'
import { getProgressForUser } from './progress.service.js'

export async function progress(request, response) {
  response.json(successResponse(await getProgressForUser(request.user.id, request.params.handle)))
}
