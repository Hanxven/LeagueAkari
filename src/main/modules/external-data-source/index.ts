import { MobxBasedModule } from '@shared/akari/mobx-based-module'
import { formatError } from '@shared/utils/errors'
import { computed } from 'mobx'

import { AppLogger, LogModule } from '../akari-core/log'
import { LcuSyncModule } from '../lcu-state-sync'
import { ExternalDataSourceState } from './state'

// 目前所有的可用模式 (截止到 2024-05-10)
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

export class ExternalDataSourceModule extends MobxBasedModule {
  public state = new ExternalDataSourceState()

  private _lcu: LcuSyncModule
  private _logger: AppLogger

  static BALANCE_MODES = new Map<string, string>([
    ['ARAM', 'aram'],
    ['ONEFORALL', 'ofa'],
    ['URF', 'urf'],
    ['CHERRY', 'ar'],
    ['ULTBOOK', 'usb']
  ])

  constructor() {
    super('external-data-source')
  }

  override async setup() {
    await super.setup()

    this._lcu = this.manager.getModule('lcu-state-sync')
    this._logger = this.manager.getModule<LogModule>('log').createLogger('external-data-source')

    this._setupStateSync()
    this._handleUpdateBalanceData()

    this._logger.info('初始化完成')
  }

  private _setupStateSync() {
    this.simpleSync('balance', () => this.state.balance.data)
  }

  private _handleUpdateBalanceData() {
    const gameInfo = computed(() => {
      if (!this._lcu.gameflow.session) {
        return null
      }

      return {
        gameMode: this._lcu.gameflow.session.map.gameMode,
        queueType: this._lcu.gameflow.session.gameData.queue.type
      }
    })

    this.autoDisposeReaction(
      () => gameInfo.get(),
      async (info) => {
        if (!info) {
          return
        }

        this._updateBalanceData(info.gameMode, info.queueType)
      }
    )
  }

  private async _updateBalanceData(gameMode: string, _queueType: string) {
    if (ExternalDataSourceModule.BALANCE_MODES.has(gameMode)) {
      try {
        this._logger.info(
          `更新英雄平衡性数据，数据源 ${this.state.balance.fandom.name}  ${this.state.balance.fandom.id} ${this.state.balance.fandom.version}`
        )
        await this.state.balance.updateData()
      } catch (error) {
        this._logger.warn(`获取英雄平衡性数据源时发生错误 ${formatError(error)}`)
      }
    }
  }
}
