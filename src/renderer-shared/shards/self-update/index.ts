import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatBytes, formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { watch } from 'vue'

import { useBackgroundTasksStore } from '../background-tasks/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import { useSelfUpdateStore } from './store'

const MAIN_SHARD_NAMESPACE = 'self-update-main'

@Shard(SelfUpdateRenderer.id)
export class SelfUpdateRenderer implements IAkariShardInitDispose {
  static id = 'self-update-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer
  ) {
    // @ts-ignore
    window.selfUpdateShard = this
  }

  private _handleUpdateProgressShow() {
    const store = useSelfUpdateStore()
    const taskStore = useBackgroundTasksStore()
    const { t } = useTranslation()
    const taskId = `${SelfUpdateRenderer.id}/update`

    watch(
      () => store.updateProgressInfo,
      (info) => {
        if (!info) {
          taskStore.removeTask(taskId)
          return
        }

        if (!taskStore.hasTask(taskId)) {
          taskStore.createTask(taskId, {
            name: () => t('self-update-renderer.self-update-task.name'),
            description: '',
            createAt: Date.now(),
            progress: 0,
            actions: [
              {
                label: () => t('self-update-renderer.self-update-task.cancelButton'),
                callback: () => {
                  this.cancelUpdate()
                },
                buttonProps: { type: 'warning' }
              }
            ]
          })
        }

        switch (info.phase) {
          case 'downloading':
            taskStore.updateTask(taskId, {
              progress: info.downloadingProgress,
              description: () =>
                t('self-update-renderer.self-update-task.downloading', {
                  progress: (info.downloadingProgress * 100).toFixed(2),
                  eta: formatSeconds(info.downloadTimeLeft),
                  avgSpeed: formatBytes(info.averageDownloadSpeed)
                })
            })
            break
          case 'download-failed':
            taskStore.updateTask(taskId, {
              progress: null,
              status: 'error',
              description: () => t('self-update-renderer.self-update-task.download-failed')
            })
            break
          case 'unpacking':
            taskStore.updateTask(taskId, {
              progress: info.unpackingProgress,
              description: () =>
                t('self-update-renderer.self-update-task.unpacking', {
                  progress: (info.unpackingProgress * 100).toFixed(2)
                })
            })
            break
          case 'unpack-failed':
            taskStore.updateTask(taskId, {
              progress: null,
              status: 'error',
              description: () => t('self-update-renderer.self-update-task.unpack-failed')
            })
            break

          case 'waiting-for-restart':
            taskStore.updateTask(taskId, {
              progress: 1,
              status: 'success',
              description: () => t('self-update-renderer.self-update-task.waiting-for-restart')
            })
        }
      },
      { immediate: true }
    )
  }

  checkUpdates() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'checkUpdates')
  }

  checkUpdatesDebug() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'checkUpdatesDebug')
  }

  startUpdate() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'startUpdate')
  }

  cancelUpdate() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelUpdate')
  }

  setAnnouncementRead(md5: string) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setAnnouncementRead', md5)
  }

  openNewUpdatesDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openNewUpdatesDir')
  }

  setAutoCheckUpdates(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoCheckUpdates', enabled)
  }

  setAutoDownloadUpdates(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoDownloadUpdates', enabled)
  }

  setDownloadSource(source: 'gitee' | 'github') {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'downloadSource', source)
  }

  onStartUpdate(cb: () => void) {
    this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'start-update', cb)
  }

  async onInit() {
    const store = useSelfUpdateStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._setup.addSetupFn(() => this._handleUpdateProgressShow())
  }
}
