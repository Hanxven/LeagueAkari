import { lcuEventBus } from '@main/modules/akari-core/lcu-connection'
import { lcuConnectionState } from '@main/modules/akari-core/lcu-connection'
import { mwNotification } from '@main/modules/akari-core/main-window'
import {
  getBannableChampIds,
  getChampSelectSession,
  getChampSelectSummoner,
  getCurrentChamp,
  getPickableChampIds
} from '@main/http-api/champ-select'
import { ipcStateSync } from '@main/utils/ipc'
import { ChampSelectSession, ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'
import { summoner } from './summoner'

class ChampSelectState {
  session: ChampSelectSession | null = null

  currentChampion: number | null = 0

  currentPickableChampionArray: number[] = []

  currentBannableChampionArray: number[] = []

  selfSummoner: ChampSelectSummoner | null = null

  constructor() {
    makeAutoObservable(this, {
      session: observable.struct,
      currentPickableChampionArray: observable.struct,
      currentBannableChampionArray: observable.struct,
      selfSummoner: observable.struct
    })
  }

  get currentPickableChampions() {
    const set = new Set<number>()
    this.currentPickableChampionArray.forEach((c) => set.add(c))
    return set
  }

  get currentBannableChampions() {
    const set = new Set<number>()
    this.currentBannableChampionArray.forEach((c) => set.add(c))
    return set
  }

  setSession(s: ChampSelectSession | null) {
    this.session = s
  }

  setCurrentPickableChampionArray(array: number[]) {
    this.currentPickableChampionArray = array
  }

  setCurrentBannableChampionArray(array: number[]) {
    this.currentBannableChampionArray = array
  }

  setSelfSummoner(s: ChampSelectSummoner | null) {
    this.selfSummoner = s
  }

  setCurrentChampion(c: number | null) {
    this.currentChampion = c
  }
}

export const champSelect = new ChampSelectState()

export function champSelectSync() {
  ipcStateSync('lcu/champ-select/session', () => champSelect.session)

  ipcStateSync(
    'lcu/champ-select/pickable-champion-ids',
    () => champSelect.currentPickableChampionArray
  )

  ipcStateSync(
    'lcu/champ-select/bannable-champion-ids',
    () => champSelect.currentBannableChampionArray
  )

  ipcStateSync('lcu/champ-select/current-champion', () => champSelect.currentChampion)

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          champSelect.setSession((await getChampSelectSession()).data)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            champSelect.setSession(null)
            champSelect.setSelfSummoner(null)
            return
          }

          mwNotification.warn('lcu-state-sync', '状态同步', '获取 champ-select 会话失败')
          logger.warn(`获取 champ-select 会话失败 ${formatError(error)}`)
        }
      } else {
        champSelect.setSession(null)
      }
    }
  )

  // 处理中场进入的情况，主动获取可用英雄列表
  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          const a = (async () => {
            try {
              const pickables = (await getPickableChampIds()).data
              champSelect.setCurrentPickableChampionArray(pickables)
            } catch (error) {
              if (isAxiosError(error) && error.response?.status === 404) {
                champSelect.setCurrentPickableChampionArray([])
                return
              }

              throw error
            }
          })()

          const b = (async () => {
            try {
              const bannables = (await getBannableChampIds()).data
              champSelect.setCurrentBannableChampionArray(bannables)
            } catch (error) {
              if (isAxiosError(error) && error.response?.status === 404) {
                champSelect.setCurrentBannableChampionArray([])
                return
              }

              throw error
            }
          })()

          await Promise.all([a, b])
        } catch (error) {
          mwNotification.warn('lcu-state-sync', '状态同步', '获取可选英雄/可禁用英雄失败')
          logger.warn(`获取可选英雄/可禁用英雄失败 ${formatError(error)}`)
        }
      } else {
        champSelect.setCurrentPickableChampionArray([])
        champSelect.setCurrentBannableChampionArray([])
      }
    }
  )

  let isCellSummonerUpdated = false
  reaction(
    () => [champSelect.session?.myTeam, summoner.me?.puuid] as const,
    async ([myTeam, puuid]) => {
      if (!isCellSummonerUpdated && myTeam && puuid) {
        const self = myTeam.find((t) => t.puuid === puuid)
        if (self) {
          try {
            const s = await getChampSelectSummoner(self.cellId)

            // 如果没有被更新，用于区分首次加载的情况
            if (!isCellSummonerUpdated) {
              champSelect.setSelfSummoner(s.data)
              isCellSummonerUpdated = true
            }
          } catch (error) {
            mwNotification.warn('lcu-state-sync', '状态同步', '获取当前英雄选择召唤师状态失败')
            logger.warn(`获取当前英雄选择召唤师状态失败 ${formatError(error)}`)
          }
        }
      }
    }
  )

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state !== 'connected') {
        champSelect.setSelfSummoner(null)
        isCellSummonerUpdated = false
      }
    }
  )

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          const c = (await getCurrentChamp()).data
          champSelect.setCurrentChampion(c)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            champSelect.setCurrentChampion(null)
            return
          }

          throw error
        }
      } else {
        champSelect.setCurrentChampion(null)
      }
    }
  )

  lcuEventBus.on('/lol-champ-select/v1/session', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setSession(null)
      champSelect.setSelfSummoner(null)
    } else {
      champSelect.setSession(event.data)
    }
  })

  lcuEventBus.on<LcuEvent<number[]>>('/lol-champ-select/v1/pickable-champion-ids', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setCurrentPickableChampionArray([])
    } else {
      champSelect.setCurrentPickableChampionArray(event.data)
    }
  })

  lcuEventBus.on<LcuEvent<number[]>>('/lol-champ-select/v1/bannable-champion-ids', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setCurrentBannableChampionArray([])
    } else {
      champSelect.setCurrentBannableChampionArray(event.data)
    }
  })

  lcuEventBus.on<LcuEvent<ChampSelectSummoner>>('/lol-champ-select/v1/summoners/*', (event) => {
    if (event.data && event.data.isSelf) {
      isCellSummonerUpdated = true
      champSelect.setSelfSummoner(event.data)
    }
  })

  lcuEventBus.on<LcuEvent<number>>('/lol-champ-select/v1/current-champion', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setCurrentChampion(null)
    }

    champSelect.setCurrentChampion(event.data)
  })
}
