export function addLeadingSlash(uri?: string) {
  if (!uri) return '/'

  return uri.startsWith('/') ? uri : `/${uri}`
}
