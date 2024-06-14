import { lcuConnectionState, lcuEventBus } from '@main/modules/akari-core/lcu-connection'
import { mwNotification } from '@main/modules/akari-core/main-window'
import { getLoginQueueState } from '@main/http-api/login'
import { ipcStateSync } from '@main/utils/ipc'
import { LoginQueueState } from '@shared/types/lcu/login'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { reaction, when } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

class LoginState {
  loginQueueState: LoginQueueState | null = null

  constructor() {
    makeAutoObservable(this, { loginQueueState: observable.struct })
  }

  setLoginQueueState(state: LoginQueueState | null) {
    this.loginQueueState = state
  }
}

export const login = new LoginState()

export function loginSync() {
  ipcStateSync('lcu/login/login-queue-state', () => login.loginQueueState)

  lcuEventBus.on('/lol-login/v1/login-queue-state', (event) => {
    login.setLoginQueueState(event.data)
  })

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          const q = (await getLoginQueueState()).data
          login.setLoginQueueState(q)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            login.setLoginQueueState(null)
            return
          }

          mwNotification.warn('lcu-state-sync', '状态同步', '获取登录队列信息失败')
          logger.warn(`获取登录队列信息失败 ${formatError(error)}`)
        }
      } else {
        login.setLoginQueueState(null)
      }
    }
  )

  reaction(
    () => !!login.loginQueueState,
    (isQueueing) => {
      if (isQueueing) {
        logger.info(`正在登录排队中`)
      }
    }
  )
}
