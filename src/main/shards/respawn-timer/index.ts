import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { riotId, summonerName } from '@shared/utils/name'
import { comparer, runInAction } from 'mobx'

import { GameClientMain } from '../game-client'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { RespawnTimerSettings, RespawnTimerState } from './state'

@Shard(RespawnTimerMain.id)
export class RespawnTimerMain implements IAkariShardInitDispose {
  static id = 'respawn-timer-main'

  static POLL_INTERVAL = 1000

  public readonly settings = new RespawnTimerSettings()
  public readonly state: RespawnTimerState

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _timer: NodeJS.Timeout
  private _isStarted = false

  constructor(
    private readonly _gameClient: GameClientMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _settingFactory: SettingFactoryMain
  ) {
    this._log = _loggerFactory.create(RespawnTimerMain.id)
    this._setting = _settingFactory.register(
      RespawnTimerMain.id,
      {
        enabled: { default: false }
      },
      this.settings
    )
    this.state = new RespawnTimerState(this._lc.data)
  }

  async onInit() {
    await this._setting.applyToState()

    this._setting.onChange('enabled', async (v, { setter }) => {
      if (v && this._lc.data.gameflow.phase === 'InProgress') {
        this._startRespawnTimerPoll()
      } else if (v === false) {
        this._stopRespawnTimerPoll()
      }

      this.settings.setEnabled(v)
      await setter()
    })

    this._mobx.propSync(RespawnTimerMain.id, 'state', this.state, ['info'])
    this._mobx.propSync(RespawnTimerMain.id, 'settings', this.settings, ['enabled'])

    this._mobx.reaction(
      () => [this._lc.data.gameflow.phase, this.settings.enabled],
      ([phase, enabled]) => {
        if (phase === 'InProgress') {
          if (enabled) {
            this._startRespawnTimerPoll()
          }
        } else {
          runInAction(() => {
            this.state.info = {
              isDead: false,
              timeLeft: 0,
              totalTime: 0
            }
          })
          this._stopRespawnTimerPoll()
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    )
  }

  async onDispose() {
    this._stopRespawnTimerPoll()
  }

  private async _queryRespawnTime() {
    if (!this._lc.data.summoner.me) {
      this._log.warn('当前不存在召唤师信息, 可能是未加载')
      return
    }

    try {
      const playerList = (await this._gameClient.api.getLiveClientDataPlayerList()).data
      const self = playerList.find((p) => {
        if (p.riotId) {
          return p.riotId === riotId(this._lc.data.summoner.me)
        }

        if (p.summonerName) {
          return summonerName(p.summonerName) === riotId(this._lc.data.summoner.me)
        }

        return p.summonerName === this._lc.data.summoner.me?.internalName
      })

      if (self) {
        if (!this.state.info.isDead && self.isDead) {
          runInAction(() => (this.state.info.totalTime = self.respawnTimer))
        }

        runInAction(() => {
          this.state.info = {
            isDead: self.isDead,
            timeLeft: self.respawnTimer,
            totalTime: this.state.info.totalTime
          }
        })
      }
    } catch {}
  }

  private _startRespawnTimerPoll() {
    if (this._isStarted) {
      return
    }

    this._log.info('轮询开始')

    this._isStarted = true
    this._queryRespawnTime()
    this._timer = setInterval(() => this._queryRespawnTime(), RespawnTimerMain.POLL_INTERVAL)
  }

  private _stopRespawnTimerPoll() {
    if (!this._isStarted) {
      return
    }

    this._log.info('轮询结束')

    this._isStarted = false
    clearInterval(this._timer)

    runInAction(() => {
      this.state.info = {
        isDead: false,
        timeLeft: 0,
        totalTime: 0
      }
    })
  }
}
