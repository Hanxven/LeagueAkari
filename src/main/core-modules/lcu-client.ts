import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { makeAutoObservable, observable } from 'mobx'

import toolkit from '../native/laToolkitWin32x64.node'
import { queryLcuAuth } from '../utils/shell'
import { appState } from './app'
import { getHttpInstance } from './lcu-connection'
import { createLogger } from './log'

const logger = createLogger('lcu-client')

const LEAGUE_CLIENT_UX_PROCESS_NAME = 'LeagueClientUx.exe'

class LeagueClientUxSettings {
  /**
   * 基于 Win32 API 的窗口调整方法
   */
  fixWindowMethodAOptions: {
    baseWidth: number
    baseHeight: number
  } = {
    baseWidth: 1600,
    baseHeight: 900
  }

  setFixWindowMethodsAOptions(option: { baseWidth: number; baseHeight: number }) {
    this.fixWindowMethodAOptions = option
  }

  constructor() {
    makeAutoObservable(this, {
      fixWindowMethodAOptions: observable.ref
    })
  }
}

export const leagueClientUxSettings = new LeagueClientUxSettings()

export async function initLeagueClientFunctions() {
  await loadSettings()

  onRendererCall('league-client-ux/fix-window-method-a', async (_) => {
    if (!appState.isAdministrator) {
      throw new Error('insufficient permissions')
    }

    const instance = getHttpInstance()
    if (!instance) {
      throw new Error('LCU not connected')
    }

    try {
      const scale = await instance.request({
        url: '/riotclient/zoom-scale',
        method: 'GET'
      })

      toolkit.fixWindowMethodA(scale.data, leagueClientUxSettings.fixWindowMethodAOptions)
    } catch (error) {
      throw error
    }
  })

  ipcStateSync(
    'league-client-ux/settings/fix-window-method-a-options',
    () => leagueClientUxSettings.fixWindowMethodAOptions
  )

  onRendererCall('league-client-ux/settings/fix-window-method-a-options/set', async (_, option) => {
    leagueClientUxSettings.setFixWindowMethodsAOptions(option)
    await setSetting('league-client-ux/fix-window-method-a-options', option)
  })

  // 检查英雄联盟渲染端是否存在，可能存在多个
  onRendererCall('league-client-ux/lcu-auth/query', async () => {
    return queryLcuAuth(LEAGUE_CLIENT_UX_PROCESS_NAME)
  })

  logger.info('初始化完成')
}

async function loadSettings() {
  leagueClientUxSettings.setFixWindowMethodsAOptions(
    await getSetting(
      'league-client-ux/fix-window-method-a-options',
      leagueClientUxSettings.fixWindowMethodAOptions
    )
  )
}
