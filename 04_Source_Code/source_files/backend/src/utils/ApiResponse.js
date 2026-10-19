export function successResponse(data, meta) {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  }
}
