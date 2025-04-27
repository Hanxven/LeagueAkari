import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { AutoChampConfigRenderer } from '@renderer-shared/shards/auto-champ-config'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { AutoReplyRenderer } from '@renderer-shared/shards/auto-reply'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { ExtraAssetsRenderer } from '@renderer-shared/shards/extra-assets'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { RendererDebugRenderer } from '@renderer-shared/shards/renderer-debug'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

import { MainWindowUiRenderer } from './main-window-ui'
import { MatchHistoryTabsRenderer } from './match-history-tabs'
import { SimpleNotificationsRenderer } from './simple-notifications'

const manager = createManager()

manager.use(AkariIpcRenderer)
manager.use(AppCommonRenderer)
manager.use(AutoChampConfigRenderer)
manager.use(AutoGameflowRenderer)
manager.use(AutoSelectRenderer)
manager.use(AutoReplyRenderer)
manager.use(ClientInstallationRenderer)
manager.use(ExtraAssetsRenderer)
manager.use(GameClientRenderer)
manager.use(InGameSendRenderer)
manager.use(KeyboardShortcutsRenderer)
manager.use(LeagueClientRenderer)
manager.use(LeagueClientUxRenderer)
manager.use(LoggerRenderer)
manager.use(MainWindowUiRenderer)
manager.use(MatchHistoryTabsRenderer)
manager.use(OngoingGameRenderer)
manager.use(PiniaMobxUtilsRenderer)
manager.use(RendererDebugRenderer)
manager.use(RespawnTimerRenderer)
manager.use(RiotClientRenderer)
manager.use(SavedPlayerRenderer)
manager.use(SelfUpdateRenderer)
manager.use(SettingUtilsRenderer)
manager.use(SetupInAppScopeRenderer)
manager.use(SgpRenderer)
manager.use(SimpleNotificationsRenderer)
manager.use(WindowManagerRenderer)

export { manager }
