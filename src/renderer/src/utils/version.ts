function isValidVersion(version: string): boolean {
  return /^\d+(\.\d+)*$/.test(version)
}

export function compareVersions(version1: string, version2: string): 1 | -1 | 0 {
  if (!isValidVersion(version1) || !isValidVersion(version2)) {
    throw new Error('Invalid version format')
  }

  const splitV1 = version1.split('.').map(Number)
  const splitV2 = version2.split('.').map(Number)

  for (let i = 0; i < Math.max(splitV1.length, splitV2.length); i++) {
    const num1 = i < splitV1.length ? splitV1[i] : 0
    const num2 = i < splitV2.length ? splitV2[i] : 0

    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}
