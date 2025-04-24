import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { isTencentServer } from '@shared/data-sources/sgp/utils'
import { comparer } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RiotClientMain } from '../riot-client'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SgpMain } from '../sgp'
import { PlayerStalkingSettings, PlayerStalkingState, StalkedPlayer } from './state'

/**
 * 暂未启用此特性
 *
 * 观察给定的玩家列表, 当目标进入游戏时或变更状态时, 进行通知
 *
 * - 进入游戏通知, 游戏结束通知 (需要 SGP)
 */
@Shard(PlayerStalkingMain.id)
export class PlayerStalkingMain implements IAkariShardInitDispose {
  static id = 'player-stalking-main'

  public readonly state: PlayerStalkingState
  public readonly settings = new PlayerStalkingSettings()

  private readonly _setting: SetterSettingService
  private readonly _log: AkariLogger

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _sgp: SgpMain,
    private readonly _rc: RiotClientMain,
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _loggerFactory: LoggerFactoryMain
  ) {
    this._setting = _settingFactory.register(
      PlayerStalkingMain.id,
      {
        enabled: { default: this.settings.enabled },
        playersToStalk: { default: this.settings.playersToStalk },
        pollIntervalSeconds: { default: this.settings.pollIntervalSeconds }
      },
      this.settings
    )
    this._log = _loggerFactory.create(PlayerStalkingMain.id)
    this.state = new PlayerStalkingState(this._sgp.state)
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(PlayerStalkingMain.id, 'state', this.state, ['tracking'])

    this._mobx.propSync(PlayerStalkingMain.id, 'settings', this.settings, [
      'enabled',
      'playersToStalk',
      'pollIntervalSeconds' // TODO
    ])

    this._handleTimePlayer()
    this._handleIpcCall()
  }

  private async _getCombinedSummonerInfo(puuid: string, sgpServerId: string) {
    const summoner = this._sgp.getSummonerLcuFormat(puuid, sgpServerId)
    const nameset = this._rc.api.playerAccount.getPlayerAccountNameset([puuid])

    const [a, b] = await Promise.allSettled([summoner, nameset])

    if (a.status === 'rejected') {
      throw a.reason
    }

    if (b.status === 'rejected') {
      throw b.reason
    }

    if (a.value === null || b.value.data.namesets.length === 0) {
      return null
    }

    a.value.tagLine = b.value.data.namesets[0].gnt.tagLine
    a.value.gameName = b.value.data.namesets[0].gnt.gameName

    return a.value
  }

  private async _fetchPlayer(puuid: string, sgpServerId: string) {
    const summoner = this._getCombinedSummonerInfo(puuid, sgpServerId)
    const spectator = this._sgp.getSpectatorGameflow(puuid, sgpServerId)

    const [n, x] = await Promise.allSettled([summoner, spectator])

    if (n.status === 'rejected') {
      this._log.warn('获取玩家信息时出现问题', puuid, sgpServerId, n.reason)
      return null
    }

    // 查无此人? 纠正之
    if (n.value === null) {
      this._log.warn('目标玩家不存在, 已清除', puuid, sgpServerId)
      this.state.clearTimer(puuid)
      this.settings.setPlayersToStalk(this.settings.playersToStalk.filter((p) => p.puuid !== puuid))
      return null
    }

    return {
      summoner: n.value,
      spectator: x.status === 'fulfilled' ? x.value : null
    }
  }

  private async setTimeoutPollTask(player: StalkedPlayer) {
    const data = await this._fetchPlayer(player.puuid, player.sgpServerId)

    if (data === null) {
      this.state.updatePlayer(player.puuid, null)
      return
    } else {
      this.state.updatePlayer(player.puuid, {
        ...data,
        lastUpdated: Date.now()
      })
    }

    this.state.setTimer(
      player.puuid,
      setTimeout(() => this.setTimeoutPollTask(player), this.settings.pollIntervalSeconds * 1000)
    )
  }

  private _patchTasks() {
    const canUpdate = (p: StalkedPlayer) => {
      if (!this.state.isSgpAvailable) {
        return false
      }

      if (isTencentServer(this._sgp.state.availability.sgpServerId)) {
        return this._sgp.state.sgpServerConfig.tencentServerSpectatorInteroperability.includes(
          p.sgpServerId
        )
      }

      return this._sgp.state.availability.sgpServerId === p.sgpServerId
    }

    // 删掉不在设置项中但仍有计时器的
    for (const puuid of this.state.timers.keys()) {
      if (!this.settings.playersToStalk.some((p) => p.puuid === puuid)) {
        this.state.clearTimer(puuid)
        this.state.updatePlayer(puuid, null)
      }
    }

    const tracked: string[] = []
    this.settings.playersToStalk.forEach((p) => {
      if (p.enabled && canUpdate(p)) {
        if (!this.state.timers.has(p.puuid)) {
          this.setTimeoutPollTask(p)
          tracked.push(p.puuid)
        }
      } else {
        this.state.clearTimer(p.puuid)
        this.state.updatePlayer(p.puuid, null)
      }
    })

    this._log.info('更新追踪列表', tracked)
  }

  private _handleTimePlayer() {
    // DO NOT TIME OTHERS
    this._mobx.reaction(
      () =>
        [this.settings.enabled, this.state.isSgpAvailable, this.settings.playersToStalk] as const,
      ([enabled, available, _players]) => {
        if (!enabled || !available) {
          this.state.clearTimers()
          this.state.clearTracking()
          return
        }

        this._patchTasks()
      },
      {
        fireImmediately: true,
        equals: comparer.shallow
      }
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      PlayerStalkingMain.id,
      'addPlayer',
      async (_, puuid: string, sgpServerId: string) => {
        const player = this.settings.playersToStalk.find((p) => p.puuid === puuid)

        if (player) {
          this._log.warn('玩家已存在', puuid, sgpServerId)
          return
        }

        this._setting.set('playersToStalk', [
          ...this.settings.playersToStalk,
          {
            enabled: true,
            puuid,
            sgpServerId
          }
        ])
      }
    )

    this._ipc.onCall(PlayerStalkingMain.id, 'removePlayer', async (_, puuid: string) => {
      const players = this.settings.playersToStalk.filter((p) => p.puuid !== puuid)
      this._setting.set('playersToStalk', players)
    })

    this._ipc.onCall(
      PlayerStalkingMain.id,
      'enabledPlayer',
      async (_, puuid: string, enabled: boolean) => {
        const player = this.settings.playersToStalk.find((p) => p.puuid === puuid)

        if (!player) {
          this._log.warn('玩家不存在', puuid)
          return
        }

        const updated = this.settings.playersToStalk.map((p) => {
          if (p.puuid === puuid) {
            return {
              ...p,
              enabled
            }
          }

          return p
        })

        this._setting.set('playersToStalk', updated)
      }
    )
  }

  async onDispose() {}
}
