import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAutoGameflowStore } from './store'

const MAIN_SHARD_NAMESPACE = 'auto-gameflow-main'

export class AutoGameflowRenderer implements IAkariShardInitDispose {
  static id = 'auto-gameflow-renderer'
  static dependencies = [
    'akari-ipc-renderer',
    'setting-utils-renderer',
    'pinia-mobx-utils-renderer'
  ]

  private readonly _ipc: AkariIpcRenderer
  private readonly _pm: PiniaMobxUtilsRenderer
  private readonly _setting: SettingUtilsRenderer

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-renderer']
    this._pm = deps['pinia-mobx-utils-renderer']
    this._setting = deps['setting-utils-renderer']
  }

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
