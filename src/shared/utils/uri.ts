export function addLeadingSlash(uri?: string) {
  if (!uri) return '/'

  return uri.startsWith('/') ? uri : `/${uri}`
}

export function removeTrailingSlash(uri?: string) {
  if (!uri) return '/'

  return uri.endsWith('/') ? uri.slice(0, -1) : uri
}
