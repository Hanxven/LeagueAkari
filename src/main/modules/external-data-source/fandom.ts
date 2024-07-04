import { FandomWikiChampBalanceDataSource } from '@shared/external-data-source/fandom/champ-balance'
import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { formatError } from '@shared/utils/errors'
import { comparer, computed, makeAutoObservable, observable, runInAction } from 'mobx'

import { ExternalDataSourceModule } from '.'
import { LcuSyncModule } from '../lcu-state-sync'

/**
 * unused currently
 */
const _MODES = [
  'ARAM', // 极地大乱斗
  'ARSR', // 随机英雄的峡谷模式
  'ASSASSINATE', // 血月杀
  'CHERRY', // 竞技场
  'CLASSIC', // 经典
  'DOOMBOTSTEEMO', // 大提莫节
  'FIRSTBLOOD', // 过载
  'KINGPORO', // 魄罗大作战
  'LCURGMDISABLED', // 测试模式
  'NEXUSBLITZ', // 极限闪击
  'ONEFORALL', // 克隆大作战
  'PRACTICETOOL', // 训练模式
  'SNOWURF', // 雪球的无限火力
  'TFT', // 云顶之弈
  'TUTORIAL_MODULE_1', // 新手教程1
  'TUTORIAL_MODULE_2', // 新手教程2
  'TUTORIAL_MODULE_3', // 新手教程3
  'ULTBOOK', // 终极魔典
  'URF' // 无限火力
]

export class ChampBalanceEdsState {
  fandom = new FandomWikiChampBalanceDataSource()

  static UPDATE_INTERVAL = 60 * 60 * 1e3

  data: {
    map: ChampBalanceMapV1
    updateAt: Date
  } | null = null

  currentDataSource: {
    name: string
    id: string
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
        this.data = { map: result, updateAt: this.fandom.updateAt }
        this.currentDataSource = { name: this.fandom.name, id: this.fandom.id }
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
  }

  private _setupStateSync() {
    this._edsm.simpleSync('balance/data', () => this.state.data)
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
