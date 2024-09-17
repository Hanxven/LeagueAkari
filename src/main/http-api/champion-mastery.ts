import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { Mastery, PlayerChampionMastery } from '@shared/types/lcu/champion-mastery'

// 在 sgp 层面，返回结果是全量的，即使指定了 count 参数
// 但是 ux 会根据 count 参数进行截取
// POST /championmastery-ledge/puuid/{puuid}/champions
export function getPlayerChampionMasteryTopN(puuid: string, count = 3) {
  return lcm.lcuRequest<PlayerChampionMastery>({
    method: 'POST',
    url: `/lol-champion-mastery/v1/${puuid}/champion-mastery/top`,
    params: { count },
    data: { skipCache: true }
  })
}

export function getPlayerChampionMastery(puuid: string) {
  return lcm.lcuRequest<Mastery[]>({
    method: 'GET',
    url: `/lol-champion-mastery/v1/${puuid}/champion-mastery`
  })
}
