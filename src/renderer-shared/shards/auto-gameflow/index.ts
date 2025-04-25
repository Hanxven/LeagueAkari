import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoGameflowStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-gameflow-main'

@Shard(AutoGameflowRenderer.id)
export class AutoGameflowRenderer implements IAkariShardInitDispose {
  static id = 'auto-gameflow-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer
  ) {}

  cancelAutoAccept() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelAutoAccept')
  }

  cancelAutoMatchmaking() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'cancelAutoMatchmaking')
  }

  setWillDodgeAtLastSecond(enabled: number) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setWillDodgeAtLastSecond', enabled)
  }

  setAutoHonorEnabled(enabled: boolean) {
    this._setting.set(MAIN_SHARD_NAMESPACE, 'autoHonorEnabled', enabled)
  }

  setAutoHonorStrategy(strategy: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoHonorStrategy', strategy)
  }

  setPlayAgainEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'playAgainEnabled', enabled)
  }

  setAutoAcceptEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoAcceptEnabled', enabled)
  }

  setAutoAcceptDelaySeconds(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoAcceptDelaySeconds', seconds)
  }

  setAutoReconnectEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoReconnectEnabled', enabled)
  }

  setAutoSkipLeaderEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoSkipLeaderEnabled', enabled)
  }

  setAutoMatchmakingEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingEnabled', enabled)
  }

  setAutoMatchmakingMaximumMatchDuration(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingMaximumMatchDuration', seconds)
  }

  setAutoMatchmakingDelaySeconds(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingDelaySeconds', seconds)
  }

  setAutoMatchmakingMinimumMembers(count: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingMinimumMembers', count)
  }

  setAutoMatchmakingWaitForInvitees(yes: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingWaitForInvitees', yes)
  }

  setAutoMatchmakingRematchStrategy(s: string) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingRematchStrategy', s)
  }

  setAutoMatchmakingRematchFixedDuration(seconds: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoMatchmakingRematchFixedDuration', seconds)
  }

  setAutoHandleInvitationsEnabled(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'autoHandleInvitationsEnabled', enabled)
  }

  setRejectInvitationWhenAway(enabled: boolean) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'rejectInvitationWhenAway', enabled)
  }

  setDodgeAtLastSecondThreshold(threshold: number) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'dodgeAtLastSecondThreshold', threshold)
  }

  setInvitationHandlingStrategies(strategies: Record<string, string>) {
    return this._setting.set(MAIN_SHARD_NAMESPACE, 'invitationHandlingStrategies', strategies)
  }

  async onInit() {
    const store = useAutoGameflowStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
  }
}
