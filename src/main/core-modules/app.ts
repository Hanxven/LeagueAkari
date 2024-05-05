import { autoGameflowState } from '@main/modules/auto-gameflow/state'
import { autoReplyState } from '@main/modules/auto-reply/state'
import { autoSelectState } from '@main/modules/auto-select/state'
import { coreFunctionalityState } from '@main/modules/core-functionality/state'
import { respawnTimerState } from '@main/modules/respawn-timer/state'
import { getSetting, setSetting } from '@main/storage/settings'
import { LEAGUE_AKARI_GITHUB_CHECK_UPDATES_URL } from '@shared/constants'
import { GithubApiLatestRelease } from '@shared/types/github'
import { MainWindowCloseStrategy } from '@shared/types/modules/app'
import { formatError } from '@shared/utils/errors'
import axios from 'axios'
import { app, dialog, shell } from 'electron'
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

  /**
   * 关闭应用的默认行为
   */
  closeStrategy: MainWindowCloseStrategy = 'unset'

  setAutoConnect(enabled: boolean) {
    this.autoConnect = enabled
  }

  setAutoCheckUpdates(enabled: boolean) {
    this.autoCheckUpdates = enabled
  }

  setShowFreeSoftwareDeclaration(enabled: boolean) {
    this.showFreeSoftwareDeclaration = enabled
  }

  setCloseStrategy(s: MainWindowCloseStrategy) {
    this.closeStrategy = s
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

  ready: boolean = false

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

  setElevated(b: boolean) {
    this.isAdministrator = b
  }

  setReady(b: boolean) {
    this.ready = b
  }
}

export const appState = new AppState()

