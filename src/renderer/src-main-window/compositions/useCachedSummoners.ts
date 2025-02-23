import { useInteroperableSgpServers } from '@renderer-shared/compositions/useInteroperableSgpServers'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import QuickLRU from 'quick-lru'
import { shallowReactive, shallowReadonly } from 'vue'

const summoners: Record<string, SummonerInfo> = shallowReactive({})
const lruMap = new QuickLRU<string, SummonerInfo>({
  maxSize: 200,
  onEviction: (key, _value) => {
    delete summoners[key]
  }
})

/**
 * 在一些看不到的地方缓存一点东西
 * @returns
 */
export function useCachedSummoners() {
  const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
  const rc = useInstance<RiotClientRenderer>('riot-client-renderer')
  const sgp = useInstance<SgpRenderer>('sgp-renderer')
  const sgps = useSgpStore()

  const { getInteroperability } = useInteroperableSgpServers()

  const update = async (puuid: string, sgpServerId: string) => {
    if (summoners[puuid] || !getInteroperability(sgpServerId).common) {
      return
    }

    const cached = lruMap.get(puuid)

    if (cached) {
      summoners[puuid] = cached
      return
    }

    if (sgps.availability.sgpServerId === sgpServerId) {
      lc.api.summoner.getSummonerByPuuid(puuid).then((summoner) => {
        summoners[puuid] = summoner.data
        lruMap.set(puuid, summoner.data)
      })
    } else {
      sgp.getSummonerLcuFormat(puuid, sgpServerId).then((summoner) => {
        if (summoner) {
          rc.api.playerAccount.getPlayerAccountNameset([puuid]).then((nameset) => {
            summoner.gameName = nameset.data.namesets[0]?.gnt.gameName || summoner.displayName
            summoner.tagLine = nameset.data.namesets[0]?.gnt.tagLine || '?????'
            summoners[puuid] = summoner
            lruMap.set(puuid, summoner)
          })
        }
      })
    }
  }

  return {
    summoners: shallowReadonly(summoners),

    update
  }
}
