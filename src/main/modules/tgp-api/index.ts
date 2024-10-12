import { MobxBasedBasicModule, RegisteredSettingHandler } from '@main/akari-ipc/mobx-based-basic-module';
import { TgpApi, TgpLoginManager } from '@shared/data-sources/tgp';
import { Battle, Player } from '@shared/data-sources/tgp/types'
import { Paths } from '@shared/utils/types';
import { set } from 'lodash';
import { runInAction } from 'mobx';



import { AppLogger, LogModule } from '../log';
import { TgpApiState } from './state';


export class TgpApiModule extends MobxBasedBasicModule {
  public state = new TgpApiState()

  private _logger: AppLogger
  private _tlm = new TgpLoginManager()
  private _ta = new TgpApi(this)

  constructor() {
    super('tgp-api')
  }

  override async setup() {
    await super.setup()

    this._logger = this.manager.getModule<LogModule>('log').createLogger('tgp-api')

    await this._setupSettings()
    this._setupStateSync()
    this._setupMethodCall()
    this._maintainTgpId()
    this._maintainTgpTicket()
    await this._checkExpiration()
    this._logger.info('初始化完成')
  }

  private async _setupSettings() {
    this.registerSettings([
      {
        key: 'enabled',
        defaultValue: this.state.settings.enabled
      },
      {
        key: 'qq',
        defaultValue: this.state.settings.qq
      },
      {
        key: 'expired',
        defaultValue: this.state.settings.expired
      },
      {
        key: 'tgpId',
        defaultValue: this.state.settings.tgpId
      },
      {
        key: 'tgpTicket',
        defaultValue: this.state.settings.tgpTicket
      }
    ])

    const settings = await this.readSettings()
    runInAction(() => {
      settings.forEach((s) => set(this.state.settings, s.settingItem, s.value))
    })

    const defaultSetter: RegisteredSettingHandler = async (key, value, apply) => {
      runInAction(() => set(this.state.settings, key, value))
      await apply(key, value)
    }

    this.onSettingChange<Paths<typeof this.state.settings>>('enabled', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('qq', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('expired', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('tgpId', defaultSetter)
    this.onSettingChange<Paths<typeof this.state.settings>>('tgpTicket', defaultSetter)
  }

  private _setupStateSync() {
    this.propSync('state', this.state, [
      'settings.enabled',
      'settings.qq',
      'settings.expired',
      'settings.tgpId',
      'settings.tgpTicket'
    ])
  }

  async searchPlayer(nickname: string, pageSize: number) {
    const tgpPlayers = (await this._ta.searchPlayer(nickname, pageSize)).data
    return tgpPlayers.players
  }

  async getBattleList(player: Player, page: number, pageSize: number) {
    const maxPageSize = 10
    let allBattles: Battle[] = []
    let remainingBattles = pageSize
    let currentOffset = (page - 1) * pageSize

    while (remainingBattles > 0) {
      const currentSize = Math.min(remainingBattles, maxPageSize)
      const tgpBattles = (await this._ta.getBattleList(player, currentOffset, currentSize)).data

      allBattles = allBattles.concat(tgpBattles.battles)

      remainingBattles -= currentSize
      currentOffset += currentSize
    }

    return allBattles
  }

  private _setupMethodCall() {
    this.onCall('get-battle-detail', async (area: string, gameId: number) => {
      return (await this._ta.getBattleDetail(area, gameId)).data
    })

    this.onCall('search-player', async (nickname: string, pageSize: number) => {
      return this.searchPlayer(nickname, pageSize)
    })

    this.onCall('get-battle-list', async (player: Player, page: number, pageSize: number) => {
      return this.getBattleList(player, page, pageSize)
    })

    this.onCall('get-qr-code', async () => {
      return await this._tlm.getQrCode()
    })

    this.onCall('check-qr-code-status', async (ptqrtoken: string) => {
      return await this._tlm.checkQrCodeStatus(ptqrtoken)
    })

    this.onCall('login-by-qq', async (qq: string, pskey: string) => {
      return await this._tlm.loginByQQ(qq, pskey)
    })
  }

  private _maintainTgpTicket() {
    this.reaction(
      () => this.state.settings.tgpTicket,
      (ticket) => {
        this._ta.setTgpTicket(ticket)
      },
      { fireImmediately: true }
    )
  }

  private _maintainTgpId() {
    this.reaction(
      () => this.state.settings.tgpId,
      (id) => {
        this._ta.setTgpId(id)
      },
      { fireImmediately: true }
    )
  }

  private async _checkExpiration() {
    if (this.state.settings.expired) {
      this.state.settings.expired = await this._ta.checkExpiration(this.state.settings.qq)
    }
  }
}

export const tgpApiModule = new TgpApiModule()
