import { SummonerInfo } from '@shared/types/league-client/summoner'

export function summonerName(name: string | undefined, tagLine?: string, defaultName = '-') {
  if (tagLine) {
    if (name) {
      return `${name}#${tagLine}`
    }
    return tagLine
  }
  return name || defaultName
}

export function riotId(summoner?: SummonerInfo | null) {
  if (summoner) {
    if (summoner.gameName && summoner.tagLine) {
      return `${summoner.gameName}#${summoner.tagLine}`
    }

    return summoner.displayName || summoner.internalName || '-'
  }

  return '-'
}
