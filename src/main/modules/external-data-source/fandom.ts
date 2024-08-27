import { FandomWikiChampBalanceDataSource } from '@shared/data-sources/fandom/champ-balance'
import { ChampBalanceMapV1 } from '@shared/data-sources/normalized/champ-balance'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, makeAutoObservable, observable, runInAction } from 'mobx'

import { ExternalDataSourceModule } from '.'
import { LcuSyncModule } from '../lcu-state-sync'

export class ChampBalanceEdsState {
  fandom = new FandomWikiChampBalanceDataSource()

  static UPDATE_INTERVAL = 60 * 60 * 1e3

  data: {
    map: ChampBalanceMapV1
    updateAt: Date
    dataSource: string
  } | null = null

  async updateData() {
    if (
      this.data &&
      Date.now() - this.fandom.updateAt.getTime() < ChampBalanceEdsState.UPDATE_INTERVAL
    ) {
      return
    }

    const result = await this.fandom.update()
    if (result) {
      if (!this.fandom.validate(result)) {
        throw new Error('数据格式未通过验证，数据源格式可能发生变化')
      }

      runInAction(() => {
        this.data = { map: result, updateAt: this.fandom.updateAt, dataSource: this.fandom.name }
      })
    }
  }

  constructor() {
    makeAutoObservable(this, {
      data: observable.ref
    })
  }
}

export class BalanceEds {
  public state = new ChampBalanceEdsState()

  private _lcu: LcuSyncModule

  static BALANCE_MODES = new Map<string, string>([
    ['ARAM', 'aram'],
    ['ONEFORALL', 'ofa'],
    ['URF', 'urf'],
    ['CHERRY', 'ar'],
    ['ULTBOOK', 'usb']
  ])

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._lcu = this._edsm.manager.getModule('lcu-state-sync')

    this._setupStateSync()
    this._handleUpdateBalanceData()
  }

  private _setupStateSync() {
    this._edsm.simpleSync('fandom/balance-data', () => this.state.data)
  }

  private _handleUpdateBalanceData() {
    const gameInfo = computed(
      () => {
        if (!this._lcu.gameflow.session) {
          return null
        }

        return {
          gameMode: this._lcu.gameflow.session.map.gameMode,
          queueType: this._lcu.gameflow.session.gameData.queue.type
        }
      },
      { equals: comparer.structural }
    )

    this._edsm.autoDisposeReaction(
      () => gameInfo.get(),
      async (info) => {
        if (!info) {
          return
        }

        this._updateBalanceData(info.gameMode, info.queueType)
      },
      { fireImmediately: true }
    )
  }

  private async _updateBalanceData(gameMode: string, _queueType: string) {
    if (BalanceEds.BALANCE_MODES.has(gameMode)) {
      try {
        this._edsm.logger.info(
          `尝试更新英雄平衡性数据，数据源 ${this.state.fandom.name}  ${this.state.fandom.id} ${this.state.fandom.version}`
        )
        await this.state.updateData()
        this._edsm.logger.info(
          `英雄平衡性数据更新完成 ${this.state.fandom.name}  ${this.state.fandom.id} ${this.state.fandom.version}`
        )
      } catch (error) {
        this._edsm.logger.warn(`获取英雄平衡性数据源时发生错误 ${formatError(error)}`)
      }
    }
  }
}
