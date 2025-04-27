import { createManager } from '@renderer-shared/shards'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import {
  LeagueClientRenderer,
  LeagueClientRendererConfig
} from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

const manager = createManager()

manager.use(AkariIpcRenderer)
manager.use(LeagueClientRenderer, {
  // for better performance
  subscribeState: {
    gameData: true,
    gameflow: true,
    summoner: true,
    matchmaking: false,
    lobby: false,
    login: false,
    champSelect: false,
    chat: false,
    honor: false
  }
} as LeagueClientRendererConfig)
manager.use(LoggerRenderer)
manager.use(PiniaMobxUtilsRenderer)
manager.use(SettingUtilsRenderer)
manager.use(SetupInAppScopeRenderer)
manager.use(WindowManagerRenderer)

export { manager }
