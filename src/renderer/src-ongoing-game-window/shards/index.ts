import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

const manager = createManager()

manager.use(AkariIpcRenderer)
manager.use(AppCommonRenderer)
manager.use(LeagueClientRenderer)
manager.use(LoggerRenderer)
manager.use(OngoingGameRenderer)
manager.use(PiniaMobxUtilsRenderer)
manager.use(SettingUtilsRenderer)
manager.use(SetupInAppScopeRenderer) // 并非使用, 仅满足 LeagueClientRenderer 的依赖需求
manager.use(SgpRenderer)
manager.use(WindowManagerRenderer)

export { manager }