// 基础通讯 API
export async function initApp() {
  appState.setElevated(toolkit.isElevated())

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
      logger.warn(`检查更新失败 ${formatError(error)}`)
    }
  }

  logger.info('初始化完成')
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

      logger.info(
        `检查到更新版本, 当前 ${currentVersion}, Github ${versionString}, 归档包 ${JSON.stringify(archiveFile)}`
      )
    } else {
      runInAction(() => {
        appState.updates.newUpdates = null
      })
      mwNotification.success('app', '检查更新', `目前是最新版本 (${currentVersion})`)
      logger.info(`目前是最新版本, 当前 ${currentVersion}, Github ${versionString}`)
    }
  } catch (error) {
    mwNotification.warn('app', '检查更新', `当前检查更新失败 ${(error as Error).message}`)
    logger.warn(`尝试检查更新失败 ${formatError(error)}`)
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
  ipcStateSync('app/settings/close-strategy', () => appState.settings.closeStrategy)
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

  onRendererCall('app/settings/close-strategy/set', async (_, s) => {
    appState.settings.setCloseStrategy(s)
    await setSetting('app/close-strategy', s)
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

  onRendererCall(
    'app/migrate-settings-from-previous-local-storage',
    async (_, all: Record<string, string>) => {
      return await migrateFromPreviousLocalStorageSettings(all)
    }
  )

  onRendererCall('app/user-data/open', () => {
    return shell.openPath(app.getPath('userData'))
  })
}

async function loadSettings() {
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

  appState.settings.setCloseStrategy(
    await getSetting('app/close-strategy', appState.settings.closeStrategy)
  )
}

/**
 * 从前一个版本中尝试迁移所有的设置项到当前版本
 * @param all 所有设置项
 */
async function migrateFromPreviousLocalStorageSettings(all: Record<string, string>) {
  let migrated = false
  const toNewSettings = async (originKey: string, resName: string, setter: (state: any) => any) => {
    const originValue = all[originKey]
    if (originValue !== undefined) {
      try {
        const jsonValue = JSON.parse(originValue)
        await setSetting(resName, jsonValue)
        runInAction(() => setter(jsonValue))
        migrated = true
      } catch {}
    }
  }

  await toNewSettings(
    'app.autoConnect',
    'app/auto-connect',
    (s) => (appState.settings.autoConnect = s)
  )
  await toNewSettings(
    'app.autoCheckUpdates',
    'app/auto-check-updates',
    (s) => (appState.settings.autoCheckUpdates = s)
  )
  await toNewSettings(
    'app.showFreeSoftwareDeclaration',
    'app/show-free-software-declaration',
    (s) => (appState.settings.showFreeSoftwareDeclaration = s)
  )
  await toNewSettings(
    'autoAccept.enabled',
    'auto-gameflow/auto-accept-enabled',
    (s) => (autoGameflowState.settings.autoAcceptEnabled = s)
  )
  await toNewSettings(
    'autoAccept.delaySeconds',
    'auto-gameflow/auto-accept-delay-seconds',
    (s) => (autoGameflowState.settings.autoAcceptDelaySeconds = s)
  )
  await toNewSettings(
    'autoHonor.enabled',
    'auto-gameflow/auto-honor-enabled',
    (s) => (autoGameflowState.settings.autoHonorEnabled = s)
  )
  await toNewSettings(
    'autoHonor.strategy',
    'auto-gameflow/auto-honor-strategy',
    (s) => (autoGameflowState.settings.autoHonorStrategy = s)
  )
  await toNewSettings(
    'autoReply.enabled',
    'auto-reply/enabled',
    (s) => (autoReplyState.settings.enabled = s)
  )
  await toNewSettings(
    'autoReply.enableOnAway',
    'auto-reply/enable-on-away',
    (s) => (autoReplyState.settings.enableOnAway = s)
  )
  await toNewSettings(
    'autoReply.text',
    'auto-reply/text',
    (s) => (autoReplyState.settings.text = s)
  )
  await toNewSettings(
    'autoSelect.normalModeEnabled',
    'auto-select/normal-mode-enabled',
    (s) => (autoSelectState.settings.normalModeEnabled = s)
  )
  await toNewSettings(
    'autoSelect.benchModeEnabled',
    'auto-select/bench-mode-enabled',
    (s) => (autoSelectState.settings.benchModeEnabled = s)
  )
  await toNewSettings(
    'autoSelect.benchExpectedChampions',
    'auto-select/bench-expected-champions',
    (s) => (autoSelectState.settings.benchExpectedChampions = s)
  )
  await toNewSettings(
    'autoSelect.expectedChampions',
    'auto-select/expected-champions',
    (s) => (autoSelectState.settings.expectedChampions = s)
  )
  await toNewSettings(
    'autoSelect.bannedChampions',
    'auto-select/banned-champions',
    (s) => (autoSelectState.settings.bannedChampions = s)
  )
  await toNewSettings(
    'autoSelect.banEnabled',
    'auto-select/ban-enabled',
    (s) => (autoSelectState.settings.banEnabled = s)
  )
  await toNewSettings(
    'autoSelect.completed',
    'auto-select/completed',
    (s) => (autoSelectState.settings.completed = s)
  )
  await toNewSettings(
    'autoSelect.onlySimulMode',
    'auto-select/only-simul-mode',
    (s) => (autoSelectState.settings.onlySimulMode = s)
  )
  await toNewSettings(
    'autoSelect.grabDelay',
    'auto-select/grab-delay-seconds',
    (s) => (autoSelectState.settings.grabDelaySeconds = s)
  )
  await toNewSettings(
    'autoSelect.banTeammateIntendedChampion',
    'auto-select/ban-teammate-intended-champion',
    (s) => (autoSelectState.settings.banTeammateIntendedChampion = s)
  )
  await toNewSettings(
    'autoSelect.selectTeammateIntendedChampion',
    'auto-select/select-teammate-intended-champion',
    (s) => (autoSelectState.settings.selectTeammateIntendedChampion = s)
  )
  await toNewSettings(
    'autoSelect.showIntent',
    'auto-select/show-intent',
    (s) => (autoSelectState.settings.showIntent = s)
  )
  await toNewSettings(
    'matchHistory.fetchAfterGame',
    'core-functionality/fetch-after-game',
    (s) => (coreFunctionalityState.settings.fetchAfterGame = s)
  )
  await toNewSettings(
    'matchHistory.autoRouteOnGameStart',
    'core-functionality/auto-route-on-game-start',
    (s) => (coreFunctionalityState.settings.autoRouteOnGameStart = s)
  )
  await toNewSettings(
    'matchHistory.preMadeTeamThreshold',
    'core-functionality/pre-made-team-threshold',
    (s) => (coreFunctionalityState.settings.preMadeTeamThreshold = s)
  )
  await toNewSettings(
    'matchHistory.teamAnalysisPreloadCount',
    'core-functionality/team-analysis-preload-count',
    (s) => (coreFunctionalityState.settings.teamAnalysisPreloadCount = s)
  )
  await toNewSettings(
    'matchHistory.matchHistoryLoadCount',
    'core-functionality/match-history-load-count',
    (s) => (coreFunctionalityState.settings.matchHistoryLoadCount = s)
  )
  await toNewSettings(
    'matchHistory.fetchDetailedGame',
    'core-functionality/fetch-detailed-game',
    (s) => (coreFunctionalityState.settings.fetchDetailedGame = s)
  )
  await toNewSettings(
    'matchHistory.sendKdaInGame',
    'core-functionality/send-kda-in-game',
    (s) => (coreFunctionalityState.settings.sendKdaInGame = s)
  )
  await toNewSettings(
    'matchHistory.sendKdaThreshold',
    'core-functionality/send-kda-threshold',
    (s) => (coreFunctionalityState.settings.sendKdaThreshold = s)
  )
  await toNewSettings(
    'matchHistory.sendKdaInGameWithPreMadeTeams',
    'core-functionality/send-kda-in-game-with-pre-made-teams',
    (s) => (coreFunctionalityState.settings.setSendKdaInGameWithPreMadeTeams = s)
  )
  await toNewSettings(
    'respawnTimer.enabled',
    'respawn-timer/enabled',
    (s) => (respawnTimerState.settings.enabled = s)
  )

  if (migrated) {
    logger.info('旧设置项已经成功迁移')
    return true
  }

  return false
}
