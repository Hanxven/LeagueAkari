import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { getPlayerList } from '@main/http-api/game-client'
import { runInAction } from 'mobx'

import { AppLogger, LogModule } from '../akari-core/log'
import { LcuSyncModule } from '../lcu-state-sync'
import { RespawnTimerState } from './state'

export class RespawnTimerModule extends MobxBasedBasicModule {
  public state = new RespawnTimerState()

  private _lcu: LcuSyncModule
  private _logger: AppLogger

  private _timer: NodeJS.Timeout
  private _isStarted = false

  static POLL_INTERVAL = 1000

  constructor() {
    super('respawn-timer')
  }

  override async setup() {
    await super.setup()

    this._lcu = this.manager.getModule('lcu-state-sync')
    this._logger = this.manager.getModule<LogModule>('log').createLogger('respawn-timer')

    await this._loadSettings()
    this._setupStateSync()
    this._setupMethodCall()

    this.autoDisposeReaction(
      () => this._lcu.gameflow.phase,
      (phase) => {
        if (phase === 'InProgress') {
          if (this.state.settings.enabled) {
            this._startRespawnTimerPoll()
          }
        } else {
          runInAction(() => {
            this.state.isDead = false
            this.state.timeLeft = 0
          })
          this._stopRespawnTimerPoll()
        }
      }
    )

    this._logger.info('初始化完成')
  }

  private async _loadSettings() {
    this.state.settings.setEnabled(
      await this._sm.settings.get('respawn-timer/enabled', this.state.settings.enabled)
    )
  }

  private async _queryRespawnTime() {
    if (!this._lcu.summoner.me) {
      this._logger.warn('召唤师信息未正确加载')
      return
    }

    try {
      const playerList = (await getPlayerList()).data
      const self = playerList.find((p) => {
        // 2024-04-27 之后，有 Tag 了
        if (!p.summonerName.includes('#')) {
          return (
            p.summonerName === this._lcu.summoner.me?.gameName || this._lcu.summoner.me?.displayName
          )
        }

        const isNameEqualed =
          p.summonerName === this._lcu.summoner.me?.gameName || this._lcu.summoner.me?.displayName

        // 额外保险步骤
        const championId = this.state.selfChampionInGameSelection
        if (championId && this._lcu.gameData.champions) {
          return isNameEqualed && this._lcu.gameData.champions[championId]?.name === p.championName
        }

        return isNameEqualed
      })

      if (self) {
        if (!this.state.isDead && self.isDead) {
          runInAction(() => (this.state.totalTime = self.respawnTimer))
        }

        runInAction(() => {
          this.state.isDead = self.isDead
          this.state.timeLeft = self.respawnTimer
        })
      }
    } catch {}
  }

  private _startRespawnTimerPoll() {
    if (this._isStarted) {
      return
    }

    this._logger.info('轮询开始')

    this._isStarted = true
    this._queryRespawnTime()
    this._timer = setInterval(() => this._queryRespawnTime(), RespawnTimerModule.POLL_INTERVAL)
  }

  private _stopRespawnTimerPoll() {
    if (!this._isStarted) {
      return
    }

    this._logger.info('轮询结束')

    this._isStarted = false
    clearInterval(this._timer)

    runInAction(() => {
      this.state.isDead = false
      this.state.timeLeft = 0
    })
  }

  private _setupStateSync() {
    this.simpleSync('settings/enabled', () => this.state.settings.enabled)
    this.simpleSync('is-dead', () => this.state.isDead)
    this.simpleSync('time-left', () => this.state.timeLeft)
    this.simpleSync('total-time', () => this.state.totalTime)
  }

  private _setupMethodCall() {
    this.onCall('set-setting/enabled', async (enabled) => {
      if (enabled && this._lcu.gameflow.phase === 'InProgress') {
        this._startRespawnTimerPoll()
      } else if (enabled === false) {
        this._stopRespawnTimerPoll()
      }

      this.state.settings.setEnabled(enabled)
      await this._sm.settings.set('respawn-timer/enabled', enabled)
    })
  }
}

export const respawnTimerModule = new RespawnTimerModule()
