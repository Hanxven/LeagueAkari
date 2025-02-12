import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { ExtraAssetsRenderer } from '@renderer-shared/shards/extra-assets'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

import { OpggRenderer } from './opgg'

const manager = createManager()

manager.use(AkariIpcRenderer)
manager.use(AppCommonRenderer)
manager.use(ExtraAssetsRenderer)
manager.use(LeagueClientRenderer)
manager.use(LoggerRenderer)
manager.use(OpggRenderer)
manager.use(PiniaMobxUtilsRenderer)
manager.use(SettingUtilsRenderer)
manager.use(WindowManagerRenderer)

export { manager }
