import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { OverlayRenderer } from '@renderer-shared/shards/overlay'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'

const manager = createManager()

manager.use(
  AkariIpcRenderer,
  AppCommonRenderer,
  LoggerRenderer,
  PiniaMobxUtilsRenderer,
  SettingUtilsRenderer,
  OverlayRenderer
)

export { manager }
