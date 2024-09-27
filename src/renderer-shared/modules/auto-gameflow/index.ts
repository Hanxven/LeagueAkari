import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useAutoGameflowStore } from './store'

export class AutoGameflowRendererModule extends StateSyncModule {
  constructor() {
    super('auto-gameflow')
  }

  override async setup() {
    await super.setup()
    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAutoGameflowStore()
    this.stateSync('state', store)
  }

  async setAutoHonorEnabled(value: boolean) {
    return this.call('set-setting', 'autoHonorEnabled', value)
  }

  async setAutoHonorStrategy(value: string) {
    return this.call('set-setting', 'autoHonorStrategy', value)
  }

  async setPlayAgainEnabled(value: boolean) {
    return this.call('set-setting', 'playAgainEnabled', value)
  }

  async setAutoAcceptEnabled(value: boolean) {
    return this.call('set-setting', 'autoAcceptEnabled', value)
  }

  async setAutoAcceptDelaySeconds(value: number) {
    return this.call('set-setting', 'autoAcceptDelaySeconds', value)
  }

  async setAutoReconnectEnabled(value: boolean) {
    return this.call('set-setting', 'autoReconnectEnabled', value)
  }

  async setAutoMatchmakingEnabled(value: boolean) {
    return this.call('set-setting', 'autoMatchmakingEnabled', value)
  }

  async setAutoMatchmakingDelaySeconds(value: number) {
    return this.call('set-setting', 'autoMatchmakingDelaySeconds', value)
  }

  async setAutoMatchmakingMinimumMembers(value: number) {
    return this.call('set-setting', 'autoMatchmakingMinimumMembers', value)
  }

  async setAutoMatchmakingWaitForInvitees(value: boolean) {
    return this.call('set-setting', 'autoMatchmakingWaitForInvitees', value)
  }

  async setAutoMatchmakingRematchStrategy(value: string) {
    return this.call('set-setting', 'autoMatchmakingRematchStrategy', value)
  }

  async setAutoMatchmakingRematchFixedDuration(value: number) {
    return this.call('set-setting', 'autoMatchmakingRematchFixedDuration', value)
  }

  async cancelAutoAccept() {
    return this.call('cancel-auto-accept')
  }

  async cancelAutoSearchMatch() {
    return this.call('cancel-auto-search-match')
  }

  async setDodgeAtLastSecond(value: boolean) {
    return this.call('set-dodge-at-last-second', value)
  }

  async setDodgeAtLastSecondThreshold(value: number) {
    return this.call('set-setting', 'dodgeAtLastSecondThreshold', value)
  }
}

export const autoGameflowRendererModule = new AutoGameflowRendererModule()
