export function summonerName(name: string | undefined, tagLine?: string, defaultName = '无名') {
  if (tagLine) {
    if (name) {
      return `${name}#${tagLine}`
    }
    return tagLine
  }
  return name || defaultName
}
