const encoder = new TextEncoder()

/**
 * 可以判断是否是作者的账号
 * @param platform 平台，如 HN1 是艾欧尼亚，BGP2 是峡谷之巅
 * @param summonerId 召唤师 ID
 * @returns
 */
export async function isAuthorAccount(platform: string, summonerId: number): Promise<boolean> {
  const text = `${platform}_${summonerId}`
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex === 'b2ef9fda83b7d19cd80dfb75eaa441b13a49c6a506bc80fdc2a033d5dbd13b07'
}
