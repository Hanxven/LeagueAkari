export function summonerName(name: string | undefined, tagLine?: string, defaultName = '-') {
  if (tagLine) {
    if (name) {
      return `${name}#${tagLine}`
    }
    return tagLine
  }
  return name || defaultName
}
