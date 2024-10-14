import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { comparer, computed, runInAction } from 'mobx'

import { GameClientMain } from '../game-client'
import { LeagueClientMain } from '../league-client'
import { AkariLoggerInstance, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { MobxSettingService } from '../setting-factory/mobx-setting-service'
import { RespawnTimerState } from './state'

export class RespawnTimerMain implements IAkariShardInitDispose {
  static id = 'respawn-timer-main'
  static dependencies = [
    'game-client-main',
    'logger-factory-main',
    'league-client-main',
    'setting-factory-main',
    'mobx-utils-main'
  ]

  static POLL_INTERVAL = 1000

  public readonly state: RespawnTimerState

  private readonly _gameClient: GameClientMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLoggerInstance
  private readonly _leagueClient: LeagueClientMain
  private readonly _mobx: MobxUtilsMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _setting: MobxSettingService

  private _timer: NodeJS.Timeout
  private _isStarted = false

  constructor(deps: any) {
    this._gameClient = deps['game-client-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(RespawnTimerMain.id)
    this._leagueClient = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._settingFactory = deps['setting-factory-main']
    this._setting = this._settingFactory.create(
      RespawnTimerMain.id,
      {
        enabled: {
          default: false,
          onChange: async (v: boolean, { setter }) => {
            if (v && this._leagueClient.data.gameflow.phase === 'InProgress') {
              this._startRespawnTimerPoll()
            } else if (v === false) {
              this._stopRespawnTimerPoll()
            }

            this.state.settings.setEnabled(v)
            await setter()
          }
        }
      },
      this.state.settings
    )
    this.state = new RespawnTimerState(this._leagueClient.data)
  }

  async onInit() {
    await this._setting.applySettingsToState()

    this._setting

    this._mobx.propSync(RespawnTimerMain.id, 'state', this.state, ['info', 'settings.enabled'])

    this._mobx.reaction(
      () => [this._leagueClient.data.gameflow.phase, this.state.settings.enabled],
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
      { equals: comparer.shallow }
    )
  }

  async onDispose() {
    this._stopRespawnTimerPoll()
  }

  private async _queryRespawnTime() {
    if (!this._leagueClient.data.summoner.me) {
      this._log.warn('当前不存在召唤师信息, 可能是未加载')
      return
    }

    try {
      const playerList = (await this._gameClient.api.getLiveClientDataPlayerList()).data
      const self = playerList.find((p) => {
        // 2024-04-27 之后，有 Tag 了
        if (!p.summonerName.includes('#')) {
          return (
            p.summonerName === this._leagueClient.data.summoner.me?.gameName ||
            this._leagueClient.data.summoner.me?.displayName
          )
        }

        const isNameEqualed =
          p.summonerName === this._leagueClient.data.summoner.me?.gameName ||
          this._leagueClient.data.summoner.me?.displayName

        // 额外保险步骤
        const championId = this.state.selfChampionInGameSelection
        if (championId && this._leagueClient.data.gameData.champions) {
          return (
            isNameEqualed &&
            this._leagueClient.data.gameData.champions[championId]?.name === p.championName
          )
        }

        return isNameEqualed
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
