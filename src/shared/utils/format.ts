export function formatSeconds(seconds: number, precision: number = 0): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}day ${hours.toFixed(precision)}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes.toFixed(precision)}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs.toFixed(precision)}s`
  } else {
    return `${secs.toFixed(precision)}s`
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
