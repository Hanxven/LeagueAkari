import { getSetting, setSetting } from '@main/storage/settings'
import { LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL } from '@shared/constants'
import { GithubApiLatestRelease } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios from 'axios'
import { app, dialog } from 'electron'
import { makeAutoObservable, observable, runInAction } from 'mobx'
import { lt } from 'semver'

import toolkit from '../native/laToolkitWin32x64.node'
import { ipcStateSync, onRendererCall } from '../utils/ipc'
import { createLogger } from './log'
import { mwNotification } from './main-window'

const logger = createLogger('app')

class AppSettings {
  /**
   * 在客户端启动时且只有唯一的客户端，尝试自动连接
   */
  autoConnect: boolean = true

  /**
   * 从 Github 拉取更新信息
   */
  autoCheckUpdates: boolean = true

  /**
   * 输出前置声明
   */
  showFreeSoftwareDeclaration: boolean = true

  setAutoConnect(enabled: boolean) {
    this.autoConnect = enabled
  }

  setAutoCheckUpdates(enabled: boolean) {
    this.autoCheckUpdates = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

interface NewUpdates {
  currentVersion: string
  version: string
  pageUrl: string
  downloadUrl: string
  description: string
}

class AppState {
  isAdministrator: boolean = false

  updates = observable(
    {
      isCheckingUpdates: false,
      lastCheckAt: null as Date | null,
      newUpdates: null as NewUpdates | null
    },
    {
      newUpdates: observable.ref
    }
  )

  settings = new AppSettings()

  constructor() {
    makeAutoObservable(this)
  }

  setIsAdmin(b: boolean) {
    this.isAdministrator = b
  }
}

export const appState = new AppState()

// 基础通讯 API
export async function initApp() {
  appState.setIsAdmin(toolkit.isElevated())

  stateSync()
  ipcCall()
  await loadSettings()

  if (!appState.isAdministrator) {
    logger.error('Insufficient permissions, League Akari can only run upon Administrator')
    dialog.showErrorBox('缺乏必要权限', '本工具依赖管理员权限，以获取必要的命令行信息。')
    throw new Error('insufficient permissions')
  }

  if (appState.settings.autoCheckUpdates) {
    try {
      await checkUpdates()
    } catch (error) {
      logger.warn(`Failed to check updates ${formatError(error)}`)
    }
  }

  logger.info('Initialized')
}

export async function checkUpdates() {
  if (appState.updates.isCheckingUpdates) {
    return
  }

  runInAction(() => {
    appState.updates.isCheckingUpdates = true
    appState.updates.lastCheckAt = new Date()
  })

  try {
    const { data } = await axios.get<GithubApiLatestRelease>(LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL)
    const currentVersion = app.getVersion()
    const versionString = data.tag_name

    // new version found
    if (lt(currentVersion, versionString)) {
      const archiveFile = data.assets.find((a) => {
        return a.content_type === 'application/x-compressed'
      })

      runInAction(() => {
        appState.updates.newUpdates = {
          currentVersion,
          description: data.body,
          downloadUrl: archiveFile ? archiveFile.browser_download_url : '',
          version: versionString,
          pageUrl: data.html_url
        }
      })
    } else {
      runInAction(() => {
        appState.updates.newUpdates = null
      })
      mwNotification.success('app', '检查更新', `目前是最新版本 (${currentVersion})`)
    }
  } catch (error) {
    mwNotification.warn('app', '检查更新', `当前检查更新失败 ${(error as Error).message}`)
  } finally {
    runInAction(() => {
      appState.updates.isCheckingUpdates = false
    })
  }
}

function stateSync() {
  ipcStateSync('app/is-administrator', () => appState.isAdministrator)
  ipcStateSync('app/settings/auto-connect', () => appState.settings.autoConnect)
  ipcStateSync('app/settings/auto-check-updates', () => appState.settings.autoCheckUpdates)
  ipcStateSync('app/updates/is-checking-updates', () => appState.updates.isCheckingUpdates)
  ipcStateSync('app/updates/new-updates', () => appState.updates.newUpdates)
  ipcStateSync('app/updates/last-check-at', () => appState.updates.lastCheckAt)
  ipcStateSync(
    'app/settings/show-free-software-declaration',
    () => appState.settings.showFreeSoftwareDeclaration
  )
}

function ipcCall() {
  onRendererCall('app/version/get', () => app.getVersion())

  onRendererCall('app/settings/auto-connect/set', async (_, enabled) => {
    appState.settings.setAutoConnect(enabled)
    await setSetting('app/auto-connect', enabled)
  })

  onRendererCall('app/settings/auto-check-updates/set', async (_, enabled) => {
    appState.settings.setAutoCheckUpdates(enabled)
    await setSetting('app/auto-check-updates', enabled)
  })

  onRendererCall('app/settings/show-free-software-declaration/set', async (_, enabled) => {
    appState.settings.setShowFreeSoftwareDeclaration(enabled)
    await setSetting('app/show-free-software-declaration', enabled)
  })

  // 处理前版本设置项迁移问题
  onRendererCall('app/settings/migrate-from-local-storage', (_, settings) => {
    if (Object.keys(settings).length === 0) {
      return
    }
  })

  onRendererCall('app/updates/check', async (_) => {
    await checkUpdates()
  })
}

async function loadSettings() {
  appState.settings.setAutoConnect(
    await getSetting('app/auto-connect', appState.settings.autoConnect)
  )

  appState.settings.setAutoConnect(
    await getSetting('app/auto-connect', appState.settings.autoConnect)
  )

  appState.settings.setAutoCheckUpdates(
    await getSetting('app/auto-check-updates', appState.settings.autoCheckUpdates)
  )

  appState.settings.setShowFreeSoftwareDeclaration(
    await getSetting(
      'app/show-free-software-declaration',
      appState.settings.showFreeSoftwareDeclaration
    )
  )
}
