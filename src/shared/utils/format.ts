export function formatSeconds(seconds: number, precision: number = 1): string {
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
