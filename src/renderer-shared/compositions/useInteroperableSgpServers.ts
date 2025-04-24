import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { isTencentServer } from '@shared/data-sources/sgp/utils'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

/**
 * 封装的互操作性检测方法, 建立在腾讯服务器 SGP 存在某些特定的互操作性的基础上
 */
export function useInteroperableSgpServers(sgpServerId?: MaybeRefOrGetter<string>) {
  const sgps = useSgpStore()

  const getInteroperability = (sgpServerId: string) => {
    if (isTencentServer(sgps.availability.sgpServerId)) {
      return {
        common: sgps.sgpServerConfig.tencentServerSummonerInteroperability.includes(sgpServerId),
        matchHistory:
          sgps.sgpServerConfig.tencentServerMatchHistoryInteroperability.includes(sgpServerId)
      }
    } else {
      const isSameSgpServer = sgps.availability.sgpServerId === sgpServerId

      return {
        common: isSameSgpServer,
        matchHistory: isSameSgpServer
      }
    }
  }

  const interoperability = computed(() => {
    const value = toValue(sgpServerId)

    if (!value) {
      return {
        common: false,
        matchHistory: false
      }
    }

    return getInteroperability(value)
  })

  return {
    interoperability,
    getInteroperability
  }
}
