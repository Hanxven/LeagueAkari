import { LeagueAkariRendererModuleManager } from '@renderer-shared/akari-ipc/renderer-module-manager'
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

    this.getterSync('settings/auto-honor-enabled', (s) => (store.settings.autoHonorEnabled = s))
    this.getterSync('settings/auto-honor-strategy', (s) => (store.settings.autoHonorStrategy = s))
    this.getterSync('settings/play-again-enabled', (s) => (store.settings.playAgainEnabled = s))
    this.getterSync('settings/auto-accept-enabled', (s) => (store.settings.autoAcceptEnabled = s))
    this.getterSync(
      'settings/auto-accept-delay-seconds',
      (s) => (store.settings.autoAcceptDelaySeconds = s)
    )
    this.getterSync(
      'settings/auto-search-match-enabled',
      (s) => (store.settings.autoSearchMatchEnabled = s)
    )
    this.getterSync(
      'settings/auto-search-match-delay-seconds',
      (s) => (store.settings.autoSearchMatchDelaySeconds = s)
    )
    this.getterSync(
      'settings/auto-search-match-minimum-members',
      (s) => (store.settings.autoSearchMatchMinimumMembers = s)
    )
    this.getterSync(
      'settings/auto-search-match-wait-for-invitees',
      (s) => (store.settings.autoSearchMatchWaitForInvitees = s)
    )
    this.getterSync(
      'settings/auto-search-match-rematch-strategy',
      (s) => (store.settings.autoSearchMatchRematchStrategy = s)
    )
    this.getterSync(
      'settings/auto-search-match-rematch-fixed-duration',
      (s) => (store.settings.autoSearchMatchRematchFixedDuration = s)
    )

    this.dotPropSync(store, this.id, 'willAccept')
    this.dotPropSync(store, this.id, 'willAcceptAt')
    this.dotPropSync(store, this.id, 'willSearchMatch')
    this.dotPropSync(store, this.id, 'willSearchMatchAt')
    this.dotPropSync(store, this.id, 'activityStartStatus')
    this.dotPropSync(store, this.id, 'willDodgeAt')
    this.dotPropSync(store, this.id, 'willDodgeAtLastSecond')
  }

  async setAutoHonorEnabled(value: boolean) {
    return this.call('set-setting/auto-honor-enabled', value)
  }

  async setAutoHonorStrategy(value: string) {
    return this.call('set-setting/auto-honor-strategy', value)
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

  async setDodgeAtLastSecond(value: boolean) {
    return this.call('set-dodge-at-last-second', value)
  }
}

export const autoGameflowRendererModule = new AutoGameflowRendererModule()
