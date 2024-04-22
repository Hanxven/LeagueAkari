import { lcuConnectionState, lcuEventBus } from '@main/core/lcu-connection'
import { mwNotification } from '@main/core/main-window'
import { getCurrentSummoner } from '@main/http-api/summoner'
import { ipcStateSync } from '@main/utils/ipc'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { formatError } from '@shared/utils/errors'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

const MAX_RETRIES = 10

class SummonerState {
  /**
   * 当前已登录的召唤师。为便于引用，使用 `me` 作为属性名
   */
  me: SummonerInfo | null = null

  /**
   * 该大区是否启用了新 ID 系统，e.g. `雪之下雪乃#10000`
   */
  newIdSystemEnabled: boolean = false

  constructor() {
    makeAutoObservable(this, { me: observable.struct })
  }

  setMe(value: SummonerInfo | null) {
    this.me = value
  }

  setNewIdSystemEnabled(enabled: boolean) {
    this.newIdSystemEnabled = enabled
  }
}

export const summoner = new SummonerState()

export function summonerSync() {
  let error: Error
  let retryCount = 0
  let timerId: NodeJS.Timeout | null = null

  /**
   * 个人信息获取十分关键，因此必须优先获取，以实现后续功能
   */
  const retryFetching = async () => {
    if (retryCount < MAX_RETRIES) {
      try {
        const data = (await getCurrentSummoner()).data
        summoner.setMe(data)
        retryCount = 0
        summoner.setNewIdSystemEnabled(Boolean(data.tagLine))
      } catch (error) {
        error = error as Error
        retryCount++
        timerId = setTimeout(retryFetching, 1000)
      }
    } else {
      if (timerId) {
        clearTimeout(timerId)
        timerId = null
      }

      mwNotification.warn('lcu-state-sync', '状态同步', '获取召唤师信息失败')
      logger.warn(`获取召唤师信息失败 ${formatError(error)}`)
    }
  }

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state === 'connected') {
        retryFetching()
      } else if (state === 'disconnected') {
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }
        summoner.setMe(null)
        retryCount = 0
      }
    },
    { fireImmediately: true }
  )

  lcuEventBus.on('/lol-summoner/v1/current-summoner', (event) => {
    summoner.setMe(event.data)
  })

  ipcStateSync('lcu/summoner/me', () => summoner.me)
}
