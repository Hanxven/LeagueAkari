export function getSgpServerId(region: string, rsoPlatformId?: string) {
  if (region === 'TENCENT') {
    return `TENCENT_${rsoPlatformId}`
  }

  return region
}

export function isTencentServer(sgpServerId: string) {
  return sgpServerId.startsWith('TENCENT')
}
