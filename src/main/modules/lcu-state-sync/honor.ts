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
import { getBallot } from '@main/http-api/honor-v2'
import { ipcStateSync } from '@main/utils/ipc'
import { ChampSelectSession, ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { LcuEvent } from '@shared/types/lcu/event'
import { BallotLegacy } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

class HonorState {
  ballot: BallotLegacy | null

  setBallot(b: BallotLegacy | null) {
    this.ballot = b
  }

  constructor() {
    makeAutoObservable(this, {
      ballot: observable.struct
    })
  }
}

export const honorState = new HonorState()

export function honorSync() {
  ipcStateSync('lcu/honor/ballot', () => honorState.ballot)

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          honorState.setBallot((await getBallot()).data)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            honorState.setBallot(null)
            return
          }

          mwNotification.warn('lcu-state-sync', '状态同步', '获取 honor ballot 失败')
          logger.warn(`获取 honor ballot 失败 ${formatError(error)}`)
        }
      } else {
        honorState.setBallot(null)
      }
    }
  )

  lcuEventBus.on<LcuEvent<BallotLegacy>>('/lol-honor-v2/v1/ballot', async (event) => {
    if (event.eventType === 'Delete') {
      honorState.setBallot(null)
      return
    }

    honorState.setBallot(event.data)
  })
}
