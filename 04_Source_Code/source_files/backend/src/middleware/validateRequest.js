export function validateRequest(schemas) {
  return (request, _response, next) => {
    for (const source of ['body', 'params', 'query']) {
      if (schemas[source]) {
        request[source] = schemas[source].parse(request[source])
      }
    }
    next()
  }
}
