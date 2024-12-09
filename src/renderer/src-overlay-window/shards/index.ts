import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { ExtraAssetsRenderer } from '@renderer-shared/shards/extra-assets'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

const manager = createManager()

manager.use(
  AkariIpcRenderer,
  AppCommonRenderer,
  LoggerRenderer,
  PiniaMobxUtilsRenderer,
  SettingUtilsRenderer,
  WindowManagerRenderer
)

export { manager }
