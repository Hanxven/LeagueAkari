import axios from 'axios'
import { markRaw } from 'vue'

import { notify } from '@renderer/events/notifications'
import { call, onUpdate } from '@renderer/ipc'
import { getSetting, setSetting } from '@renderer/utils/storage'
import { compareVersions } from '@renderer/utils/version'

import { useAppState } from './stores/app'
import { useSettingsStore } from './stores/settings'

export const id = 'core:app'

export function setupApp() {
  const appState = useAppState()
  const settings = useSettingsStore()

  loadSettingsFromStorage()

  call('getWindowState').then((windowState) => {
    appState.windowState = windowState
  })

  call('isAdmin').then((isAdmin) => {
    appState.isAdmin = isAdmin
  })

  call('getVersion').then((version) => {
    appState.version = version

    if (settings.app.autoCheckUpdates) {
      checkUpdates(true)
    }
  })

  onUpdate('isAdmin', (_e, isAdmin) => {
    appState.isAdmin = isAdmin
  })

  onUpdate('windowState', (_e, windowState0) => {
    appState.windowState = windowState0
  })

  onUpdate('focusState', (_e, focusState) => {
    appState.focusState = focusState
  })
}

interface Author {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}

interface GithubApiLatestRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  author: Author
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: {
    url: string
    id: number
    node_id: string
    name: string
    label?: any
    uploader: Author
    content_type: string
    state: string
    size: number
    download_count: number
    created_at: string
    updated_at: string
    browser_download_url: string
  }[]
  tarball_url: string
  zipball_url: string
  body: string
}

const CHECK_UPDATE_URL = 'https://api.github.com/repos/Hanxven/League-Toolkit/releases/latest'

export async function checkUpdates(background = false) {
  const appState = useAppState()

  if (appState.updates.isCheckingUpdates) {
    return
  }

  appState.updates.isCheckingUpdates = true
  appState.updates.lastCheckAt = new Date()
  try {
    const { data } = await axios.get<GithubApiLatestRelease>(CHECK_UPDATE_URL)

    const versionString = data.tag_name
    if (compareVersions(appState.version, versionString) < 0) {
      const archiveFile = data.assets.find((a) => {
        return a.content_type === 'application/x-compressed'
      })

      appState.updates.newUpdates = markRaw({
        currentVersion: appState.version,
        description: data.body,
        downloadUrl: archiveFile ? archiveFile.browser_download_url : '',
        version: versionString,
        pageUrl: data.html_url
      })
    } else {
      notify.emit({
        id,
        type: 'success',
        content: `已经是最新版本 ${versionString}`,
        title: '检查更新',
        silent: background
      })
    }
  } catch {
    notify.emit({
      type: 'warning',
      content: '检查更新失败',
      title: '检查更新',
      silent: background
    })
  } finally {
    appState.updates.isCheckingUpdates = false
  }
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.app.autoConnect = getSetting('app.autoConnect', true)
  settings.app.autoCheckUpdates = getSetting('app.autoCheckUpdates', true)

  const options = getSetting('app.fixWindowMethodAOptions')
  if (options) {
    settings.app.fixWindowMethodAOptions = options
  }
}

export function setFixWindowMethodAOptions(baseWidth: number, baseHeight: number) {
  const settings = useSettingsStore()

  setSetting('app.fixWindowMethodAOptions', { baseHeight, baseWidth })
  settings.app.fixWindowMethodAOptions = {
    baseWidth,
    baseHeight
  }
}

export function setAutoConnect(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('app.autoConnect', enabled)
  settings.app.autoConnect = enabled
}

export function setAutoCheckUpdates(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('app.autoCheckUpdates', enabled)
  settings.app.autoCheckUpdates = enabled
}
