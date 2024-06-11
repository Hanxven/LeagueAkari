import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari/renderer-module-manager'
import { StateSyncModule } from '@shared/renderer/akari/state-sync-module'

import { useAutoGameflowStore } from './store'

export class AutoGameflowRendererModule extends StateSyncModule {
  constructor() {
    super('auto-gameflow')
  }

  override async onRegister(manager: LeagueAkariRendererModuleManager) {
    await super.onRegister(manager)
    this._syncMainState()
  }

  private _syncMainState() {
    const store = useAutoGameflowStore()

    this.simpleSync('settings/auto-honor-enabled', (s) => (store.settings.autoHonorEnabled = s))
    this.simpleSync('settings/auto-honor-strategy', (s) => (store.settings.autoHonorStrategy = s))
    this.simpleSync('settings/play-again-enabled', (s) => (store.settings.playAgainEnabled = s))
    this.simpleSync('settings/auto-accept-enabled', (s) => (store.settings.autoAcceptEnabled = s))
    this.simpleSync(
      'settings/auto-accept-delay-seconds',
      (s) => (store.settings.autoAcceptDelaySeconds = s)
    )
    this.simpleSync(
      'settings/auto-search-match-enabled',
      (s) => (store.settings.autoSearchMatchEnabled = s)
    )
    this.simpleSync(
      'settings/auto-search-match-delay-seconds',
      (s) => (store.settings.autoSearchMatchDelaySeconds = s)
    )
    this.simpleSync(
      'settings/auto-search-match-minimum-members',
      (s) => (store.settings.autoSearchMatchMinimumMembers = s)
    )
    this.simpleSync(
      'settings/auto-search-match-wait-for-invitees',
      (s) => (store.settings.autoSearchMatchWaitForInvitees = s)
    )
    this.simpleSync(
      'settings/auto-search-match-rematch-strategy',
      (s) => (store.settings.autoSearchMatchRematchStrategy = s)
    )
    this.simpleSync(
      'settings/auto-search-match-rematch-fixed-duration',
      (s) => (store.settings.autoSearchMatchRematchFixedDuration = s)
    )

    this.simpleSync('will-accept', (s) => (store.willAccept = s))
    this.simpleSync('will-accept-at', (s) => (store.willAcceptAt = s))
    this.simpleSync('will-search-match', (s) => (store.willSearchMatch = s))
    this.simpleSync('will-search-match-at', (s) => (store.willSearchMatchAt = s))
    this.simpleSync('activity-start-status', (s) => (store.activityStartStatus = s))
  }

  async setAutoHonorEnabled(value: boolean) {
    return this.call('set-setting/auto-honor-enabled', value)
  }

  async setAutoHonorStrategy(value: string) {
    return this.call('set-settings/auto-honor-strategy', value)
  }

  async setPlayAgainEnabled(value: boolean) {
    return this.call('set-setting/play-again-enabled', value)
  }

  async setAutoAcceptEnabled(value: boolean) {
    return this.call('set-setting/auto-accept-enabled', value)
  }

  async setAutoAcceptDelaySeconds(value: number) {
    return this.call('set-setting/auto-accept-delay-seconds', value)
  }

  async setAutoSearchMatchEnabled(value: boolean) {
    return this.call('set-setting/auto-search-match-enabled', value)
  }

  async setAutoSearchMatchDelaySeconds(value: number) {
    return this.call('set-setting/auto-search-match-delay-seconds', value)
  }

  async setAutoSearchMatchMinimumMembers(value: number) {
    return this.call('set-setting/auto-search-match-minimum-members', value)
  }

  async setAutoSearchMatchWaitForInvitees(value: boolean) {
    return this.call('set-setting/auto-search-match-wait-for-invitees', value)
  }

  async setAutoSearchMatchRematchStrategy(value: string) {
    return this.call('set-setting/auto-search-match-rematch-strategy', value)
  }

  async setAutoSearchMatchRematchFixedDuration(value: number) {
    return this.call('set-setting/auto-search-match-rematch-fixed-duration', value)
  }

  async cancelAutoAccept() {
    return this.call('cancel-auto-accept')
  }

  async cancelAutoSearchMatch() {
    return this.call('cancel-auto-search-match')
  }
}

export const autoGameflowRendererModule = new AutoGameflowRendererModule()
