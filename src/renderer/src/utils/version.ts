function isValidVersion(version: string): boolean {
  return /^\d+(\.\d+)*$/.test(version)
}

function extractVersion(str: string): string {
  const regex = /[vV](.+)/
  const match = regex.exec(str)

  return match ? match[1] : str
}

export function compareVersions(version1: string, version2: string): 1 | -1 | 0 {
  const cleanVersion1 = extractVersion(version1)
  const cleanVersion2 = extractVersion(version2)

  if (!isValidVersion(cleanVersion1) || !isValidVersion(cleanVersion2)) {
    throw new Error('Invalid version format')
  }

  const splitV1 = cleanVersion1.split('.').map(Number)
  const splitV2 = cleanVersion2.split('.').map(Number)

  for (let i = 0; i < Math.max(splitV1.length, splitV2.length); i++) {
    const num1 = i < splitV1.length ? splitV1[i] : 0
    const num2 = i < splitV2.length ? splitV2[i] : 0

    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}
