import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { AutoReplyRenderer } from '@renderer-shared/shards/auto-reply'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
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
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'

import { MatchHistoryTabsRenderer } from './match-history-tabs'
import { KeyboardShortcutsRenderer } from '@renderer-shared/shards/keyboard-shortcut'

const manager = createManager()

manager.use(
  AkariIpcRenderer,
  AppCommonRenderer,
  AutoGameflowRenderer,
  AutoSelectRenderer,
  AutoReplyRenderer,
  GameClientRenderer,
  KeyboardShortcutsRenderer,
  LeagueClientRenderer,
  LeagueClientUxRenderer,
  LoggerRenderer,
  MatchHistoryTabsRenderer,
  OngoingGameRenderer,
  PiniaMobxUtilsRenderer,
  RendererDebugRenderer,
  RespawnTimerRenderer,
  RiotClientRenderer,
  SavedPlayerRenderer,
  SelfUpdateRenderer,
  SettingUtilsRenderer,
  SgpRenderer,
  WindowManagerRenderer
)

export { manager }
