import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'
import { Player } from '@shared/data-sources/tgp/types'

import { useTgpApiStore } from './store'

export class TgpApiRendererModule extends StateSyncModule {
  constructor() {
    super('tgp-api')
  }

  async setup() {
    await super.setup()

    this._syncMainState()
  }

  private _syncMainState() {
    const store = useTgpApiStore()

    this.stateSync('state', store)
  }

  setEnabled(value: boolean) {
    return this.call('set-setting', 'enabled', value)
  }

  async getBattleDetail(area: string, gameId: number) {
    return this.call('get-battle-detail', area, gameId)
  }

  async getBattleList(player: Player, page: number, pageSize: number) {
    return await this.call('get-battle-list', player, page, pageSize)
  }

  async searchPlayer(nickname: string, pageSize: number = 1) {
    return this.call('search-player', nickname, pageSize)
  }

  async getQrCode() {
    return this.call('get-qr-code')
  }

  async checkQrCodeStatus(qrsig: string) {
    const [status, qq, pskey] = await this.call('check-qr-code-status', qrsig)
    if (status === '登录成功') {
      const [tgpId, tgpTicket] = await this.call('login-by-qq', qq, pskey)
      await this.call('set-setting', 'expired', false)
      await this.call('set-setting', 'qq', qq)
      await this.call('set-setting', 'tgpId', tgpId)
      await this.call('set-setting', 'tgpTicket', tgpTicket)
    }
    return status
  }

  async logout() {
    await this.call('set-setting', 'expired', true)
    await this.call('set-setting', 'qq', '')
    await this.call('set-setting', 'tgpId', '')
    await this.call('set-setting', 'tgpTicket', '')
  }
}

export const tgpApiRendererModule = new TgpApiRendererModule()
