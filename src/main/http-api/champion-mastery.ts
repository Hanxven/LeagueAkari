import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { PlayerChampionMastery } from '@shared/types/lcu/champion-mastery'

export function getPlayerChampionMasteryTopN(puuid: string, count = 3) {
  return lcm.lcuRequest<PlayerChampionMastery>({
    method: 'POST',
    url: `/lol-champion-mastery/v1/${puuid}/champion-mastery/top`,
    params: { count },
    data: { skipCache: true }
  })
}
