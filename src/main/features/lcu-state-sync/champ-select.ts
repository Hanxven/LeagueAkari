import { lcuEventEmitter } from '@main/core/lcu-connection'
import { lcuConnectionState } from '@main/core/lcu-connection'
import { mwNotification } from '@main/core/main-window'
import {
  getBannableChampIds,
  getChampSelectSession,
  getPickableChampIds
} from '@main/http-api/champ-select'
import { ipcStateSync } from '@main/utils/ipc'
import { ChampSelectSession } from '@shared/types/lcu/champ-select'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'
import { AxiosError } from 'axios'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'
import { gameflow } from './gameflow'

class ChampSelectState {
  session: ChampSelectSession | null = null

  currentPickableChampionArray: number[] = []

  currentBannableChampionArray: number[] = []

  constructor() {
    makeAutoObservable(this, {
      session: observable.struct,
      currentPickableChampionArray: observable.struct,
      currentBannableChampionArray: observable.struct
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
}

export const champSelect = new ChampSelectState()

export function champSelectSync() {
  reaction(
    () => gameflow.phase,
    async (phase) => {
      if (phase === 'ChampSelect') {
        try {
          champSelect.setSession((await getChampSelectSession()).data)
        } catch (error) {
          if (
            error! instanceof AxiosError ||
            (error! instanceof AxiosError && error.status !== 404)
          ) {
            mwNotification.warn('lcu-state-sync', '状态同步', '获取 champ-select 会话失败')
            logger.warn(`获取 champ-select 会话失败 ${formatError(error)}`)
          }
        }
      } else {
        champSelect.setSession(null)
      }
    }
  )

  // 处理中场进入的情况，主动获取可用英雄列表
  reaction(
    () => [lcuConnectionState.state, gameflow.phase] as const,
    async ([state, phase]) => {
      if (state === 'connected' && phase === 'ChampSelect') {
        try {
          const a = (async () => {
            if (champSelect.currentPickableChampionArray.length) {
              champSelect.setCurrentPickableChampionArray([])
            }
            const pickables = (await getPickableChampIds()).data
            champSelect.setCurrentPickableChampionArray(pickables)
          })()

          const b = (async () => {
            if (champSelect.currentBannableChampionArray.length) {
              champSelect.setCurrentBannableChampionArray([])
            }
            const bannables = (await getBannableChampIds()).data
            champSelect.setCurrentBannableChampionArray(bannables)
          })()

          await Promise.all([a, b])
        } catch (error) {
          if (
            error! instanceof AxiosError ||
            (error! instanceof AxiosError && error.status !== 404)
          ) {
            mwNotification.warn('lcu-state-sync', '状态同步', '获取可选英雄/可禁用英雄失败')
            logger.warn(`获取可选英雄/可禁用英雄失败 ${formatError(error)}`)
          }
        }
      }
    }
  )

  lcuEventEmitter.on('/lol-champ-select/v1/session', (event) => {
    // create, update, delete, 3 in 1
    champSelect.setSession(event.data)
  })

  lcuEventEmitter.on<LcuEvent<number[]>>('/lol-champ-select/v1/pickable-champion-ids', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setCurrentPickableChampionArray([])
    } else {
      if (champSelect.currentPickableChampionArray.length) {
        champSelect.setCurrentPickableChampionArray([])
      }
      champSelect.setCurrentPickableChampionArray(event.data)
    }
  })

  lcuEventEmitter.on<LcuEvent<number[]>>('/lol-champ-select/v1/bannable-champion-ids', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.setCurrentBannableChampionArray([])
    } else {
      if (champSelect.currentBannableChampionArray.length) {
        champSelect.setCurrentBannableChampionArray([])
      }
      champSelect.setCurrentBannableChampionArray(event.data)
    }
  })

  ipcStateSync('lcu/champ-select/session', () => champSelect.session)

  ipcStateSync(
    'lcu/champ-select/pickable-champion-ids',
    () => champSelect.currentPickableChampionArray
  )

  ipcStateSync(
    'lcu/champ-select/bannable-champion-ids',
    () => champSelect.currentBannableChampionArray
  )
}
