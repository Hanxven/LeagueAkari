import { lcuConnectionState, lcuEventBus } from '@main/core/lcu-connection'
import { mwNotification } from '@main/core/main-window'
import { getLobby } from '@main/http-api/lobby'
import { ipcStateSync } from '@main/utils/ipc'
import { Lobby as LobbyType } from '@shared/types/lcu/lobby'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

class LobbyState {
  lobby: LobbyType | null = null

  constructor() {
    makeAutoObservable(this, { lobby: observable.struct })
  }

  setLobby(lobby: LobbyType | null) {
    this.lobby = lobby
  }
}

export const lobby = new LobbyState()

export function lobbySync() {
  lcuEventBus.on('/lol-lobby/v2/lobby', (event) => {
    lobby.setLobby(event.data)
  })

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          const lb = (await getLobby()).data
          lobby.setLobby(lb)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            lobby.setLobby(null)
            return
          }

          mwNotification.warn('lcu-state-sync', '状态同步', '获取房间信息失败')
          logger.warn(`获取房间信息失败 ${formatError(error)}`)
        }
      }
    }
  )

  ipcStateSync('lcu/lobby/lobby', () => lobby.lobby)
}
